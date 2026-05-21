package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class UserCourseService {
    private final UserCourseRepository userCourseRepository;
    private final CourseService courseService;
    private final UserService userService;

    public UserCourse save(UserCourse userCourse) {
        UserCourse existingCourse = userCourseRepository.findByUserIdAndCourseIdAndSemester(
                userCourse.getUserId(),
                userCourse.getCourseId(),
                userCourse.getSemester()
        );

        // If this is a duplicate entry for the same semester, return the existing row instead of a blank object.
        if(existingCourse != null) {
            return hydrateCourse(existingCourse);
        }

        return hydrateCourse(userCourseRepository.save(userCourse));
    }

    public Map<Semester, List<CourseDto>> getAllCoursesForUser(String userId) {
        List<UserCourse> courses =  userCourseRepository.findByUserIdOrdered(userId);

        // Transform DTOs
        List<CourseDto> courseDtos = courses.stream()
                .map(this::hydrateCourse)
                .map(CourseDto::fromUserCourse)
                .toList();

        // Group by semester
        return courseDtos.stream().collect(Collectors.groupingBy(CourseDto::getSemester));
    }

    public int deleteUserCoursesByIdentifiers(String userId, List<CourseIdentifierDto> courseIdentifiers) {
        int count = 0;

        for(CourseIdentifierDto dto : courseIdentifiers) {
            // Remove course
            count += userCourseRepository.deleteByUserIdAndCourseIdAndSemester(userId, dto.getCourseId(), dto.getSemester());
        }
        return count;
    }

    public List<UserCourse> getULCourses(String userId, String concentration) {
        if(concentration.isEmpty() || concentration.length() > 4) {
            return List.of();
        }
        return userCourseRepository.findByUserIdAndCourseIdStartingWith(userId, concentration);
    }

    public void processTransferCreditDto(TransferCreditDto dto, String userId) {
        Course course = courseService.findOrCreateCourse(dto.getCourse());

        UserCourse userCourse = new UserCourse();
        userCourse.setUserId(userId);
        userCourse.setCourseId(course.getCourseId());
        userCourse.setSemester(dto.getSemester());
        userCourse.setTransferCreditName(dto.getName());
        userCourse.setTransferGenEdsOverride(dto.getGenEdOverrides());

        save(userCourse);
    }

    public List<TransferCreditDto> getTransferCreditsForUser(String userId) {
        List<UserCourse> transferCourses =  userCourseRepository.findTransferCreditsByUserId(userId);

        return transferCourses.stream()
                .map(this::hydrateCourse)
                .map((course) -> new TransferCreditDto(
                        course.getTransferCreditName(),
                        course.getCourse(),
                        course.getSemester(),
                        course.getTransferGenEdsOverride()
                )).toList();
    }

    public ULConcentrationDTO getULConcentrationAndCourses(String userId) {
        String concentration = userService.findById(userId).getULConcentration();
        List<UserCourse> courses = getULCourses(userId, concentration);

        //Filter out courses that are not 3 or 400 level
        courses = courses.stream().filter(c -> c.getCourseId().charAt(4) == '3' || c.getCourseId().charAt(4) == '4').toList();

        // Remove duplicate courses
        courses = courses.stream()
                .map(this::hydrateCourse)
                .collect(Collectors.toMap(
                        UserCourse::getCourseId,
                        Function.identity(),
                        (existing, replacement) -> existing,
                        LinkedHashMap::new))
                .values()
                .stream()
                .toList();


        List<ULCourseInfoDTO> coursesDTO = courses.stream()
                .map(c -> new ULCourseInfoDTO(
                        c.getCourseId(),
                        c.getSemester(),
                        c.getCourse().getCredits()
                ))
                .toList();

        return new ULConcentrationDTO(concentration, coursesDTO);
    }

    private UserCourse hydrateCourse(UserCourse userCourse) {
        if (userCourse == null) {
            return null;
        }

        if (userCourse.getCourse() == null && userCourse.getCourseId() != null && !userCourse.getCourseId().isBlank()) {
            userCourse.setCourse(courseService.findById(userCourse.getCourseId()));
        }

        return userCourse;
    }
}
