package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Course;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CourseCatalogDto {
    private String courseId;
    private String deptId;
    private Integer credits;
    private List<List<String>> genEds;
    private String name;

    public static CourseCatalogDto fromCourse(Course course) {
        return new CourseCatalogDto(
                course.getCourseId(),
                course.getDeptId(),
                course.getCredits(),
                course.getGenEds(),
                course.getName()
        );
    }
}
