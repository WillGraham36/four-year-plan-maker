package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;

import java.time.Instant;

public record CurriculumRequirementSummaryDto(
        Long id,
        String programName,
        String catalogTitle,
        CurriculumProgramType programType,
        CurriculumRequirementStatus status,
        String catalogYear,
        String sourceUrl,
        Instant lastSyncedAt,
        Instant approvedAt,
        Instant updatedAt
) {
    public static CurriculumRequirementSummaryDto fromEntity(CurriculumProgramRequirement requirement) {
        return new CurriculumRequirementSummaryDto(
                requirement.getId(),
                requirement.getProgramName(),
                requirement.getCatalogTitle(),
                requirement.getProgramType(),
                requirement.getStatus(),
                requirement.getCatalogYear(),
                requirement.getSourceUrl(),
                requirement.getLastSyncedAt(),
                requirement.getApprovedAt(),
                requirement.getUpdatedAt()
        );
    }
}
