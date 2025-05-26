package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@AllArgsConstructor
@Data
public class GenEdCourseInfoDto {
    private List<List<String>> genEds;
    private String courseId;
    private Semester semester;
}
