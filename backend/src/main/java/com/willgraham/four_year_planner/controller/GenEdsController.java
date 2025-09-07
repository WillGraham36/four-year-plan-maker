package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.GenEdDto;
import com.willgraham.four_year_planner.dto.UserCourseWithInfoDto;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.GenEd;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/geneds")
public class GenEdsController {

    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GenEdDto>>> getAllGenEdsForUser(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        List<GenEdDto> result = genEdService.getAllGenEds(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}