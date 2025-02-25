package com.willgraham.four_year_planner.dto;

import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseDto {
    private Long id;
    private String courseId;
    private String name;
    private Integer credits;
    private List<List<String>> genEds;
    private String description;
    private Semester semester;

    public static CourseDto fromUserCourse(UserCourse userCourse) {
        CourseDto dto = new CourseDto();
        dto.setId(userCourse.getId());
        dto.setCourseId(userCourse.getCourseId());
        dto.setName(userCourse.getCourse().getName());
        dto.setCredits(userCourse.getCourse().getCredits());
        dto.setGenEds(userCourse.getCourse().getGenEds());
        dto.setSemester(userCourse.getSemester());
        return dto;
    }

}
