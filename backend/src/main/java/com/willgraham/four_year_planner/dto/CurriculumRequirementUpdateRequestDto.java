package com.willgraham.four_year_planner.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public record CurriculumRequirementUpdateRequestDto(
        String programName,
        String catalogTitle,
        String rawRequirementsText,
        JsonNode structuredRequirements,
        List<String> parseWarnings
) {
}
