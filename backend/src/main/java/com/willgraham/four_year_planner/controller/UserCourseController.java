package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.UserCourseRequestDto;
import com.willgraham.four_year_planner.dto.UserCourseResponseDto;
import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * @return - The saved courses (no user id)
     */
    @PostMapping
    public ResponseEntity<List<UserCourseResponseDto>> saveUserCourses(@RequestBody List<UserCourseRequestDto> requestDtos) {
        List<UserCourseResponseDto> savedCourses = requestDtos.stream()
                .map(this::processUserCourse)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCourses);
    }

    /**
     * Get all courses the user is currently planning on taking
     * @param userId - Temporarily take in the userId in the parameters
     * @return - All the courses the user is registered for
     */
    @GetMapping
    public ResponseEntity<List<UserCourse>> getUserCourses(@RequestParam String userId) {
        List<UserCourse> courses = userCourseService.getAllCoursesForUser(userId);
        return ResponseEntity.ok(courses);
    }

    private UserCourseResponseDto processUserCourse(UserCourseRequestDto requestDto) {
        Course course = courseService.findOrCreateCourse(requestDto.getCourse());

        // Create new UserCourse
        UserCourse userCourse = new UserCourse();
        userCourse.setUserId(requestDto.getUserId());  // Set only the userId
        userCourse.setCourseId(course.getCourseId());  // Set only the courseId
        userCourse.setSemester(requestDto.getSemester());

        // Save userCourse
        UserCourse savedUserCourse = userCourseService.save(userCourse);

        // Convert to DTO
        return new UserCourseResponseDto(savedUserCourse);
    }
}
