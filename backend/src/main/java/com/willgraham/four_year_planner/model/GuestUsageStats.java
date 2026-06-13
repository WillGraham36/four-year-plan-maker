package com.willgraham.four_year_planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@NoArgsConstructor
@Table(name = "guest_usage_stats")
public class GuestUsageStats {
    @Id
    @Column(name = "stat_date")
    private LocalDate statDate;

    @Column(name = "created_guest_users", nullable = false)
    private long createdGuestUsers = 0;

    @Column(name = "migrated_guest_users", nullable = false)
    private long migratedGuestUsers = 0;

    @Column(name = "deleted_guest_users", nullable = false)
    private long deletedGuestUsers = 0;

    @Column(name = "invalidated_guest_sessions", nullable = false)
    private long invalidatedGuestSessions = 0;

    @Column(name = "cleanup_runs", nullable = false)
    private long cleanupRuns = 0;

    @Column(name = "last_updated_at", nullable = false)
    private Instant lastUpdatedAt = Instant.now();

    public GuestUsageStats(LocalDate statDate) {
        this.statDate = statDate;
    }
}
