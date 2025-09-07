package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import lombok.ToString;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.Arrays.stream;

@ToString
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/usercourses")
public class UserCourseController {

    private final UserCourseService userCourseService;
    private final CourseService courseService;
    private final GenEdService genEdService;
    private static final Logger logger = LoggerFactory.getLogger(UserCourseController.class);

    /**
     * Add courses that a user is taking
     * @param requestDtos - List of user_courses the user is taking
     * @return - The saved courses
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<UserCourseResponseDto>>> saveUserCourses(@RequestBody List<UserCourseRequestDto> requestDtos, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        List<UserCourseResponseDto> savedCourses = requestDtos.stream()
                .map(dto -> processUserCourse(dto, userId))
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(savedCourses));
    }

    /**
     * Add courses that a user is taking and return updated GenEds and UL concentration data
     * @param requestDtos - List of user_courses the user is taking
     * @return - Object containing saved courses, updated GenEds, and UL concentration data
     */
    @PostMapping("/with-updates")
    public ResponseEntity<ApiResponse<UserCourseWithUpdatesResponseDto>> saveUserCoursesWithUpdates(
            @RequestBody List<UserCourseRequestDto> requestDtos,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);

        // Save the courses (reusing existing logic)
        List<UserCourseResponseDto> savedCourses = requestDtos.stream()
                .map(dto -> processUserCourse(dto, userId))
                .toList();

        // Get updated GenEds data
        List<GenEdDto> updatedGenEds = genEdService.getAllGenEds(userId);

        // Get updated UL concentration data
        ULConcentrationDTO updatedULConcentration = userCourseService.getULConcentrationAndCourses(userId);

        // Create combined response
        UserCourseWithUpdatesResponseDto response = new UserCourseWithUpdatesResponseDto(
                savedCourses,
                updatedGenEds,
                updatedULConcentration
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }


    @PatchMapping("/with-updates")
    public ResponseEntity<ApiResponse<GenEdULUpdatesResponseDto>> updateSelectedGenEdsWithUpdates(
            @RequestBody UserCourseSelectedGenEdRequestDto selectedGenEdRequestDto,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);

        // Update the selected GenEds (reusing existing logic)
        userCourseService.updateUserCourseSelectedGenEds(userId, selectedGenEdRequestDto.getCourseId(), selectedGenEdRequestDto.getSelectedGenEds());

        // Get updated GenEds data
        List<GenEdDto> updatedGenEds = genEdService.getAllGenEds(userId);

        // Get updated UL concentration data
        ULConcentrationDTO updatedULConcentration = userCourseService.getULConcentrationAndCourses(userId);

        // Create combined response
        GenEdULUpdatesResponseDto response = new GenEdULUpdatesResponseDto(
                updatedGenEds,
                updatedULConcentration
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<String>> updateSelectedGenEds(@RequestBody UserCourseSelectedGenEdRequestDto selectedGenEdRequestDto, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        userCourseService.updateUserCourseSelectedGenEds(userId, selectedGenEdRequestDto.getCourseId(), selectedGenEdRequestDto.getSelectedGenEds());

        return ResponseEntity.ok(ApiResponse.success("Updated course genEds successfully"));
    }

    /**
     * Get all courses the user is currently planning on taking
     * @return - All the courses the user is registered for
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<Semester, List<CourseDto>>>> getUserCourses(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        Map<Semester, List<CourseDto>> courses = userCourseService.getAllCoursesForUser(userId);

        return ResponseEntity.ok(ApiResponse.success(courses));
    }


    @DeleteMapping("/with-updates")
    public ResponseEntity<ApiResponse<DeleteWithUpdatesResponseDto>> deleteUserCoursesWithUpdates(
            @RequestBody List<CourseIdentifierDto> courseIdentifiers,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);

        // Delete the courses (reusing existing logic)
        int deletedCount = userCourseService.deleteUserCoursesByIdentifiers(userId, courseIdentifiers);

        // Get updated GenEds data
        List<GenEdDto> updatedGenEds = genEdService.getAllGenEds(userId);

        // Get updated UL concentration data
        ULConcentrationDTO updatedULConcentration = userCourseService.getULConcentrationAndCourses(userId);

        // Create combined response
        DeleteWithUpdatesResponseDto response = new DeleteWithUpdatesResponseDto(
                deletedCount,
                updatedGenEds,
                updatedULConcentration
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> deleteUserCourses(@RequestBody List<CourseIdentifierDto> courseIdentifiers, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

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
        userCourse.setIndex(requestDto.getIndex());

        if(requestDto.getIndex() < 0) {
            throw new InvalidInputException("Course index cannot be negative");
        }

        // Set the selectedGenEds to the first set if it exists
        List<List<String>> requestGenEds = requestDto.getCourse().getGenEds();
        if(requestGenEds.size() > 1) {
            // Account for dependant genEds
            if(requestGenEds.getFirst().stream().anyMatch(s -> s.contains("|"))) {
                userCourse.setSelectedGenEds(requestGenEds.get(1));
            } else {
                userCourse.setSelectedGenEds(requestGenEds.getFirst());
            }
        }

        // Save userCourse
        UserCourse savedUserCourse = userCourseService.save(userCourse);

        // Convert to DTO
        return new UserCourseResponseDto(savedUserCourse);
    }
}
