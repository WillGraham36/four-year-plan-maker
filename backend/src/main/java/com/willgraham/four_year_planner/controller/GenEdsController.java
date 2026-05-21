package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.GenEdRequirementDto;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/geneds")
    public class GenEdsController {

    private final GenEdService genEdService;

    /**
     * Called by refresh and export helpers that only need the current Gen Ed requirement assignments
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GenEdRequirementDto>>> getAllGenEdsForUser(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        List<GenEdRequirementDto> result = genEdService.recalculateAndGetRequirements(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
