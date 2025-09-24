package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.repository.UserRepository;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Data
public class PingController {

    private final UserRepository userRepository;

    @GetMapping("/api/public/ping")
    public String ping() {
        userRepository.count(); // Trigger DB + repository initialization
        return "pong";
    }
}
