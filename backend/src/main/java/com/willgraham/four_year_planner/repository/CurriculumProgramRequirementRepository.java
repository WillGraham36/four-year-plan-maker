package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CurriculumProgramRequirementRepository extends
        JpaRepository<CurriculumProgramRequirement, Long>,
        JpaSpecificationExecutor<CurriculumProgramRequirement> {
    Optional<CurriculumProgramRequirement> findBySourceUrl(String sourceUrl);
}
