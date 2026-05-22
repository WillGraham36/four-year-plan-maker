package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/ulconcentration")
public class ULConcentrationController {

    private final UserCourseService userCourseService;
    private final UserService userService;


    /**
     * Called when the planner, audit page, or export flow needs the current UL concentration summary
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ULConcentrationDTO>> getUserULConcentrationAndCourses(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        ULConcentrationDTO coursesAndConcentration = userCourseService.getULConcentrationAndCourses(userId);
        return ResponseEntity.ok(ApiResponse.success(coursesAndConcentration));
    }

    /**
     * Called when the planner or audit UI updates the selected UL concentration area
     */
    @PatchMapping
    public ResponseEntity<ApiResponse<String>> updateUserULConcentration(@RequestBody UpdateConcentrationRequestDTO request, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        String concentration = request.getConcentration().toString();
        userService.updateULConcentrationById(userId, concentration);


        return ResponseEntity.ok(ApiResponse.success(concentration));
    }

    /**
     * Marks an existing planner course as an explicit UL concentration course
     */
    @PostMapping("/custom-courses")
    public ResponseEntity<ApiResponse<ULConcentrationDTO>> addCustomULCourse(
            @RequestBody CourseIdentifierDto request,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);
        ULConcentrationDTO updatedULConcentration = userCourseService.addCustomULCourse(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updatedULConcentration));
    }

    /**
     * Removes the explicit UL concentration mark without deleting the planner course
     */
    @DeleteMapping("/custom-courses")
    public ResponseEntity<ApiResponse<ULConcentrationDTO>> removeCustomULCourse(
            @RequestBody CourseIdentifierDto request,
            Authentication authentication) {

        String userId = AuthUtils.getCurrentUserId(authentication);
        ULConcentrationDTO updatedULConcentration = userCourseService.removeCustomULCourse(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updatedULConcentration));
    }

}
