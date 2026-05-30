package com.willgraham.four_year_planner.dto.chat;

public record PlannerChatGenEdRequirementDto(
        String requirementName,
        String satisfiedByGenEd,
        String courseId,
        String semesterName,
        String transferCreditName,
        boolean satisfied
) {}
