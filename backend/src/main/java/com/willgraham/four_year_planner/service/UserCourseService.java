package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.InvalidInputException;
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
import java.util.stream.Stream;

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
        if(concentration == null || concentration.isEmpty() || concentration.length() > 4) {
            return List.of();
        }
        return userCourseRepository.findULCoursesByUserIdAndConcentration(userId, concentration);
    }

    public ULConcentrationDTO addCustomULCourse(String userId, CourseIdentifierDto courseIdentifier) {
        UserCourse userCourse = userCourseRepository.findByUserIdAndCourseIdAndSemester(
                userId,
                courseIdentifier.getCourseId(),
                courseIdentifier.getSemester()
        );

        userCourse = hydrateCourse(userCourse);
        if (!isUpperLevelCourse(userCourse)) {
            throw new InvalidInputException("Only planner courses at the 300 level or above can be added to the upper level concentration");
        }

        userCourse.setCustomUlConcentration(true);
        userCourseRepository.save(userCourse);
        return getULConcentrationAndCourses(userId);
    }

    public ULConcentrationDTO removeCustomULCourse(String userId, CourseIdentifierDto courseIdentifier) {
        UserCourse userCourse = userCourseRepository.findByUserIdAndCourseIdAndSemester(
                userId,
                courseIdentifier.getCourseId(),
                courseIdentifier.getSemester()
        );

        if (userCourse != null) {
            userCourse.setCustomUlConcentration(false);
            userCourseRepository.save(userCourse);
        }

        return getULConcentrationAndCourses(userId);
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
        List<UserCourse> concentrationCourses = getULCourses(userId, concentration);
        List<UserCourse> customCourses = userCourseRepository.findCustomULCoursesByUserId(userId);
        List<UserCourse> courses = Stream.concat(concentrationCourses.stream(), customCourses.stream()).toList();

        // Filter out malformed rows and courses that are not 300 level or above.
        courses = courses.stream()
                .map(this::hydrateCourse)
                .filter(this::isUpperLevelCourse)
                .toList();

        // Remove duplicate courses
        courses = courses.stream()
                .collect(Collectors.toMap(
                        UserCourse::getCourseId,
                        Function.identity(),
                        (existing, replacement) -> Boolean.TRUE.equals(existing.getCustomUlConcentration()) ? existing : replacement,
                        LinkedHashMap::new))
                .values()
                .stream()
                .toList();


        List<ULCourseInfoDTO> coursesDTO = courses.stream()
                .map(c -> new ULCourseInfoDTO(
                        c.getCourseId(),
                        c.getSemester(),
                        c.getCourse().getCredits(),
                        Boolean.TRUE.equals(c.getCustomUlConcentration())
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

    private boolean hasUsableCourse(UserCourse userCourse) {
        return userCourse != null
                && userCourse.getCourseId() != null
                && userCourse.getCourseId().length() >= 5
                && userCourse.getCourse() != null
                && userCourse.getCourse().getCredits() != null;
    }

    private boolean isUpperLevelCourse(UserCourse userCourse) {
        if (!hasUsableCourse(userCourse)) {
            return false;
        }

        return userCourse.getCourseId()
                .chars()
                .filter(Character::isDigit)
                .map(Character::getNumericValue)
                .findFirst()
                .stream()
                .anyMatch(level -> level >= 3);
    }
}
