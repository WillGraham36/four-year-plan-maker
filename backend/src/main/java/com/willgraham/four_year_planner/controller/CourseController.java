package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseAutocompleteDto;
import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.service.CourseService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseService courseService;

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<CourseAutocompleteDto>>> autocomplete(
            @RequestParam("q") String query
    ) {
        return ResponseEntity.ok(ApiResponse.success(courseService.autocomplete(query)));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseDto>> getCourse(
            @PathVariable String courseId
    ) {
        Course course = courseService.findOrFetchByCourseId(courseId);
        CourseDto dto = new CourseDto();
        dto.setCourseId(course.getCourseId());
        dto.setName(course.getName());
        dto.setCredits(course.getCredits());
        dto.setGenEds(course.getGenEds() == null || course.getGenEds().isEmpty() ? List.of(List.of()) : course.getGenEds());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
