package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
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
import java.util.stream.Collectors;

import static java.util.Arrays.stream;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/usercourses")
public class UserCourseController {

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
    public ResponseEntity<ApiResponse<Map<Semester, List<CourseDto>>>> getUserCourses(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        String userId = (String) authentication.getPrincipal();
        List<UserCourse> courses = userCourseService.getAllCoursesForUser(userId);

        // Transform DTOs
        List<CourseDto> courseDtos = courses.stream()
                .map(CourseDto::fromUserCourse)
                .toList();

        // Group by semester
        Map<Semester, List<CourseDto>> coursesBySemester = courseDtos.stream()
                .collect(Collectors.groupingBy(CourseDto::getSemester));



        return ResponseEntity.ok(ApiResponse.success(coursesBySemester));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> deleteUserCourses(@RequestBody List<CourseIdentifierDto> courseIdentifiers, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new JwtAuthenticationException("Unauthorized");
        }
        String userId = (String) authentication.getPrincipal();

        int deletedCount = userCourseService.deleteUserCoursesByIdentifiers(userId, courseIdentifiers);

        return ResponseEntity.ok(ApiResponse.success("Successfully deleted " + deletedCount + "courses from user"));
    }

    private UserCourse convertDtoToUserCourse(UserCourseRequestDto requestDto, String userId) {
        Course course = courseService.findOrCreateCourse(requestDto.getCourse());

        // Create new UserCourse
        UserCourse userCourse = new UserCourse();
        userCourse.setUserId(userId);  // Set only the userId
        userCourse.setCourseId(course.getCourseId());  // Set only the courseId
        userCourse.setSemester(requestDto.getSemester());

        return userCourse;
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
