package com.willgraham.four_year_planner.dto.chat;

public record PlannerChatResponseDto(
        String message,
        PlannerChatIntentDto intent,
        PlannerChatRetrievalDto retrievedData,
        boolean aiEnabled
) {}
