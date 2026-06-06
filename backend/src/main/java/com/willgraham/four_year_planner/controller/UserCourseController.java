package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.GenEdService.GenEdCalculationResult;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import lombok.ToString;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@ToString
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/usercourses")
public class UserCourseController {

    private final UserCourseService userCourseService;
    private final CourseService courseService;
    private final GenEdService genEdService;

    /**
     * Called by bulk course-save flows that only need the saved course records back
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<UserCourseResponseDto>>> saveUserCourses(@RequestBody List<UserCourseRequestDto> requestDtos, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        List<UserCourseResponseDto> savedCourses = requestDtos.stream()
                .map(dto -> processUserCourse(dto, userId))
                .toList();
        genEdService.recalculateAndGetRequirements(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(savedCourses));
    }

    /**
     * Called when a planner row adds a course and the frontend needs refreshed requirements right away
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

        GenEdCalculationResult genEdResult = genEdService.recalculateAndGetRequirementsWithCourses(userId);
        List<GenEdRequirementDto> updatedGenEdRequirements = genEdResult.genEdRequirements();

        // Get updated UL concentration data
        ULConcentrationDTO updatedULConcentration =
                userCourseService.getULConcentrationAndCourses(userId, genEdResult.userCourses());

        // Create combined response
        UserCourseWithUpdatesResponseDto response = new UserCourseWithUpdatesResponseDto(
                savedCourses,
                updatedGenEdRequirements,
                updatedULConcentration
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * Called by helper refreshes that need the latest semester-by-semester planner data.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<Semester, List<CourseDto>>>> getUserCourses(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        GenEdCalculationResult genEdResult = genEdService.recalculateAndGetRequirementsWithCourses(userId);
        Map<Semester, List<CourseDto>> courses = userCourseService.getAllCoursesForUser(genEdResult.userCourses());

        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * Called when a planner row removes a course and the frontend also refreshes Gen Ed and UL state.
     */
    @DeleteMapping("/with-updates")
    public ResponseEntity<ApiResponse<DeleteWithUpdatesResponseDto>> deleteUserCoursesWithUpdates(
            @RequestBody List<CourseIdentifierDto> courseIdentifiers,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);

        // Delete the courses (reusing existing logic)
        int deletedCount = userCourseService.deleteUserCoursesByIdentifiers(userId, courseIdentifiers);

        GenEdCalculationResult genEdResult = genEdService.recalculateAndGetRequirementsWithCourses(userId);
        List<GenEdRequirementDto> updatedGenEdRequirements = genEdResult.genEdRequirements();

        // Get updated UL concentration data
        ULConcentrationDTO updatedULConcentration =
                userCourseService.getULConcentrationAndCourses(userId, genEdResult.userCourses());

        // Create combined response
        DeleteWithUpdatesResponseDto response = new DeleteWithUpdatesResponseDto(
                deletedCount,
                updatedGenEdRequirements,
                updatedULConcentration
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Called by delete flows that only need a success message back.
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> deleteUserCourses(@RequestBody List<CourseIdentifierDto> courseIdentifiers, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        int deletedCount = userCourseService.deleteUserCoursesByIdentifiers(userId, courseIdentifiers);
        genEdService.recalculateAndGetRequirements(userId);

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

        // Save userCourse
        UserCourse savedUserCourse = userCourseService.save(userCourse);

        // Convert to DTO
        return new UserCourseResponseDto(savedUserCourse);
    }
}
