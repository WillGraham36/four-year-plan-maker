package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class UserCourseService {
    private final UserCourseRepository userCourseRepository;

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
}
