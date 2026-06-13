package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.GenEdService.GenEdCalculationResult;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/academic/overview")
@Slf4j
public class AcademicInfoController {

    private final UserService userService;
    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    /**
     * Called when the planner and audit pages first load
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AcademicOverviewResponseDto>> getAcademicOverview(Authentication authentication) {
        long requestStart = System.nanoTime();
        String userId = AuthUtils.getCurrentUserId(authentication);
        log.info("GET /api/v1/academic/overview started");

        try {
            long genEdStart = System.nanoTime();
            GenEdCalculationResult genEdResult = genEdService.getRequirementsWithCourses(userId);
            log.info("Academic overview gen-ed requirements completed in {} ms (userCourses={})",
                    elapsedMs(genEdStart),
                    genEdResult.userCourses().size());

            long userStart = System.nanoTime();
            User user = userService.findById(userId);
            log.info("Academic overview user lookup completed in {} ms", elapsedMs(userStart));

            long dtoStart = System.nanoTime();
            List<GenEdRequirementDto> genEdRequirements = genEdResult.genEdRequirements();
            Map<Semester, List<CourseDto>> courses = userCourseService.getAllCoursesForUser(genEdResult.userCourses());
            ULConcentrationDTO concentrationDTO = userCourseService.getULConcentrationAndCourses(user, genEdResult.userCourses());
            GetUserInfoResponseDto userInfo = userService.getUserInfo(user);
            log.info("Academic overview DTO assembly completed in {} ms", elapsedMs(dtoStart));

            AcademicOverviewResponseDto dto = new AcademicOverviewResponseDto(
                    courses,
                    genEdRequirements,
                    concentrationDTO,
                    userInfo
            );

            return ResponseEntity.ok(ApiResponse.success(dto));
        } finally {
            log.info("GET /api/v1/academic/overview completed in {} ms", elapsedMs(requestStart));
        }
    }

    private long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }

}
