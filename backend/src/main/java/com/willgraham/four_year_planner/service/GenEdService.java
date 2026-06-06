package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.GenEdRequirementDto;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import jakarta.persistence.EntityManager;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Service
public class GenEdService {
    private final UserCourseRepository userCourseRepository;
    private final GenEdAssignmentService genEdAssignmentService;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<GenEdRequirementDto> getRequirements(String userId) {
        return getRequirementsWithCourses(userId).genEdRequirements();
    }

    @Transactional(readOnly = true)
    public GenEdCalculationResult getRequirementsWithCourses(String userId) {
        return calculateAndGetRequirementsWithCourses(userId, false);
    }

    @Transactional
    public List<GenEdRequirementDto> recalculateAndGetRequirements(String userId) {
        return recalculateAndGetRequirementsWithCourses(userId).genEdRequirements();
    }

    @Transactional
    public GenEdCalculationResult recalculateAndGetRequirementsWithCourses(String userId) {
        return calculateAndGetRequirementsWithCourses(userId, true);
    }

    private GenEdCalculationResult calculateAndGetRequirementsWithCourses(String userId, boolean persistAssignments) {
        List<UserCourse> courses = new ArrayList<>(userCourseRepository.findByUserIdWithCoursesOrdered(userId));
        if (!persistAssignments) {
            courses.forEach(entityManager::detach);
        }

        List<GenEdRequirementDto> genEdRequirements = recalculateAndGetRequirements(courses, persistAssignments);
        return new GenEdCalculationResult(genEdRequirements, courses);
    }

    private List<GenEdRequirementDto> recalculateAndGetRequirements(List<UserCourse> courses, boolean persistAssignments) {
        courses.sort(Comparator
                .comparing(UserCourse::getSemester)
                .thenComparing(UserCourse::getIndex, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(UserCourse::getCourseId)
                .thenComparing(UserCourse::getId));

        GenEdAssignmentService.AssignmentSnapshot assignmentSnapshot =
                genEdAssignmentService.assignCourses(courses);

        List<UserCourse> changedCourses = new ArrayList<>();
        for (UserCourse course : courses) {
            GenEdAssignmentService.CourseAssignment assignment =
                    assignmentSnapshot.courseAssignments().get(course.getId());
            List<String> assignedBranch = assignment == null ? null : assignment.assignedBranch();
            if (!Objects.equals(course.getSelectedGenEds(), assignedBranch)) {
                course.setSelectedGenEds(assignedBranch);
                changedCourses.add(course);
            }
        }

        if (persistAssignments && !changedCourses.isEmpty()) {
            userCourseRepository.saveAll(changedCourses);
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
