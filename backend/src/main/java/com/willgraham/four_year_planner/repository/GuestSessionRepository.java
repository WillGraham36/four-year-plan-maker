package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.GuestSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface GuestSessionRepository extends JpaRepository<GuestSession, Long> {
    @Query(value = "SELECT pg_advisory_xact_lock(hashtextextended(:tokenHash, 0))", nativeQuery = true)
    Object lockPendingTokenHash(@Param("tokenHash") String tokenHash);

    Optional<GuestSession> findByTokenHash(String tokenHash);

    List<GuestSession> findByUserId(String userId);

    List<GuestSession> findByInvalidatedAtIsNullAndExpiresAtBefore(Instant now);
}
