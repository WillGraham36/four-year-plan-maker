package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.UserCourse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GenEdAssignmentServiceTest {
    private final GenEdAssignmentService assignmentService = new GenEdAssignmentService();

    @Test
    void choosesBranchThatMaximizesFulfilledRequirementsGlobally() {
        UserCourse flexibleCourse = userCourse(
                1L,
                "ARHU200",
                List.of(List.of("DSHS"), List.of("DSHU", "DVUP"))
        );
        UserCourse dshsCourse = userCourse(
                2L,
                "HIST201",
                List.of(List.of("DSHS"))
        );

        GenEdAssignmentService.AssignmentSnapshot snapshot =
                assignmentService.assignCourses(List.of(flexibleCourse, dshsCourse));

        assertEquals(
                List.of("DSHU", "DVUP"),
                snapshot.courseAssignments().get(1L).assignedBranch()
        );
        assertEquals(
                3,
                snapshot.requirementAssignments().stream()
                        .filter(assignment -> !assignment.courseId().isBlank())
                        .count()
        );
    }

    @Test
    void usesDependencyBranchWhenCompanionCourseExistsInSameSemester() {
        UserCourse dependentCourse = userCourse(
                1L,
                "ARTT100",
                List.of(List.of("DSHS"), List.of("DSHU", "DVUP|CHEM131"))
        );
        UserCourse companionCourse = userCourse(
                2L,
                "CHEM131",
                List.of(List.of("NONE"))
        );

        GenEdAssignmentService.AssignmentSnapshot snapshot =
                assignmentService.assignCourses(List.of(dependentCourse, companionCourse));

        assertEquals(
                List.of("DSHU", "DVUP|CHEM131"),
                snapshot.courseAssignments().get(1L).assignedBranch()
        );
    }

    @Test
    void ignoresDependencyBranchWhenCompanionCourseIsMissing() {
        UserCourse dependentCourse = userCourse(
                1L,
                "ARTT100",
                List.of(List.of("DSHS"), List.of("DSHU", "DVUP|CHEM131"))
        );

        GenEdAssignmentService.AssignmentSnapshot snapshot =
                assignmentService.assignCourses(List.of(dependentCourse));

        assertNotNull(snapshot.courseAssignments().get(1L));
        assertEquals(
                List.of("DSHS"),
                snapshot.courseAssignments().get(1L).assignedBranch()
        );
    }

    private UserCourse userCourse(Long id, String courseId, List<List<String>> genEds) {
        Course course = new Course();
        course.setCourseId(courseId);
        course.setName(courseId);
        course.setCredits(3);
        course.setGenEds(genEds);

        UserCourse userCourse = new UserCourse();
        userCourse.setId(id);
        userCourse.setUserId("user-1");
        userCourse.setCourseId(courseId);
        userCourse.setCourse(course);
        userCourse.setSemester(new Semester(Term.FALL, 2026));
        userCourse.setIndex(id.intValue());
        return userCourse;
    }
}
