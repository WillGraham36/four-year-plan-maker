package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.GenEdCourseInfoDto;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.GenEd;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/geneds")
public class GenEdsController {

    private static final Logger logger = LoggerFactory.getLogger(GenEdsController.class);

    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GenEdCourseInfoDto>>> getAllGenEdsForUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        String userId = (String) authentication.getPrincipal();
        logger.info("getAllGenEdsForUser method called with user {}", userId);

        List<GenEdCourseInfoDto> genEds = genEdService.getUserCourseGenEds(userId);
        logger.info("Found {} gen ed courses for user {}", genEds.size(), userId);
        logger.debug("Gen eds data: {}", genEds);

        return ResponseEntity.ok(ApiResponse.success(genEds));
    }

}
