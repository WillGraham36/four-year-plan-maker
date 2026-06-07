package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseCatalogDto;
import com.willgraham.four_year_planner.dto.CourseSyncRequestDto;
import com.willgraham.four_year_planner.dto.CourseSyncResponseDto;
import com.willgraham.four_year_planner.service.CourseService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCourseController {
    private final CourseService courseService;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<CourseSyncResponseDto>> syncCourses(
            @RequestBody CourseSyncRequestDto request
    ) {
        return ResponseEntity.ok(ApiResponse.success(courseService.syncDepartments(request.getDepartments())));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<CourseCatalogDto>>> getCourseCatalog() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getCourseCatalog()));
    }
}
