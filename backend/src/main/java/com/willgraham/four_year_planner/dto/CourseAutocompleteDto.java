package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Course;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CourseAutocompleteDto {
    private String courseId;
    private String name;
    private Integer credits;

    public static CourseAutocompleteDto fromCourse(Course course) {
        return new CourseAutocompleteDto(
                course.getCourseId(),
                course.getName(),
                course.getCredits()
        );
    }
}
