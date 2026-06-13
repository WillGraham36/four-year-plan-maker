package com.willgraham.four_year_planner.security;

import com.willgraham.four_year_planner.service.GuestCookieService;
import com.willgraham.four_year_planner.service.GuestSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@AllArgsConstructor
public class GuestAuthenticationFilter extends OncePerRequestFilter {
    private final GuestCookieService guestCookieService;
    private final GuestSessionService guestSessionService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication currentAuthentication = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuthentication == null || !currentAuthentication.isAuthenticated()) {
            guestCookieService.readGuestCookie(request)
                    .flatMap(guestSessionService::resolveSession)
                    .map(resolved -> new GuestAuthenticationToken(
                            new GuestPrincipal(resolved.userId(), resolved.sessionId())
                    ))
                    .ifPresent(authentication ->
                            SecurityContextHolder.getContext().setAuthentication(authentication));
        }

        filterChain.doFilter(request, response);
    }
}
