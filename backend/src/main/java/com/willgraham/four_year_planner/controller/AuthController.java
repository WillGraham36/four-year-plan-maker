package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CurrentUserResponseDto;
import com.willgraham.four_year_planner.service.GuestCookieService;
import com.willgraham.four_year_planner.service.GuestSessionService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final GuestCookieService guestCookieService;
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
                guestSessionService.createOrResumeGuestSession(guestCookieService.readGuestCookie(request).orElse(null));
        CurrentUserResponseDto response = new CurrentUserResponseDto(
                true,
                true,
                guestSession.session().getUserId(),
                guestSessionService.isOnboarded(guestSession.session().getUserId()),
                guestSession.session().getExpiresAt()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, guestCookieService.createGuestCookie(guestSession.rawToken()).toString())
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
                guestSessionService.migrateGuestToAuthenticatedUser(guestCookieService.readGuestCookie(request).orElse(null), userId);

        CurrentUserResponseDto response = new CurrentUserResponseDto(
                true,
                false,
                userId,
                guestSessionService.isOnboarded(userId),
                null
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, guestCookieService.deleteGuestCookie().toString())
                .body(ApiResponse.success(response, migrationResult.message()));
    }
}
