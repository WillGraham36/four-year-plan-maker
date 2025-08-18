package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.InvalidInputException;
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

    @GetMapping("/semesters/completion")
    public ResponseEntity<ApiResponse<List<Semester>>> getCompletedSemesters(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        List<Semester> completedSemesters = userService.getCompletedSemesters(userId);

        return ResponseEntity.ok(ApiResponse.success(completedSemesters));
    }

    @PutMapping("/semesters/{term}/{year}/completion")
    public ResponseEntity<ApiResponse<String>> upsertSemesterCompletion(
            @PathVariable Term term,
            @PathVariable Integer year,
            @RequestBody CompletionRequestDto request,
            Authentication authentication
    ) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        userService.updateSemesterCompletion(userId, term, year, request.isCompleted());
        return ResponseEntity.ok(ApiResponse.success(String.format("Updated %s %d status successfully to %s", term, year, request.isCompleted())));
    }

    @PutMapping("/notes")
    public ResponseEntity<ApiResponse<String>> upsertNote(@RequestBody UpdateNoteDto dto, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        if (dto.getNote() == null) {
            dto.setNote("");
        }

        userService.updateUserNote(userId, dto.getNote());
        return ResponseEntity.ok(ApiResponse.success("Updated user note successfully"));
    }

    @PutMapping("/track")
    public ResponseEntity<ApiResponse<String>> updateUserTrack(@RequestBody UpdateTrackDto track, Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);

        if(track.getTrack() == null) {
            throw new InvalidInputException("User must have one of the 5 tracks");
        }
        userService.updateUserTrack(userId, track.getTrack());
        return ResponseEntity.ok(ApiResponse.success("Updated user track successfully to " + track.getTrack().toString()));
    }
}
