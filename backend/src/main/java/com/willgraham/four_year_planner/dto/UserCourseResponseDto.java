package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import lombok.Data;

@Data
public class UserCourseResponseDto {
    private Long id;
    private String courseId;
    private Semester semester;

    public UserCourseResponseDto(UserCourse userCourse) {
        this.id = userCourse.getId();
        this.courseId = userCourse.getCourseId();
        this.semester = userCourse.getSemester();
    }
}
