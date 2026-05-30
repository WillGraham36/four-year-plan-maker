package com.willgraham.four_year_planner.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;

import java.time.Instant;
import java.util.List;

public record CurriculumRequirementDetailDto(
        Long id,
        String programName,
        String catalogTitle,
        CurriculumProgramType programType,
        CurriculumRequirementStatus status,
        String catalogYear,
        String sourceUrl,
        String rawRequirementsText,
        JsonNode structuredRequirements,
        List<String> parseWarnings,
        Instant lastSyncedAt,
        Instant approvedAt,
        String approvedBy,
        Instant updatedAt
) {
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    public static CurriculumRequirementDetailDto fromEntity(
            CurriculumProgramRequirement requirement,
            ObjectMapper objectMapper
    ) {
        return new CurriculumRequirementDetailDto(
                requirement.getId(),
                requirement.getProgramName(),
                requirement.getCatalogTitle(),
                requirement.getProgramType(),
                requirement.getStatus(),
                requirement.getCatalogYear(),
                requirement.getSourceUrl(),
                requirement.getRawRequirementsText(),
                parseJson(requirement.getStructuredRequirementsJson(), objectMapper),
                parseWarnings(requirement.getParseWarningsJson(), objectMapper),
                requirement.getLastSyncedAt(),
                requirement.getApprovedAt(),
                requirement.getApprovedBy(),
                requirement.getUpdatedAt()
        );
    }

    private static JsonNode parseJson(String json, ObjectMapper objectMapper) {
        if (json == null || json.isBlank()) {
            return objectMapper.createObjectNode();
        }

        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            return objectMapper.createObjectNode().put("parseError", e.getMessage());
        }
    }

    private static List<String> parseWarnings(String json, ObjectMapper objectMapper) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(json, STRING_LIST_TYPE);
        } catch (JsonProcessingException e) {
            return List.of("Stored parser warnings could not be read: " + e.getMessage());
        }
    }
}
