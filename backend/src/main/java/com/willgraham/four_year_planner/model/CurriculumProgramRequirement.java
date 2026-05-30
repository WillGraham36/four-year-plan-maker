package com.willgraham.four_year_planner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(
        name = "curriculum_program_requirements",
        indexes = {
                @Index(name = "idx_curriculum_program_name", columnList = "program_name"),
                @Index(name = "idx_curriculum_program_type", columnList = "program_type"),
                @Index(name = "idx_curriculum_requirement_status", columnList = "status")
        }
)
public class CurriculumProgramRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "program_name", nullable = false)
    private String programName;

    @Column(name = "catalog_title", nullable = false)
    private String catalogTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "program_type", nullable = false)
    private CurriculumProgramType programType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CurriculumRequirementStatus status = CurriculumRequirementStatus.DRAFT;

    private String catalogYear;

    @Column(name = "source_url", nullable = false, unique = true, length = 1024)
    private String sourceUrl;

    @Column(columnDefinition = "TEXT")
    private String rawSourceHtml;

    @Column(columnDefinition = "TEXT")
    private String rawRequirementsText;

    @Column(columnDefinition = "TEXT")
    private String structuredRequirementsJson;

    @Column(columnDefinition = "TEXT")
    private String parseWarningsJson;

    private Instant lastSyncedAt;
    private Instant approvedAt;
    private String approvedBy;
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
