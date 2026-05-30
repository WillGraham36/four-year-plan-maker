package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.CurriculumProgramType;

import java.util.List;

public record CurriculumRequirementSyncRequestDto(
        List<CurriculumProgramType> programTypes,
        List<String> programNames,
        List<String> sourceUrls,
        Integer maxPrograms
) {
}
