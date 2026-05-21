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
    private List<String> assignedGenEds;
    private Integer assignedGenEdBranchIndex;
    private Semester semester;
    private Integer index;

    public static CourseDto fromUserCourse(UserCourse userCourse) {
        CourseDto dto = new CourseDto();
        dto.setId(userCourse.getId());
        dto.setCourseId(userCourse.getCourseId());
        dto.setName(userCourse.getCourse().getName());
        dto.setCredits(userCourse.getCourse().getCredits());
        if(userCourse.getTransferGenEdsOverride() != null && !userCourse.getTransferGenEdsOverride().isEmpty()) {
            dto.setGenEds(userCourse.getTransferGenEdsOverride());
        } else {
            dto.setGenEds(userCourse.getCourse().getGenEds());
        }
        dto.setAssignedGenEds(userCourse.getSelectedGenEds());
        dto.setAssignedGenEdBranchIndex(findAssignedBranchIndex(dto.getGenEds(), userCourse.getSelectedGenEds()));
        dto.setSemester(userCourse.getSemester());
        dto.setIndex(userCourse.getIndex());
        return dto;
    }

    private static Integer findAssignedBranchIndex(List<List<String>> genEdGroups, List<String> assignedGenEds) {
        if (genEdGroups == null || assignedGenEds == null || assignedGenEds.isEmpty()) {
            return null;
        }

        for (int i = 0; i < genEdGroups.size(); i++) {
            if (genEdGroups.get(i).equals(assignedGenEds)) {
                return i;
            }
        }

        return null;
    }
}
