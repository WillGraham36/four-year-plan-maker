package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Data
public class UserCourseWithInfoDto {
    private List<List<String>> genEds;
    private String courseId;
    private Semester semester;
    private List<String> selectedGenEds;
    private String transferCreditName = "";
}
