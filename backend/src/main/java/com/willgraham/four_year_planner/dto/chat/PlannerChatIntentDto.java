package com.willgraham.four_year_planner.dto.chat;

import java.util.List;

public record PlannerChatIntentDto(
        PlannerChatIntentType intent,
        String query,
        List<String> courseIds,
        List<String> departments,
        List<String> genEds,
        List<String> requirementKeywords,
        List<String> programNames,
        Integer limit
) {
    public PlannerChatIntentDto {
        intent = intent == null ? PlannerChatIntentType.UNKNOWN : intent;
        query = query == null ? "" : query.trim();
        courseIds = courseIds == null ? List.of() : List.copyOf(courseIds);
        departments = departments == null ? List.of() : List.copyOf(departments);
        genEds = genEds == null ? List.of() : List.copyOf(genEds);
        requirementKeywords = requirementKeywords == null ? List.of() : List.copyOf(requirementKeywords);
        programNames = programNames == null ? List.of() : List.copyOf(programNames);
        limit = limit == null ? 8 : limit;
    }
}
