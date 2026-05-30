package com.willgraham.four_year_planner.dto.chat;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;

import java.util.List;

public record PlannerChatCourseDto(
        String courseId,
        String name,
        String deptId,
        Integer credits,
        List<List<String>> genEds,
        Semester semester,
        boolean completed,
        boolean planned
) {
    public static PlannerChatCourseDto fromCourse(Course course) {
        return new PlannerChatCourseDto(
                course.getCourseId(),
                course.getName(),
                course.getDeptId(),
                course.getCredits(),
                course.getGenEds() == null ? List.of() : course.getGenEds(),
                null,
                false,
                false
        );
    }
}
