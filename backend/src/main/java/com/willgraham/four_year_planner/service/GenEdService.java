package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.GenEdRequirementDto;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Service
public class GenEdService {
    private final UserCourseRepository userCourseRepository;
    private final GenEdAssignmentService genEdAssignmentService;

    @Transactional
    public List<GenEdRequirementDto> recalculateAndGetRequirements(String userId) {
        return recalculateAndGetRequirementsWithCourses(userId).genEdRequirements();
    }

    @Transactional
    public GenEdCalculationResult recalculateAndGetRequirementsWithCourses(String userId) {
        List<UserCourse> courses = userCourseRepository.findByUserIdWithCoursesOrdered(userId);
        List<GenEdRequirementDto> genEdRequirements = recalculateAndGetRequirements(courses);
        return new GenEdCalculationResult(genEdRequirements, courses);
    }

    private List<GenEdRequirementDto> recalculateAndGetRequirements(List<UserCourse> courses) {
        courses.sort(Comparator
                .comparing(UserCourse::getSemester)
                .thenComparing(UserCourse::getIndex, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(UserCourse::getCourseId)
                .thenComparing(UserCourse::getId));

        GenEdAssignmentService.AssignmentSnapshot assignmentSnapshot =
                genEdAssignmentService.assignCourses(courses);

        for (UserCourse course : courses) {
            GenEdAssignmentService.CourseAssignment assignment =
                    assignmentSnapshot.courseAssignments().get(course.getId());
            List<String> assignedBranch = assignment == null ? null : assignment.assignedBranch();
            if (!Objects.equals(course.getSelectedGenEds(), assignedBranch)) {
                course.setSelectedGenEds(assignedBranch);
            }
        }

        return assignmentSnapshot.requirementAssignments().stream()
                .map(assignment -> new GenEdRequirementDto(
                        assignment.requirementName(),
                        assignment.satisfiedByGenEd(),
                        assignment.courseId(),
                        assignment.semesterName(),
                        assignment.transferCreditName()
                ))
                .toList();
    }

    public record GenEdCalculationResult(
            List<GenEdRequirementDto> genEdRequirements,
            List<UserCourse> userCourses
    ) {}
}
