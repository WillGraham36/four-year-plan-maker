package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {
    private final UserService userService;
    private final UserCourseService userCourseService;
    private static final Logger logger = LoggerFactory.getLogger(OnboardingController.class);

    @PostMapping
    public ResponseEntity<ApiResponse<String>> saveOnboardingForm(@RequestBody OnboardingFormRequestDto onboardingFormRequestDto, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        logger.info(onboardingFormRequestDto.toString());

        // Save courses
        onboardingFormRequestDto.getTransferCredits()
                .forEach(dto -> userCourseService.processTransferCreditDto(dto, userId));

        // Save user
        userService.createOrUpdateUser(userService.buildUserFromDto(onboardingFormRequestDto, userId));

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Successfully submitted form"));

    }
}

