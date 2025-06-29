package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransferCreditDto {
    private String name;
    private Course course;
    private Semester semester;
    private List<List<String>> genEdOverrides;
}
