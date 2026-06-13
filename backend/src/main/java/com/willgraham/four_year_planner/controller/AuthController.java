package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.config.GuestSessionProperties;
import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CurrentUserResponseDto;
import com.willgraham.four_year_planner.service.GuestSessionService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final GuestSessionProperties guestSessionProperties;
    private final GuestSessionService guestSessionService;

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<CurrentUserResponseDto>> createGuestSession(
            HttpServletRequest request,
            Authentication authentication
    ) {
        if (authentication != null && authentication.isAuthenticated() && !AuthUtils.isGuest(authentication)) {
            String userId = AuthUtils.getCurrentUserId(authentication);
            return ResponseEntity.ok(ApiResponse.success(
                    new CurrentUserResponseDto(true, false, userId, guestSessionService.isOnboarded(userId), null),
                    "Already signed in"
            ));
        }

        GuestSessionService.GuestSessionCreation guestSession =
                guestSessionService.createOrResumeGuestSession(readGuestCookie(request).orElse(null));
        CurrentUserResponseDto response = new CurrentUserResponseDto(
                true,
                true,
                guestSession.session().getUserId(),
                guestSessionService.isOnboarded(guestSession.session().getUserId()),
                guestSession.session().getExpiresAt()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createGuestCookie(guestSession.rawToken()).toString())
                .body(ApiResponse.success(response, guestSession.created() ? "Guest session created" : "Guest session restored"));
    }

    @GetMapping("/session")
    public ResponseEntity<ApiResponse<CurrentUserResponseDto>> getCurrentSession(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.ok(ApiResponse.success(CurrentUserResponseDto.anonymous(), "No active session"));
        }

        String userId = AuthUtils.getCurrentUserId(authentication);
        boolean guest = AuthUtils.isGuest(authentication);
        CurrentUserResponseDto response = new CurrentUserResponseDto(
                true,
                guest,
                userId,
                guestSessionService.isOnboarded(userId),
                null
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Session resolved"));
    }

    @PostMapping("/migrate-guest")
    public ResponseEntity<ApiResponse<CurrentUserResponseDto>> migrateGuestSession(
            HttpServletRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated() || AuthUtils.isGuest(authentication)) {
            throw new AuthenticationCredentialsNotFoundException("A Clerk account is required to migrate guest data");
        }

        String userId = AuthUtils.getCurrentUserId(authentication);
        GuestSessionService.MigrationResult migrationResult =
                guestSessionService.migrateGuestToAuthenticatedUser(readGuestCookie(request).orElse(null), userId);

        CurrentUserResponseDto response = new CurrentUserResponseDto(
                true,
                false,
                userId,
                guestSessionService.isOnboarded(userId),
                null
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteGuestCookie().toString())
                .body(ApiResponse.success(response, migrationResult.message()));
    }

    private Optional<String> readGuestCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> guestSessionProperties.getCookieName().equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }

    private ResponseCookie createGuestCookie(String rawToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(guestSessionProperties.getCookieName(), rawToken)
                .httpOnly(true)
                .secure(guestSessionProperties.isCookieSecure())
                .sameSite(guestSessionProperties.getCookieSameSite())
                .path("/")
                .maxAge(Duration.ofDays(guestSessionProperties.getSessionDays()));

        if (guestSessionProperties.getCookieDomain() != null && !guestSessionProperties.getCookieDomain().isBlank()) {
            builder.domain(guestSessionProperties.getCookieDomain());
        }

        return builder.build();
    }

    private ResponseCookie deleteGuestCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(guestSessionProperties.getCookieName(), "")
                .httpOnly(true)
                .secure(guestSessionProperties.isCookieSecure())
                .sameSite(guestSessionProperties.getCookieSameSite())
                .path("/")
                .maxAge(Duration.ZERO);

        if (guestSessionProperties.getCookieDomain() != null && !guestSessionProperties.getCookieDomain().isBlank()) {
            builder.domain(guestSessionProperties.getCookieDomain());
        }

        return builder.build();
    }
}
