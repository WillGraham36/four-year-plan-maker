package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.CurriculumProgramType;

public record CatalogProgramDto(
        String programName,
        String catalogTitle,
        CurriculumProgramType programType,
        String sourceUrl,
        String catalogYear
) {
}
