package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AcademicOverviewResponseDto {
    private Map<Semester, List<CourseDto>> allSemesters;
    private List<GenEdDto> genEds;
    private ULConcentrationDTO upperLevelConcentrationCourses;
    private GetUserInfoResponseDto userInfo;
}
