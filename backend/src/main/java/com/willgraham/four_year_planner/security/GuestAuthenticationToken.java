package com.willgraham.four_year_planner.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public class GuestAuthenticationToken extends AbstractAuthenticationToken {
    private final GuestPrincipal principal;

    public GuestAuthenticationToken(GuestPrincipal principal) {
        super(List.of(new SimpleGrantedAuthority("ROLE_GUEST")));
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public GuestPrincipal getPrincipal() {
        return principal;
    }
}
