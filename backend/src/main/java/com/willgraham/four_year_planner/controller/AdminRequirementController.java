package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CatalogProgramDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementDetailDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSummaryDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSyncRequestDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementSyncResponseDto;
import com.willgraham.four_year_planner.dto.CurriculumRequirementUpdateRequestDto;
import com.willgraham.four_year_planner.model.CurriculumProgramType;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;
import com.willgraham.four_year_planner.service.CurriculumRequirementService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/admin/requirements")
public class AdminRequirementController {
    private final CurriculumRequirementService curriculumRequirementService;

    @GetMapping("/catalog/programs")
    public ResponseEntity<ApiResponse<List<CatalogProgramDto>>> catalogPrograms(
            @RequestParam(required = false) List<CurriculumProgramType> types,
            @RequestParam(required = false) String q,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.catalogPrograms(types, q)));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<CurriculumRequirementSyncResponseDto>> syncRequirements(
            @RequestBody CurriculumRequirementSyncRequestDto request,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.syncRequirements(request)));
    }

    @GetMapping("/records")
    public ResponseEntity<ApiResponse<List<CurriculumRequirementSummaryDto>>> savedRequirements(
            @RequestParam(required = false) CurriculumProgramType type,
            @RequestParam(required = false) CurriculumRequirementStatus status,
            @RequestParam(required = false) String q,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.savedRequirements(type, status, q)));
    }

    @GetMapping("/records/{id}")
    public ResponseEntity<ApiResponse<CurriculumRequirementDetailDto>> requirementDetail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.requirementDetail(id)));
    }

    @PutMapping("/records/{id}")
    public ResponseEntity<ApiResponse<CurriculumRequirementDetailDto>> updateRequirement(
            @PathVariable Long id,
            @RequestBody CurriculumRequirementUpdateRequestDto request,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.updateRequirement(id, request)));
    }

    @PostMapping("/records/{id}/approve")
    public ResponseEntity<ApiResponse<CurriculumRequirementDetailDto>> approveRequirement(
            @PathVariable Long id,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        String approvedBy = AuthUtils.getCurrentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.approveRequirement(id, approvedBy)));
    }

    @PostMapping("/records/{id}/resync")
    public ResponseEntity<ApiResponse<CurriculumRequirementDetailDto>> resyncRequirement(
            @PathVariable Long id,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(curriculumRequirementService.resyncRequirement(id)));
    }
}
