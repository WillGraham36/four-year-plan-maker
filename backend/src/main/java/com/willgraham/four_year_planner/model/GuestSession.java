package com.willgraham.four_year_planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Entity
@NoArgsConstructor
@Table(
        name = "guest_sessions",
        indexes = {
                @Index(name = "idx_guest_sessions_token_hash", columnList = "token_hash", unique = true),
                @Index(name = "idx_guest_sessions_user_id", columnList = "user_id")
        }
)
public class GuestSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "invalidated_at")
    private Instant invalidatedAt;

    @Column(name = "migrated_to_user_id")
    private String migratedToUserId;

    public boolean isActive(Instant now) {
        return invalidatedAt == null && expiresAt.isAfter(now);
    }
}
