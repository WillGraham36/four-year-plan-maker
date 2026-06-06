package com.willgraham.four_year_planner.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClerkJwtGrantedAuthoritiesConverterTest {

    private final ClerkJwtGrantedAuthoritiesConverter converter = new ClerkJwtGrantedAuthoritiesConverter();

    @Test
    void mapsClerkPublicMetadataAdminRoleToAdminAuthority() {
        Jwt jwt = jwt(Map.of("public_metadata", Map.of("role", "ADMIN")));

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertTrue(hasAuthority(authorities, "ROLE_ADMIN"));
    }

    @Test
    void mapsTopLevelRolesToSpringRoleAuthorities() {
        Jwt jwt = jwt(Map.of("roles", java.util.List.of("admin", "advisor")));

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertTrue(hasAuthority(authorities, "ROLE_ADMIN"));
        assertTrue(hasAuthority(authorities, "ROLE_ADVISOR"));
    }

    @Test
    void ignoresUserWritableUnsafeMetadataForAdminAuthority() {
        Jwt jwt = jwt(Map.of("unsafe_metadata", Map.of("role", "ADMIN")));

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertFalse(hasAuthority(authorities, "ROLE_ADMIN"));
    }

    private static Jwt jwt(Map<String, Object> claims) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of("alg", "RS256"),
                claims
        );
    }

    private static boolean hasAuthority(Collection<GrantedAuthority> authorities, String authority) {
        return authorities.stream().anyMatch(grantedAuthority -> authority.equals(grantedAuthority.getAuthority()));
    }
}
