package com.willgraham.four_year_planner.exception;

public class JwtAuthenticationException  extends RuntimeException {
    public JwtAuthenticationException(String message) {
        super(message);
    }
}
