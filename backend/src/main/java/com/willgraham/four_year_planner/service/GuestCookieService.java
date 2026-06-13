package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.config.GuestSessionProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Service
@AllArgsConstructor
public class GuestCookieService {
    private final GuestSessionProperties guestSessionProperties;

    public Optional<String> readGuestCookie(HttpServletRequest request) {
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

    public ResponseCookie createGuestCookie(String rawToken) {
        ResponseCookie.ResponseCookieBuilder builder = baseCookie(rawToken)
                .maxAge(Duration.ofDays(guestSessionProperties.getSessionDays()));

        addCookieDomain(builder);
        return builder.build();
    }

    public ResponseCookie deleteGuestCookie() {
        ResponseCookie.ResponseCookieBuilder builder = baseCookie("")
                .maxAge(Duration.ZERO);

        addCookieDomain(builder);
        return builder.build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie
                .from(guestSessionProperties.getCookieName(), value)
                .httpOnly(true)
                .secure(guestSessionProperties.isCookieSecure())
                .sameSite(guestSessionProperties.getCookieSameSite())
                .path("/");
    }

    private void addCookieDomain(ResponseCookie.ResponseCookieBuilder builder) {
        String cookieDomain = guestSessionProperties.getCookieDomain();
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }
    }
}
