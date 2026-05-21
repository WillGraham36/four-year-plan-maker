package com.willgraham.four_year_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class GenEdRequirementDto {
    private String requirementName;
    private String satisfiedByGenEd;
    private String courseId;
    private String semesterName;
    private String transferCreditName = "";
}
