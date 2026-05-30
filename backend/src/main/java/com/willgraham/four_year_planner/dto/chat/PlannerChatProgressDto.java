package com.willgraham.four_year_planner.dto.chat;

public record PlannerChatProgressDto(
        String major,
        String track,
        int requiredCredits,
        int completedCredits,
        int plannedCredits,
        int totalCredits,
        int completedGenEds,
        int totalGenEds
) {}
