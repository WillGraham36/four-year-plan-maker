package com.willgraham.four_year_planner.utils;

import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import org.springframework.security.core.Authentication;

public class AuthUtils {

    public static String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        return (String) authentication.getPrincipal();
    }
}
