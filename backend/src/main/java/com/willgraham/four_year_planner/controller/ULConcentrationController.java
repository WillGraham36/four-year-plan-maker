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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/ulconcentration")
public class ULConcentrationController {

    private final UserCourseService userCourseService;
    private final UserService userService;
    private static final Logger logger = LoggerFactory.getLogger(ULConcentrationController.class);


    @GetMapping
    public ResponseEntity<ApiResponse<ULConcentrationDTO>> getUserULConcentrationAndCourses(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        String concentration = userService.findById(userId).getULConcentration();
        List<UserCourse> courses = userCourseService.getULCourses(userId, concentration);

        //Filter out courses that are not 3 or 400 level
        courses = courses.stream().filter(c -> c.getCourseId().charAt(4) == '3' || c.getCourseId().charAt(4) == '4').toList();

        List<ULCourseInfoDTO> coursesDTO = courses.stream()
                .map(c -> new ULCourseInfoDTO(
                        c.getCourseId(),
                        c.getSemester(),
                        c.getCourse().getCredits()
                ))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(new ULConcentrationDTO(concentration, coursesDTO)));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<String>> updateUserULConcentration(@RequestBody UpdateConcentrationRequestDTO request, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        String concentration = request.getConcentration().toString();
        userService.updateULConcentrationById(userId, concentration);


        return ResponseEntity.ok(ApiResponse.success(concentration));
    }

}
