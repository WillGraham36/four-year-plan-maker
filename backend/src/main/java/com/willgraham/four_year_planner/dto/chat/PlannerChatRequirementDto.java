package com.willgraham.four_year_planner.dto.chat;

import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;

public record PlannerChatRequirementDto(
        Long id,
        String programName,
        String catalogTitle,
        CurriculumProgramType programType,
        CurriculumRequirementStatus status,
        String catalogYear,
        String sourceUrl,
        String requirementsExcerpt
) {}
