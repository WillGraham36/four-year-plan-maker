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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/academic/overview")
public class AcademicInfoController {

    private final UserService userService;
    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    /**
     * Called when the planner and audit pages first load
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AcademicOverviewResponseDto>> getAcademicOverview(@AuthenticationPrincipal Jwt jwt) {
        String userId = AuthUtils.getCurrentUserId(jwt);

        GenEdCalculationResult genEdResult = genEdService.getRequirementsWithCourses(userId);
        User user = userService.findById(userId);
        List<GenEdRequirementDto> genEdRequirements = genEdResult.genEdRequirements();
        Map<Semester, List<CourseDto>> courses = userCourseService.getAllCoursesForUser(genEdResult.userCourses());
        ULConcentrationDTO concentrationDTO = userCourseService.getULConcentrationAndCourses(user, genEdResult.userCourses());
        GetUserInfoResponseDto userInfo = userService.getUserInfo(user);


        AcademicOverviewResponseDto dto = new AcademicOverviewResponseDto(
                courses,
                genEdRequirements,
                concentrationDTO,
                userInfo
        );

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

}
