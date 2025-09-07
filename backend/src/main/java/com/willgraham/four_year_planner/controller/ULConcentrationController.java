package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.service.CourseService;
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


    @GetMapping
    public ResponseEntity<ApiResponse<ULConcentrationDTO>> getUserULConcentrationAndCourses(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        ULConcentrationDTO coursesAndConcentration = userCourseService.getULConcentrationAndCourses(userId);
        return ResponseEntity.ok(ApiResponse.success(coursesAndConcentration));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<String>> updateUserULConcentration(@RequestBody UpdateConcentrationRequestDTO request, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        String concentration = request.getConcentration().toString();
        userService.updateULConcentrationById(userId, concentration);


        return ResponseEntity.ok(ApiResponse.success(concentration));
    }

}
