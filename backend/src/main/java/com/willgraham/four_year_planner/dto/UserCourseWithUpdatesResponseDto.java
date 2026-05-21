package com.willgraham.four_year_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCourseWithUpdatesResponseDto {
    private List<UserCourseResponseDto> savedCourses;
    private List<GenEdRequirementDto> updatedGenEdRequirements;
    private ULConcentrationDTO updatedULConcentration;
}
