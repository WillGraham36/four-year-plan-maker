package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ULConcentrationDTO {
    private String concentration;
    private List<ULCourseInfoDTO> courses;
}