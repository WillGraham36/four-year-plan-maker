package com.willgraham.four_year_planner.dto.chat;

public record PlannerChatMessageDto(String role, String content) {
    public PlannerChatMessageDto {
        role = role == null ? "user" : role.trim();
        content = content == null ? "" : content.trim();
    }
}
