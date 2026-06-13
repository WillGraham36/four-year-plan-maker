package com.willgraham.four_year_planner.security;

import com.willgraham.four_year_planner.config.GuestSessionProperties;
import com.willgraham.four_year_planner.service.GuestSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Component
@AllArgsConstructor
public class GuestAuthenticationFilter extends OncePerRequestFilter {
    private final GuestSessionProperties guestSessionProperties;
    private final GuestSessionService guestSessionService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication currentAuthentication = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuthentication == null || !currentAuthentication.isAuthenticated()) {
            readGuestCookie(request)
                    .flatMap(guestSessionService::resolveSession)
                    .map(resolved -> new GuestAuthenticationToken(
                            new GuestPrincipal(resolved.userId(), resolved.sessionId())
                    ))
                    .ifPresent(authentication ->
                            SecurityContextHolder.getContext().setAuthentication(authentication));
        }

        filterChain.doFilter(request, response);
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
}
