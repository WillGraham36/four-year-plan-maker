package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import lombok.Data;

import java.util.List;

@Data
public class UserCourseSelectedGenEdRequestDto {
    private String courseId;
    private List<String> selectedGenEds;
}
