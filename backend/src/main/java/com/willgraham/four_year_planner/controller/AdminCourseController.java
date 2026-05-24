package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseSyncRequestDto;
import com.willgraham.four_year_planner.dto.CourseSyncResponseDto;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/admin/courses")
public class AdminCourseController {
    private final CourseService courseService;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<CourseSyncResponseDto>> syncCourses(
            @RequestBody CourseSyncRequestDto request,
            Authentication authentication
    ) {
        AuthUtils.requireAdmin(authentication);
        return ResponseEntity.ok(ApiResponse.success(courseService.syncDepartments(request.getDepartments())));
    }
}
