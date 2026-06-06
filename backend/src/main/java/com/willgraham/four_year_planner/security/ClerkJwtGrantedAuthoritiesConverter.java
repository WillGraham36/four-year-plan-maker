package com.willgraham.four_year_planner.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
public class ClerkJwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final JwtGrantedAuthoritiesConverter scopeAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>(scopeAuthoritiesConverter.convert(jwt));
        addRoleAuthorities(authorities, jwt.getClaim("role"));
        addRoleAuthorities(authorities, jwt.getClaim("roles"));

        if (hasAdminMetadata(jwt.getClaim("public_metadata"))
                || hasAdminMetadata(jwt.getClaim("private_metadata"))
                || isAdminValue(jwt.getClaim("status"))) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return authorities;
    }

    private static void addRoleAuthorities(Set<GrantedAuthority> authorities, Object rolesClaim) {
        if (rolesClaim instanceof Collection<?> roles) {
            roles.forEach(role -> addRoleAuthority(authorities, role));
            return;
        }

        addRoleAuthority(authorities, rolesClaim);
    }

    private static void addRoleAuthority(Set<GrantedAuthority> authorities, Object roleClaim) {
        if (roleClaim == null) {
            return;
        }

        String role = roleClaim.toString().trim();
        if (role.isBlank()) {
            return;
        }

        authorities.add(new SimpleGrantedAuthority(toRoleAuthority(role)));
    }

    private static String toRoleAuthority(String role) {
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        return normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
    }

    private static boolean hasAdminMetadata(Object metadata) {
        if (!(metadata instanceof Map<?, ?> map)) {
            return false;
        }

        return isAdminValue(map.get("role"))
                || isAdminValue(map.get("roles"))
                || isAdminValue(map.get("status"))
                || isAdminValue(map.get("isAdmin"));
    }

    private static boolean isAdminValue(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }

        if (value instanceof Collection<?> values) {
            return values.stream().anyMatch(ClerkJwtGrantedAuthoritiesConverter::isAdminValue);
        }

        if (value == null) {
            return false;
        }

        return List.of("ADMIN", "ROLE_ADMIN").contains(value.toString().trim().toUpperCase(Locale.ROOT));
    }
}
