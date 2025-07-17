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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
        logger.info("Starting processing user onboarding course with userId: {}", userId);

        // First, remove all transfer credits the user has
        List<TransferCreditDto> existingTransferCourses = userCourseService.getTransferCreditsForUser(userId);
        List<CourseIdentifierDto> existingIdentifiers =
                existingTransferCourses
                        .stream()
                        .map(course -> new CourseIdentifierDto(course.getCourse().getCourseId(), course.getSemester()))
                        .toList();
        // Delete courses from db
        userCourseService.deleteUserCoursesByIdentifiers(userId, existingIdentifiers);

        // Save courses
        onboardingFormRequestDto.getTransferCredits()
                .forEach(dto -> userCourseService.processTransferCreditDto(dto, userId));

        // Save user
        userService.createOrUpdateUser(userService.buildUserFromDto(onboardingFormRequestDto, userId));

        logger.info("Onboarding submit processing finished successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Successfully submitted form", "Successfully submitted onboarding form"));

    }

    @GetMapping
    public ResponseEntity<ApiResponse<OnboardingFormRequestDto>> getOnboardingFormValues(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        logger.info("Started getting user onboarding form with userId: {}", userId);

        // Fetch user and course values for dto
        Optional<OnboardingFormRequestDto> dtoOpt = userService.getOnboardingFormUserValues(userId);
        List<TransferCreditDto> transferCourses = userCourseService.getTransferCreditsForUser(userId);

        logger.info("Finished getting user onboarding form, result: {}, transferCourses: {}", dtoOpt, transferCourses);
        return dtoOpt
                .map(dto -> {
                    dto.setTransferCredits(transferCourses); // Add transfer courses to DTO
                    return ResponseEntity.ok(
                            new ApiResponse<>("success", dto, "Form data retrieved successfully")
                    );
                })
                .orElseGet(() -> ResponseEntity.ok(new ApiResponse<>("success", null, "No form data present")));
    }
}

