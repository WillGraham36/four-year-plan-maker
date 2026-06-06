package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculumProgramRequirementRepository extends
        JpaRepository<CurriculumProgramRequirement, Long>,
        JpaSpecificationExecutor<CurriculumProgramRequirement> {
    Optional<CurriculumProgramRequirement> findBySourceUrl(String sourceUrl);

    @Query("""
            SELECT r FROM CurriculumProgramRequirement r
            WHERE r.status = :status
              AND (
                  LOWER(r.programName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.catalogTitle) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.rawRequirementsText) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.structuredRequirementsJson) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY r.programName ASC, r.catalogTitle ASC
            """)
    List<CurriculumProgramRequirement> searchByStatus(String query, CurriculumRequirementStatus status, Pageable pageable);

    @Query("""
            SELECT r FROM CurriculumProgramRequirement r
            WHERE r.status <> :status
              AND (
                  LOWER(r.programName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.catalogTitle) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.rawRequirementsText) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(r.structuredRequirementsJson) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY r.programName ASC, r.catalogTitle ASC
            """)
    List<CurriculumProgramRequirement> searchByStatusNot(String query, CurriculumRequirementStatus status, Pageable pageable);
}
