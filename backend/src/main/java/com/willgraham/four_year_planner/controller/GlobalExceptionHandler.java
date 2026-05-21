package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<String>> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(JwtAuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleJwtAuthenticationException(JwtAuthenticationException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("data", "error");
        response.put("message", e.getMessage());
        response.put("code", HttpStatus.UNAUTHORIZED.value());

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }
}
