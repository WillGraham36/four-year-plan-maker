package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.dto.CreateOffTermRequestDto;
import com.willgraham.four_year_planner.dto.GetUserInfoResponseDto;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.service.UserService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import lombok.ToString;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@ToString
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/userinfo")
public class UserInfoController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<GetUserInfoResponseDto>> getUserInfo(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        GetUserInfoResponseDto userInfo = userService.getUserInfo(userId);

        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }

    @PostMapping("/offterms")
    public ResponseEntity<ApiResponse<String>> createOffTerm(@RequestBody CreateOffTermRequestDto request, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        userService.createOffTerm(userId, request);

        return ResponseEntity.ok(ApiResponse.success("Created off term successfully"));
    }

    @DeleteMapping("/offterms")
    public ResponseEntity<ApiResponse<String>> deleteOffTerm(@RequestParam("term") Term term, @RequestParam("year") Integer year, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        userService.deleteOffTerm(userId, term, year);

        return ResponseEntity.ok(ApiResponse.success("Deleted off term successfully"));
    }
}
