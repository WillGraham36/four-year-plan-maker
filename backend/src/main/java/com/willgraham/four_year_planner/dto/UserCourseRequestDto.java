package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import lombok.Data;

@Data
public class UserCourseRequestDto {
    private String userId;
    private Course course;
    private Semester semester;
}
