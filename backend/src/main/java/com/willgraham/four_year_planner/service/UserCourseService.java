package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.dto.CourseIdentifierDto;
import com.willgraham.four_year_planner.dto.TransferCreditDto;
import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.GenEd;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import lombok.AllArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class UserCourseService {
    private final UserCourseRepository userCourseRepository;
    private final CourseService courseService;

    public UserCourse save(UserCourse userCourse) {
        boolean existsInSameSemester = userCourseRepository.existsByUserIdAndCourseIdAndSemester(
                userCourse.getUserId(),
                userCourse.getCourseId(),
                userCourse.getSemester()
        );

        // If this is just a duplicate course, don't save it and return a blank course
        if(existsInSameSemester) {
            return new UserCourse();
        }

        return userCourseRepository.save(userCourse);
    }

    public List<UserCourse> getAllCoursesForUser(String userId) {
        return userCourseRepository.findByUserIdOrderBySemesterAsc(userId);
    }

    public int deleteUserCoursesByIdentifiers(String userId, List<CourseIdentifierDto> courseIdentifiers) {
        int count = 0;

        for(CourseIdentifierDto dto : courseIdentifiers) {
            // Remove course
            count += userCourseRepository.deleteByUserIdAndCourseIdAndSemester(userId, dto.getCourseId(), dto.getSemester());
        }
        // Get remaining courses once were done removing all the courses
        List<UserCourse> remainingCourses = userCourseRepository.findByUserId(userId);
        Set<String> activeCourseIds = remainingCourses.stream()
                .map(UserCourse::getCourseId)
                .collect(Collectors.toSet());
        // Revalidate selectedGenEds on remaining courses
        for (UserCourse course : remainingCourses) {
            List<String> selected = course.getSelectedGenEds();

            // Only validate if the course has selectedGenEds
            if (selected != null && !selected.isEmpty()) {
                boolean valid = true;

                for (String genEd : selected) {
                    Optional<DependentGenEd> dep = parseDependentGenEd(genEd);
                    if (dep.isPresent() && !activeCourseIds.contains(dep.get().requiredCourseId())) {
                        valid = false;
                        break;
                    }
                }

                if (!valid) {
                    // Recalculate: choose the best valid genEd group based on dependency status
                    List<List<String>> genEdGroups = course.getCourse().getGenEds();
                    List<String> updatedGenEds = selectValidGenEdGroup(genEdGroups, activeCourseIds);

                    course.setSelectedGenEds(updatedGenEds);
                    userCourseRepository.save(course);
                }
            }
        }

        return count;
    }

    public void updateUserCourseSelectedGenEds(String userId, String courseId, List<String> selectedGenEds) {
        UserCourse userCourse = userCourseRepository
                .findByUserIdAndCourse_CourseId(userId, courseId);
        if(userCourse == null) {
            throw new CourseNotFoundException("Course not found");
        }

        // Check to make sure the genEds provided are valid
        List<List<String>> validGenEdGroups = userCourse.getCourse().getGenEds();
        Set<String> selectedSet = new HashSet<>(selectedGenEds);
        boolean isValidSelection = validGenEdGroups.stream().anyMatch(group -> {
            Set<String> groupSet = new HashSet<>(group);
            return groupSet.equals(selectedSet);
        });

        if (!isValidSelection) {
            throw new IllegalStateException("Selected GenEds do not match any valid group for this course.");
        }

        int rows = userCourseRepository.updateSelectedGenEdsByUserIdAndCourseId(selectedGenEds, userId, courseId);
        if (rows == 0) {
            throw new CourseNotFoundException("Course not found");
        }
    }

    public List<UserCourse> getULCourses(String userId, String concentration) {
        if(concentration.isEmpty() || concentration.length() > 4) {
            return List.of();
        }
        return userCourseRepository.findByUserIdAndCourseIdStartingWith(userId, concentration);
    }


    record DependentGenEd(String genEd, String requiredCourseId) {}

    Optional<DependentGenEd> parseDependentGenEd(String genEdRaw) {
        if (genEdRaw.contains("|")) {
            String[] parts = genEdRaw.split("\\|");
            return Optional.of(new DependentGenEd(parts[0], parts[1]));
        }
        return Optional.empty();
    }

    private static List<String> selectValidGenEdGroup(List<List<String>> genEdGroups, Set<String> enrolledCourseIds) {
        if (genEdGroups == null || genEdGroups.isEmpty()) return List.of();

        List<String> firstGroup = genEdGroups.get(0);

        boolean dependencyMet = firstGroup.stream().allMatch(genEdRaw -> {
            if (genEdRaw.contains("|")) {
                String[] parts = genEdRaw.split("\\|");
                return enrolledCourseIds.contains(parts[1]);
            }
            return true;
        });

        if (dependencyMet) {
            return firstGroup.stream()
                    .map(genEdRaw -> genEdRaw.contains("|") ? genEdRaw.split("\\|")[0] : genEdRaw)
                    .toList();
        }

        if (genEdGroups.size() > 1) {
            return genEdGroups.get(1);
        }

        return List.of();
    }

    public void processTransferCreditDto(TransferCreditDto dto, String userId) {
        Course course = courseService.findOrCreateCourse(dto.getCourse());

        UserCourse userCourse = new UserCourse();
        userCourse.setUserId(userId);
        userCourse.setCourseId(course.getCourseId());
        userCourse.setSemester(dto.getSemester());
        userCourse.setTransferCreditName(dto.getName());

        List<List<String>> requestGenEds = dto.getCourse().getGenEds();
        if (requestGenEds.size() > 1) {
            if (requestGenEds.getFirst().stream().anyMatch(s -> s.contains("|"))) {
                userCourse.setSelectedGenEds(requestGenEds.get(1));
            } else {
                userCourse.setSelectedGenEds(requestGenEds.getFirst());
            }
        }

        save(userCourse);
    }
}
