package com.willgraham.four_year_planner.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.willgraham.four_year_planner.dto.CatalogProgramDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementDetailDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSummaryDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSyncRequestDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSyncResponseDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementUpdateRequestDto;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.exception.NotFoundException;
import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;
import com.willgraham.four_year_planner.repository.CurriculumProgramRequirementRepository;
import com.willgraham.four_year_planner.service.CatalogRequirementParser.ParsedCatalogRequirement;
import jakarta.persistence.criteria.Predicate;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@AllArgsConstructor
@Service
public class CurriculumRequirementService {
    private static final int DEFAULT_MAX_SYNC_PROGRAMS = 50;

    private final UmdCatalogClient umdCatalogClient;
    private final CatalogRequirementParser catalogRequirementParser;
    private final CurriculumProgramRequirementRepository requirementRepository;
    private final ObjectMapper objectMapper;

    public List<CatalogProgramDto> catalogPrograms(List<CurriculumProgramType> programTypes, String query) {
        Set<CurriculumProgramType> types = programTypes == null || programTypes.isEmpty()
                ? EnumSet.of(CurriculumProgramType.MAJOR, CurriculumProgramType.MINOR)
                : EnumSet.copyOf(programTypes);
        String normalizedQuery = normalize(query);

        return umdCatalogClient.fetchUndergraduatePrograms().stream()
                .filter(program -> types.contains(program.programType()))
                .filter(program -> normalizedQuery.isBlank()
                        || normalize(program.programName()).contains(normalizedQuery)
                        || normalize(program.catalogTitle()).contains(normalizedQuery))
                .toList();
    }

    public List<CurriculumRequirementSummaryDto> savedRequirements(
            CurriculumProgramType programType,
            CurriculumRequirementStatus status,
            String query
    ) {
        return requirementRepository.findAll(
                        savedRequirementsSpec(programType, status, query),
                        Sort.by("programName").ascending().and(Sort.by("catalogTitle").ascending())
                ).stream()
                .map(CurriculumRequirementSummaryDto::fromEntity)
                .toList();
    }

