package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.dto.ULConcentrationDTO;
import com.willgraham.four_year_planner.dto.ULCourseInfoDTO;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

        List<ULCourseInfoDTO> coursesDTO = courses.stream()
                .map(c -> new ULCourseInfoDTO(
                        c.getCourseId(),
                        c.getSemester(),
                        c.getCourse().getCredits()
                ))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(new ULConcentrationDTO(concentration, coursesDTO)));


    }

}
