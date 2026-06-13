package com.willgraham.four_year_planner.security;

public record GuestPrincipal(String userId, Long sessionId) {
}
