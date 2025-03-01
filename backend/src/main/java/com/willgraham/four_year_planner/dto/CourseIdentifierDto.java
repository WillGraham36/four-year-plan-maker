package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.Data;

@Data
public class CourseIdentifierDto {
    private String courseId;
    private Semester semester;
}
