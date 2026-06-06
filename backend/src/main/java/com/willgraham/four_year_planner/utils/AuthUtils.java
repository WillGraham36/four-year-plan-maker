package com.willgraham.four_year_planner.utils;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.Optional;

public class AuthUtils {

    private AuthUtils() {
    }

    public static String getCurrentUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Unauthorized");
        }
        return jwt.getSubject();
    }

    public static String getClerkUserId(Authentication authentication) {
        return getCurrentUserId(getJwt(authentication));
    }

    public static Optional<String> getEmail(Jwt jwt) {
        if (jwt == null) {
            return Optional.empty();
        }

        return Optional.ofNullable(jwt.getClaimAsString("email"))
                .or(() -> Optional.ofNullable(jwt.getClaimAsString("primary_email_address")));
    }

    public static Collection<? extends GrantedAuthority> getAuthorities(Authentication authentication) {
        if (authentication == null) {
            throw new AuthenticationCredentialsNotFoundException("Unauthorized");
        }

        return authentication.getAuthorities();
    }

    public static Jwt getJwt(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken();
        }

        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt;
        }

        throw new AuthenticationCredentialsNotFoundException("Unauthorized");
    }
}
