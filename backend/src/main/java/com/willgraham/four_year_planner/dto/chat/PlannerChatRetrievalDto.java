package com.willgraham.four_year_planner.dto.chat;

import java.util.List;

public record PlannerChatRetrievalDto(
        PlannerChatProgressDto progress,
        List<PlannerChatCourseDto> courses,
        List<PlannerChatRequirementDto> requirements,
        List<PlannerChatGenEdRequirementDto> genEdRequirements,
        List<String> notes
) {
    public PlannerChatRetrievalDto {
        courses = courses == null ? List.of() : List.copyOf(courses);
        requirements = requirements == null ? List.of() : List.copyOf(requirements);
        genEdRequirements = genEdRequirements == null ? List.of() : List.copyOf(genEdRequirements);
        notes = notes == null ? List.of() : List.copyOf(notes);
    }
}
