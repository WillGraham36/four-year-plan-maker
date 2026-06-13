package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    @Query("""
            SELECT u.id
            FROM User u
            WHERE u.guest = true
            AND (
                u.guestLastSeenAt IS NULL
                OR u.guestLastSeenAt < :cutoff
                OR u.guestExpiresAt < :now
            )
            """)
    List<String> findInactiveGuestUserIds(@Param("cutoff") Instant cutoff, @Param("now") Instant now);
}
