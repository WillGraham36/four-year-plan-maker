package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.GuestSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface GuestSessionRepository extends JpaRepository<GuestSession, Long> {
    Optional<GuestSession> findByTokenHash(String tokenHash);

    List<GuestSession> findByUserId(String userId);

    List<GuestSession> findByInvalidatedAtIsNullAndExpiresAtBefore(Instant now);
}
