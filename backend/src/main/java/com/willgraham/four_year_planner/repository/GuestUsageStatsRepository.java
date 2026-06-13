package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.GuestUsageStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface GuestUsageStatsRepository extends JpaRepository<GuestUsageStats, LocalDate> {
}
