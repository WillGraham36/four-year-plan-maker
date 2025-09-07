package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
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
public class AcademicInfoController {

    private final UserService userService;
    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    @GetMapping
    public ResponseEntity<ApiResponse<AcademicOverviewResponseDto>> getAcademicOverview(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        Map<Semester, List<CourseDto>> courses = userCourseService.getAllCoursesForUser(userId);
        List<GenEdDto> genEds = genEdService.getAllGenEds(userId);
        ULConcentrationDTO concentrationDTO = userCourseService.getULConcentrationAndCourses(userId);
        GetUserInfoResponseDto userInfo = userService.getUserInfo(userId);


        AcademicOverviewResponseDto dto = new AcademicOverviewResponseDto(
                courses,
                genEds,
                concentrationDTO,
                userInfo
        );

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

}
