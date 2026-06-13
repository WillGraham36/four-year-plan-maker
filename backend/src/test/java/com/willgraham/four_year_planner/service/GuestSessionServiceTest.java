package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.config.GuestSessionProperties;
import com.willgraham.four_year_planner.model.GuestSession;
import com.willgraham.four_year_planner.model.GuestUsageStats;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.repository.GuestSessionRepository;
import com.willgraham.four_year_planner.repository.GuestUsageStatsRepository;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import com.willgraham.four_year_planner.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GuestSessionServiceTest {
    private final GuestSessionProperties guestSessionProperties = new GuestSessionProperties();
    private final GuestSessionRepository guestSessionRepository = mock(GuestSessionRepository.class);
    private final GuestUsageStatsRepository guestUsageStatsRepository = mock(GuestUsageStatsRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserCourseRepository userCourseRepository = mock(UserCourseRepository.class);

    private final GuestSessionService guestSessionService = new GuestSessionService(
            guestSessionProperties,
            guestSessionRepository,
            guestUsageStatsRepository,
            userRepository,
            userCourseRepository
    );

    @BeforeEach
    void setUp() {
        guestSessionProperties.setSessionDays(30);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(guestSessionRepository.save(any(GuestSession.class))).thenAnswer(invocation -> {
            GuestSession session = invocation.getArgument(0);
            if (session.getId() == null) {
                session.setId(1L);
            }
            return session;
        });
        when(guestUsageStatsRepository.findById(any(LocalDate.class)))
                .thenAnswer(invocation -> Optional.of(new GuestUsageStats(invocation.getArgument(0))));
    }

    @Test
    void createOrResumeGuestSessionCreatesGuestUserAndStoresOnlyTokenHash() {
        GuestSessionService.GuestSessionCreation result =
                guestSessionService.createOrResumeGuestSession(null);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<GuestSession> sessionCaptor = ArgumentCaptor.forClass(GuestSession.class);
        verify(userRepository).save(userCaptor.capture());
        verify(guestSessionRepository).save(sessionCaptor.capture());

        User savedUser = userCaptor.getValue();
        GuestSession savedSession = sessionCaptor.getValue();

        assertTrue(result.created());
        assertTrue(savedUser.isGuest());
        assertTrue(savedUser.getId().startsWith("guest_"));
        assertNotNull(savedUser.getGuestExpiresAt());
        assertEquals(savedUser.getId(), savedSession.getUserId());
        assertNotEquals(result.rawToken(), savedSession.getTokenHash());
        assertEquals(guestSessionService.hashToken(result.rawToken()), savedSession.getTokenHash());
    }

    @Test
    void createOrResumeGuestSessionReusesActiveGuestSession() {
        String rawToken = "existing-token";
        GuestSession session = activeSession("guest_123");
        User guestUser = guestUser("guest_123");

        when(guestSessionRepository.findByTokenHash(guestSessionService.hashToken(rawToken)))
                .thenReturn(Optional.of(session));
        when(userRepository.findById("guest_123")).thenReturn(Optional.of(guestUser));

        GuestSessionService.GuestSessionCreation result =
                guestSessionService.createOrResumeGuestSession(rawToken);

        assertFalse(result.created());
        assertEquals(rawToken, result.rawToken());
        assertEquals(session, result.session());
        verify(guestUsageStatsRepository, never()).save(any());
    }

    @Test
    void migrateGuestToAuthenticatedUserCopiesPlannerDataAndInvalidatesGuestSessions() {
        String rawToken = "guest-token";
        GuestSession session = activeSession("guest_123");
        User guestUser = guestUser("guest_123");
        guestUser.setStartSemester(new Semester(Term.FALL, 2024));
        guestUser.setEndSemester(new Semester(Term.SPRING, 2028));
        guestUser.setMajor("Computer Science");
        guestUser.setMinor("Statistics Minor");
        guestUser.setNote("keep this note");

        when(guestSessionRepository.findByTokenHash(guestSessionService.hashToken(rawToken)))
                .thenReturn(Optional.of(session));
        when(userRepository.findById("guest_123")).thenReturn(Optional.of(guestUser));
        when(userRepository.findById("user_123")).thenReturn(Optional.empty());
        when(userCourseRepository.reassignUserCourses("guest_123", "user_123")).thenReturn(2);
        when(guestSessionRepository.findByUserId("guest_123")).thenReturn(List.of(session));

        GuestSessionService.MigrationResult result =
                guestSessionService.migrateGuestToAuthenticatedUser(rawToken, "user_123");

        ArgumentCaptor<User> savedUsers = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(savedUsers.capture());
        User authenticatedUser = savedUsers.getAllValues().stream()
                .filter(user -> "user_123".equals(user.getId()))
                .findFirst()
                .orElseThrow();

        assertTrue(result.migrated());
        assertEquals(2, result.movedCourses());
        assertEquals(1, result.invalidatedSessions());
        assertEquals(new Semester(Term.FALL, 2024), authenticatedUser.getStartSemester());
        assertEquals(new Semester(Term.SPRING, 2028), authenticatedUser.getEndSemester());
        assertEquals("Computer Science", authenticatedUser.getMajor());
        assertEquals("Statistics Minor", authenticatedUser.getMinor());
        assertEquals("keep this note", authenticatedUser.getNote());
        assertFalse(authenticatedUser.isGuest());
        assertNull(authenticatedUser.getGuestExpiresAt());
        assertNotNull(session.getInvalidatedAt());
        assertEquals("user_123", session.getMigratedToUserId());
        verify(userRepository).delete(guestUser);
    }

    @Test
    void resolveSessionInvalidatesExpiredSession() {
        String rawToken = "expired-token";
        GuestSession session = activeSession("guest_123");
        session.setExpiresAt(Instant.now().minusSeconds(1));

        when(guestSessionRepository.findByTokenHash(guestSessionService.hashToken(rawToken)))
                .thenReturn(Optional.of(session));

        Optional<GuestSessionService.ResolvedGuestSession> result =
                guestSessionService.resolveSession(rawToken);

        assertTrue(result.isEmpty());
        assertNotNull(session.getInvalidatedAt());
        verify(guestSessionRepository).save(session);
        verify(userRepository, never()).findById(any());
    }

    private GuestSession activeSession(String userId) {
        Instant now = Instant.now();
        GuestSession session = new GuestSession();
        session.setId(1L);
        session.setUserId(userId);
        session.setTokenHash("hash");
        session.setCreatedAt(now);
        session.setLastSeenAt(now);
        session.setExpiresAt(now.plusSeconds(3600));
        return session;
    }

    private User guestUser(String userId) {
        User user = new User();
        user.setId(userId);
        user.setGuest(true);
        return user;
    }
}
