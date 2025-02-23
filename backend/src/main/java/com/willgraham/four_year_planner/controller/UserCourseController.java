package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.UserCourseRequestDto;
import com.willgraham.four_year_planner.dto.UserCourseResponseDto;
import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/usercourses")
public class UserCourseController {

    private final UserService userService;
    private final UserCourseService userCourseService;
    private final CourseService courseService;

    /**
     * Add courses that a user is taking
     * @param requestDtos - List of user_courses the user is taking
     * @return - The saved courses
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<UserCourseResponseDto>>> saveUserCourses(@RequestBody List<UserCourseRequestDto> requestDtos, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        String userId = (String) authentication.getPrincipal();

        List<UserCourseResponseDto> savedCourses = requestDtos.stream()
                .map(dto -> processUserCourse(dto, userId))
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(savedCourses));
    }

    /**
     * Get all courses the user is currently planning on taking
     * @return - All the courses the user is registered for
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserCourse>>> getUserCourses(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        String userId = (String) authentication.getPrincipal();

        List<UserCourse> courses = userCourseService.getAllCoursesForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    private UserCourseResponseDto processUserCourse(UserCourseRequestDto requestDto, String userId) {
        Course course = courseService.findOrCreateCourse(requestDto.getCourse());

        // Create new UserCourse
        UserCourse userCourse = new UserCourse();
        userCourse.setUserId(userId);  // Set only the userId
        userCourse.setCourseId(course.getCourseId());  // Set only the courseId
        userCourse.setSemester(requestDto.getSemester());

        // Save userCourse
        UserCourse savedUserCourse = userCourseService.save(userCourse);

        // Convert to DTO
        return new UserCourseResponseDto(savedUserCourse);
    }
}
