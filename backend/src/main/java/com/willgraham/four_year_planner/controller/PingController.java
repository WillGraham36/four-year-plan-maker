package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.repository.UserRepository;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Data
@Slf4j
public class PingController {

    private final UserRepository userRepository;

    @GetMapping("/api/public/ping")
    public String ping() {
        long requestStart = System.nanoTime();
        log.info("GET /api/public/ping started");

        try {
            long dbStart = System.nanoTime();
            long userCount = userRepository.count(); // Trigger DB + repository initialization
            log.info("GET /api/public/ping userRepository.count completed in {} ms (users={})",
                    elapsedMs(dbStart),
                    userCount);

            return "pong";
        } finally {
            log.info("GET /api/public/ping completed in {} ms", elapsedMs(requestStart));
        }
    }

    private long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}
