package com.willgraham.four_year_planner.dto.chat;

import java.util.List;

public record PlannerChatRequestDto(
        String message,
        List<PlannerChatMessageDto> conversation
) {
    public PlannerChatRequestDto {
        message = message == null ? "" : message.trim();
        conversation = conversation == null ? List.of() : List.copyOf(conversation);
    }
}
