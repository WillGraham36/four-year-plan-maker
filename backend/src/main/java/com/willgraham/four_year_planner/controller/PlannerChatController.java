package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRequestDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatResponseDto;
import com.willgraham.four_year_planner.service.chat.PlannerChatService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/chat")
public class PlannerChatController {
    private final PlannerChatService plannerChatService;

    @PostMapping
    public ResponseEntity<ApiResponse<PlannerChatResponseDto>> chat(
            @RequestBody PlannerChatRequestDto request,
            Authentication authentication
    ) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(plannerChatService.chat(userId, request)));
    }
}
