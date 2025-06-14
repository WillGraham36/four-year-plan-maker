package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ULCourseInfoDTO {
    private String courseId;
    private Semester semester;
    private int credits;
}