    private Specification<CurriculumProgramRequirement> savedRequirementsSpec(
            CurriculumProgramType programType,
            CurriculumRequirementStatus status,
            String query
    ) {
        String normalizedQuery = normalize(query);

        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (programType != null) {
                predicates.add(criteriaBuilder.equal(root.get("programType"), programType));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (!normalizedQuery.isBlank()) {
                String likeQuery = "%" + normalizedQuery + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("programName")), likeQuery),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("catalogTitle")), likeQuery)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    public CurriculumRequirementDetailDto requirementDetail(Long id) {
        return CurriculumRequirementDetailDto.fromEntity(findRequirement(id), objectMapper);
    }

    public CurriculumRequirementSyncResponseDto syncRequirements(CurriculumRequirementSyncRequestDto request) {
        List<CatalogProgramDto> targets = resolveSyncTargets(request);
        List<CurriculumRequirementSummaryDto> syncedPrograms = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (CatalogProgramDto target : targets) {
            try {
                CurriculumProgramRequirement syncedRequirement = syncProgram(target);
                syncedPrograms.add(CurriculumRequirementSummaryDto.fromEntity(syncedRequirement));
            } catch (RuntimeException e) {
                errors.add(target.catalogTitle() + ": " + e.getMessage());
            }
        }

        return new CurriculumRequirementSyncResponseDto(syncedPrograms, errors);
    }

    public CurriculumRequirementDetailDto resyncRequirement(Long id) {
        CurriculumProgramRequirement existingRequirement = findRequirement(id);
        CatalogProgramDto target = new CatalogProgramDto(
                existingRequirement.getProgramName(),
                existingRequirement.getCatalogTitle(),
                existingRequirement.getProgramType(),
                existingRequirement.getSourceUrl(),
                existingRequirement.getCatalogYear()
        );

        return CurriculumRequirementDetailDto.fromEntity(syncProgram(target), objectMapper);
    }

    public CurriculumRequirementDetailDto updateRequirement(Long id, CurriculumRequirementUpdateRequestDto request) {
        CurriculumProgramRequirement requirement = findRequirement(id);

        if (request.programName() != null && !request.programName().isBlank()) {
            requirement.setProgramName(request.programName().trim());
        }
        if (request.catalogTitle() != null && !request.catalogTitle().isBlank()) {
            requirement.setCatalogTitle(request.catalogTitle().trim());
        }
        if (request.rawRequirementsText() != null) {
            requirement.setRawRequirementsText(request.rawRequirementsText());
        }
        if (request.structuredRequirements() != null) {
            requirement.setStructuredRequirementsJson(writeJson(request.structuredRequirements()));
        }
        if (request.parseWarnings() != null) {
            requirement.setParseWarningsJson(writeJson(request.parseWarnings()));
        }

        requirement.setStatus(CurriculumRequirementStatus.DRAFT);
        requirement.setApprovedAt(null);
        requirement.setApprovedBy(null);

        return CurriculumRequirementDetailDto.fromEntity(requirementRepository.saveAndFlush(requirement), objectMapper);
    }

    public CurriculumRequirementDetailDto approveRequirement(Long id, String approvedBy) {
        CurriculumProgramRequirement requirement = findRequirement(id);
        validateStructuredRequirements(requirement.getStructuredRequirementsJson());
        requirement.setStatus(CurriculumRequirementStatus.APPROVED);
        requirement.setApprovedAt(Instant.now());
        requirement.setApprovedBy(approvedBy);
        return CurriculumRequirementDetailDto.fromEntity(requirementRepository.saveAndFlush(requirement), objectMapper);
    }

    private CurriculumProgramRequirement syncProgram(CatalogProgramDto target) {
        String html = umdCatalogClient.fetchPage(target.sourceUrl());
        ParsedCatalogRequirement parsed = catalogRequirementParser.parse(
                html,
                target.sourceUrl(),
                target.catalogTitle(),
                target.programType()
        );

        CurriculumProgramRequirement requirement = requirementRepository.findBySourceUrl(target.sourceUrl())
                .orElseGet(CurriculumProgramRequirement::new);

        requirement.setProgramName(target.programName());
        requirement.setCatalogTitle(parsed.catalogTitle() == null || parsed.catalogTitle().isBlank()
                ? target.catalogTitle()
                : parsed.catalogTitle());
        requirement.setProgramType(target.programType());
        requirement.setCatalogYear(parsed.catalogYear() == null ? target.catalogYear() : parsed.catalogYear());
        requirement.setSourceUrl(target.sourceUrl());
        requirement.setRawSourceHtml(html);
        requirement.setRawRequirementsText(parsed.rawRequirementsText());
        requirement.setStructuredRequirementsJson(writeJson(parsed.structuredRequirements()));
        requirement.setParseWarningsJson(writeJson(parsed.parseWarnings()));
        requirement.setLastSyncedAt(Instant.now());
        requirement.setApprovedAt(null);
        requirement.setApprovedBy(null);
        requirement.setStatus(parsed.parseWarnings().stream().anyMatch(warning -> warning.startsWith("No course-list"))
                ? CurriculumRequirementStatus.PARSE_ERROR
                : CurriculumRequirementStatus.DRAFT);

        return requirementRepository.saveAndFlush(requirement);
    }

    private List<CatalogProgramDto> resolveSyncTargets(CurriculumRequirementSyncRequestDto request) {
        if (request == null) {
            throw new InvalidInputException("Sync request is required");
        }

        List<CatalogProgramDto> programs = umdCatalogClient.fetchUndergraduatePrograms();
        Set<String> sourceUrls = normalizedSet(request.sourceUrls());
        Set<String> names = normalizedSet(request.programNames());
        Set<CurriculumProgramType> types = request.programTypes() == null || request.programTypes().isEmpty()
                ? EnumSet.of(CurriculumProgramType.MAJOR, CurriculumProgramType.MINOR)
                : EnumSet.copyOf(request.programTypes());

        List<CatalogProgramDto> selected = programs.stream()
                .filter(program -> sourceUrls.isEmpty() || sourceUrls.contains(normalizeUrl(program.sourceUrl())))
                .filter(program -> names.isEmpty()
                        || names.contains(normalize(program.programName()))
                        || names.contains(normalize(program.catalogTitle())))
                .filter(program -> !sourceUrls.isEmpty() || types.contains(program.programType()))
                .toList();

        if (selected.isEmpty()) {
            throw new InvalidInputException("No matching catalog programs were found");
        }

        int maxPrograms = Optional.ofNullable(request.maxPrograms()).orElse(DEFAULT_MAX_SYNC_PROGRAMS);
        if (maxPrograms <= 0) {
            throw new InvalidInputException("maxPrograms must be greater than 0");
        }

        return selected.stream().limit(maxPrograms).toList();
    }

    private Set<String> normalizedSet(List<String> values) {
        if (values == null) {
            return Set.of();
        }

        Set<String> normalizedValues = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = normalize(value);
            if (!normalized.isBlank()) {
                normalizedValues.add(normalized);
            }
        }
        return normalizedValues;
    }

    private CurriculumProgramRequirement findRequirement(Long id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Requirement record not found"));
    }

    private void validateStructuredRequirements(String json) {
        if (json == null || json.isBlank()) {
            throw new InvalidInputException("Structured requirements JSON is required before approval");
        }

        try {
            JsonNode parsed = objectMapper.readTree(json);
            if (!parsed.isObject()) {
                throw new InvalidInputException("Structured requirements must be a JSON object");
            }
        } catch (JsonProcessingException e) {
            throw new InvalidInputException("Structured requirements JSON is invalid: " + e.getMessage());
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new InvalidInputException("Could not serialize requirement JSON: " + e.getMessage());
        }
    }

    private String normalizeUrl(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null
                ? ""
                : value.replace('\u00a0', ' ')
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}
