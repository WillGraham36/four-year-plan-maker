package com.willgraham.four_year_planner.dto;

import java.util.List;

public record CurriculumRequirementSyncResponseDto(
        List<CurriculumRequirementSummaryDto> syncedPrograms,
        List<String> errors
) {
}
