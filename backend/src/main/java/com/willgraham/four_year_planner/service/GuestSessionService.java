package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.config.GuestSessionProperties;
import com.willgraham.four_year_planner.model.GuestSession;
import com.willgraham.four_year_planner.model.GuestUsageStats;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.repository.GuestSessionRepository;
import com.willgraham.four_year_planner.repository.GuestUsageStatsRepository;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import com.willgraham.four_year_planner.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
@Slf4j
public class GuestSessionService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String GUEST_USER_ID_PREFIX = "guest_";
    private static final String PENDING_GUEST_TOKEN_PREFIX = "tp_pending_guest_";
    private static final int PENDING_GUEST_TOKEN_RANDOM_LENGTH = 43;
    private static final Pattern PENDING_GUEST_TOKEN_PATTERN = Pattern.compile(
            "^" + PENDING_GUEST_TOKEN_PREFIX + "[A-Za-z0-9_-]{" + PENDING_GUEST_TOKEN_RANDOM_LENGTH + ",}$"
    );

    private final GuestSessionProperties guestSessionProperties;
    private final GuestSessionRepository guestSessionRepository;
    private final GuestUsageStatsRepository guestUsageStatsRepository;
    private final UserRepository userRepository;
    private final UserCourseRepository userCourseRepository;

    @Transactional
    public GuestSessionCreation createOrResumeGuestSession(String rawToken) {
        Optional<ResolvedGuestSession> existingSession = resolveSession(rawToken);
        if (existingSession.isPresent()) {
            GuestSession session = existingSession.get().session();
            return new GuestSessionCreation(rawToken, session, false);
        }

        Instant now = Instant.now();
        String newRawToken = generateRawToken();
        GuestSession savedSession = createGuestSession(newRawToken, now);
        return new GuestSessionCreation(newRawToken, savedSession, true);
    }

    @Transactional
    public Optional<ResolvedGuestSession> resolveSession(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        String tokenHash = hashToken(rawToken);
        if (isPendingGuestToken(rawToken)) {
            // Serializes first-use materialization for the same pending token across app instances.
            guestSessionRepository.lockPendingTokenHash(tokenHash);
        }

        Optional<GuestSession> sessionOpt = guestSessionRepository.findByTokenHash(tokenHash);
        if (sessionOpt.isEmpty()) {
            if (isPendingGuestToken(rawToken)) {
                GuestSession createdSession = createGuestSession(rawToken, now);
                return Optional.of(new ResolvedGuestSession(
                        createdSession.getUserId(),
                        createdSession.getId(),
                        createdSession
                ));
            }

            return Optional.empty();
        }

        GuestSession session = sessionOpt.get();
        if (!session.isActive(now)) {
            invalidateSession(session, null, now);
            return Optional.empty();
        }

        Optional<User> userOpt = userRepository.findById(session.getUserId());
        if (userOpt.isEmpty() || !userOpt.get().isGuest()) {
            invalidateSession(session, null, now);
            return Optional.empty();
        }

        User user = userOpt.get();
        session.setLastSeenAt(now);
        user.setGuestLastSeenAt(now);
        user.setGuestExpiresAt(session.getExpiresAt());
        guestSessionRepository.save(session);
        userRepository.save(user);

        return Optional.of(new ResolvedGuestSession(session.getUserId(), session.getId(), session));
    }

    @Transactional
    public MigrationResult migrateGuestToAuthenticatedUser(String rawToken, String authenticatedUserId) {
        if (rawToken == null || rawToken.isBlank()) {
            return new MigrationResult(false, 0, 0, "No guest session was present");
        }

        Instant now = Instant.now();
        Optional<GuestSession> sessionOpt = guestSessionRepository.findByTokenHash(hashToken(rawToken));
        if (sessionOpt.isEmpty()) {
            return new MigrationResult(false, 0, 0, "Guest session was not found");
        }

        GuestSession session = sessionOpt.get();
        if (!session.isActive(now)) {
            invalidateSession(session, null, now);
            return new MigrationResult(false, 0, 1, "Guest session expired");
        }

        Optional<User> guestOpt = userRepository.findById(session.getUserId());
        if (guestOpt.isEmpty() || !guestOpt.get().isGuest()) {
            invalidateSession(session, authenticatedUserId, now);
            return new MigrationResult(false, 0, 1, "Guest account was no longer available");
        }

        User guest = guestOpt.get();
        Optional<User> authenticatedUserOpt = userRepository.findById(authenticatedUserId);
        if (authenticatedUserOpt.isPresent() && hasSavedPlannerData(authenticatedUserOpt.get())) {
            return discardGuestData(guest, authenticatedUserId, now);
        }

        User authenticatedUser = authenticatedUserOpt
                .orElseGet(() -> {
                    User user = new User();
                    user.setId(authenticatedUserId);
                    return user;
                });

        mergeGuestUserData(guest, authenticatedUser);
        authenticatedUser.setGuest(false);
        authenticatedUser.setGuestCreatedAt(null);
        authenticatedUser.setGuestLastSeenAt(null);
        authenticatedUser.setGuestExpiresAt(null);
        authenticatedUser.setMigratedToUserId(null);
        userRepository.save(authenticatedUser);

        int movedCourses = userCourseRepository.reassignUserCourses(guest.getId(), authenticatedUserId);
        int invalidatedSessions = invalidateGuestSessions(guest.getId(), authenticatedUserId, now);

        guest.setMigratedToUserId(authenticatedUserId);
        userRepository.save(guest);
        userRepository.delete(guest);

        incrementStats(stats -> {
            stats.setMigratedGuestUsers(stats.getMigratedGuestUsers() + 1);
            stats.setInvalidatedGuestSessions(stats.getInvalidatedGuestSessions() + invalidatedSessions);
        });

        return new MigrationResult(true, movedCourses, invalidatedSessions, "Guest data migrated");
    }

    private MigrationResult discardGuestData(User guest, String authenticatedUserId, Instant now) {
        int deletedCourses = userCourseRepository.deleteByUserId(guest.getId());
        int invalidatedSessions = invalidateGuestSessions(guest.getId(), authenticatedUserId, now);
        userRepository.delete(guest);

        incrementStats(stats ->
                stats.setInvalidatedGuestSessions(stats.getInvalidatedGuestSessions() + invalidatedSessions));

        log.info(
                "Discarded guest data during sign-in because authenticated account already has planner data " +
                        "(guestUserId={}, authenticatedUserId={}, deletedCourses={}, invalidatedSessions={})",
                guest.getId(),
                authenticatedUserId,
                deletedCourses,
                invalidatedSessions
        );

        return new MigrationResult(false, 0, invalidatedSessions, "Signed-in account data kept");
    }

    @Transactional
    @Scheduled(cron = "${app.guest.cleanup-cron:0 17 3 * * *}")
    public void cleanupInactiveGuestAccounts() {
        Instant now = Instant.now();
        Instant cutoff = now.minus(guestSessionProperties.getCleanupInactiveDays(), ChronoUnit.DAYS);

        List<GuestSession> expiredSessions = guestSessionRepository.findByInvalidatedAtIsNullAndExpiresAtBefore(now);
        expiredSessions.forEach(session -> session.setInvalidatedAt(now));
        guestSessionRepository.saveAll(expiredSessions);

        List<String> inactiveGuestUserIds = userRepository.findInactiveGuestUserIds(cutoff, now);
        int deletedUsers = 0;
        int invalidatedSessions = expiredSessions.size();

        for (String userId : inactiveGuestUserIds) {
            Optional<User> guestOpt = userRepository.findById(userId);
            if (guestOpt.isEmpty() || !guestOpt.get().isGuest()) {
                continue;
            }

            invalidatedSessions += invalidateGuestSessions(userId, null, now);
            userCourseRepository.deleteByUserId(userId);
            userRepository.delete(guestOpt.get());
            deletedUsers++;
        }

        int finalDeletedUsers = deletedUsers;
        int finalInvalidatedSessions = invalidatedSessions;
        incrementStats(stats -> {
            stats.setCleanupRuns(stats.getCleanupRuns() + 1);
            stats.setDeletedGuestUsers(stats.getDeletedGuestUsers() + finalDeletedUsers);
            stats.setInvalidatedGuestSessions(stats.getInvalidatedGuestSessions() + finalInvalidatedSessions);
        });

        log.info(
                "Guest cleanup completed (deletedUsers={}, invalidatedSessions={})",
                deletedUsers,
                invalidatedSessions
        );
    }

    public boolean isOnboarded(String userId) {
        return userRepository.findById(userId)
                .map(user -> user.getStartSemester() != null
                        && user.getEndSemester() != null
                        && user.getMajor() != null
                        && !user.getMajor().isBlank())
                .orElse(false);
    }

    private boolean hasSavedPlannerData(User user) {
        return user.getStartSemester() != null
                || user.getEndSemester() != null
                || !isBlank(user.getMajor())
                || !isBlank(user.getMinor())
                || user.getTrack() != null
                || !isBlank(user.getULConcentration())
                || !isBlank(user.getNote())
                || !isEmpty(user.getOffSemesters())
                || !isEmpty(user.getCompletedSemesters())
                || userCourseRepository.existsByUserId(user.getId());
    }

    private void mergeGuestUserData(User guest, User authenticatedUser) {
        boolean authenticatedUserNeedsOnboarding = authenticatedUser.getStartSemester() == null
                || authenticatedUser.getEndSemester() == null
                || authenticatedUser.getMajor() == null
                || authenticatedUser.getMajor().isBlank();

        if (authenticatedUserNeedsOnboarding) {
            authenticatedUser.setStartSemester(copySemester(guest.getStartSemester()));
            authenticatedUser.setEndSemester(copySemester(guest.getEndSemester()));
            authenticatedUser.setMajor(guest.getMajor());
            authenticatedUser.setMinor(guest.getMinor());
            authenticatedUser.setTrack(guest.getTrack());
            authenticatedUser.setULConcentration(guest.getULConcentration());
            authenticatedUser.setNote(guest.getNote());
        } else {
            if (isBlank(authenticatedUser.getULConcentration()) && !isBlank(guest.getULConcentration())) {
                authenticatedUser.setULConcentration(guest.getULConcentration());
            }
            if (isBlank(authenticatedUser.getNote()) && !isBlank(guest.getNote())) {
                authenticatedUser.setNote(guest.getNote());
            }
        }

        authenticatedUser.setOffSemesters(mergeSemesters(authenticatedUser.getOffSemesters(), guest.getOffSemesters()));
        authenticatedUser.setCompletedSemesters(mergeSemesters(
                authenticatedUser.getCompletedSemesters(),
                guest.getCompletedSemesters()
        ));
    }

    private List<Semester> mergeSemesters(List<Semester> existing, List<Semester> incoming) {
        List<Semester> result = existing == null ? new ArrayList<>() : new ArrayList<>(existing);
        if (incoming == null) {
            return result;
        }

        incoming.stream()
                .map(this::copySemester)
                .filter(semester -> semester != null && !result.contains(semester))
                .forEach(result::add);
        return result;
    }

    private Semester copySemester(Semester semester) {
        if (semester == null) {
            return null;
        }
        return new Semester(semester.getTerm(), semester.getYear());
    }

    private int invalidateGuestSessions(String guestUserId, String migratedToUserId, Instant now) {
        List<GuestSession> sessions = guestSessionRepository.findByUserId(guestUserId);
        int invalidated = 0;
        for (GuestSession guestSession : sessions) {
            if (guestSession.getInvalidatedAt() == null) {
                guestSession.setInvalidatedAt(now);
                invalidated++;
            }
            guestSession.setMigratedToUserId(migratedToUserId);
        }
        guestSessionRepository.saveAll(sessions);
        return invalidated;
    }

    private void invalidateSession(GuestSession session, String migratedToUserId, Instant now) {
        if (session.getInvalidatedAt() == null) {
            session.setInvalidatedAt(now);
            session.setMigratedToUserId(migratedToUserId);
            guestSessionRepository.save(session);
        }
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required for guest token hashing", ex);
        }
    }

    private GuestSession createGuestSession(String rawToken, Instant now) {
        String guestUserId = GUEST_USER_ID_PREFIX + UUID.randomUUID();
        User guestUser = new User();
        guestUser.setId(guestUserId);
        guestUser.setGuest(true);
        guestUser.setGuestCreatedAt(now);
        guestUser.setGuestLastSeenAt(now);
        guestUser.setGuestExpiresAt(expiresAt(now));
        userRepository.save(guestUser);

        GuestSession session = new GuestSession();
        session.setTokenHash(hashToken(rawToken));
        session.setUserId(guestUserId);
        session.setCreatedAt(now);
        session.setLastSeenAt(now);
        session.setExpiresAt(guestUser.getGuestExpiresAt());
        GuestSession savedSession = guestSessionRepository.save(session);

        incrementStats(stats -> stats.setCreatedGuestUsers(stats.getCreatedGuestUsers() + 1));
        return savedSession;
    }

    private boolean isPendingGuestToken(String rawToken) {
        return PENDING_GUEST_TOKEN_PATTERN.matcher(rawToken).matches();
    }

    private Instant expiresAt(Instant now) {
        return now.plus(guestSessionProperties.getSessionDays(), ChronoUnit.DAYS);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isEmpty(List<?> values) {
        return values == null || values.isEmpty();
    }

    private void incrementStats(StatsUpdater updater) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        GuestUsageStats stats = guestUsageStatsRepository.findById(today)
                .orElseGet(() -> new GuestUsageStats(today));
        updater.update(stats);
        stats.setLastUpdatedAt(Instant.now());
        guestUsageStatsRepository.save(stats);
    }

    private interface StatsUpdater {
        void update(GuestUsageStats stats);
    }

    public record GuestSessionCreation(String rawToken, GuestSession session, boolean created) {
    }

    public record ResolvedGuestSession(String userId, Long sessionId, GuestSession session) {
    }

    public record MigrationResult(boolean migrated, int movedCourses, int invalidatedSessions, String message) {
    }
}
