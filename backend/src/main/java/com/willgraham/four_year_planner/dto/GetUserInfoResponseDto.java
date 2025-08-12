package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetUserInfoResponseDto {
    private Semester startSemester;
    private Semester endSemester;

    private List<Semester> offSemesters;
    private List<Semester> completedSemesters;
    private String note;
}
