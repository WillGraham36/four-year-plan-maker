package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.*;
import com.willgraham.four_year_planner.exception.CourseNotFoundException;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.model.UserCourse;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
        UserCourse existingCourse = userCourseRepository.findByUserIdAndCourse_CourseIdAndSemester(
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
        List<UserCourse> courses =  userCourseRepository.findByUserIdWithCoursesOrdered(userId);
        return getAllCoursesForUser(courses);
    }

    public Map<Semester, List<CourseDto>> getAllCoursesForUser(List<UserCourse> courses) {
        List<CourseDto> courseDtos = hydrateCourses(courses).stream()
                .map(CourseDto::fromUserCourse)
                .toList();

        return courseDtos.stream().collect(Collectors.groupingBy(CourseDto::getSemester));
    }

    public int deleteUserCoursesByIdentifiers(String userId, List<CourseIdentifierDto> courseIdentifiers) {
        int count = 0;

        for(CourseIdentifierDto dto : courseIdentifiers) {
            // Remove course
            count += userCourseRepository.deleteByUserIdAndCourse_CourseIdAndSemester(userId, dto.getCourseId(), dto.getSemester());
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
        UserCourse userCourse = userCourseRepository.findByUserIdAndCourse_CourseIdAndSemester(
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
        UserCourse userCourse = userCourseRepository.findByUserIdAndCourse_CourseIdAndSemester(
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
        userCourse.setCourse(course);
        userCourse.setSemester(dto.getSemester());
        userCourse.setTransferCreditName(dto.getName());
        userCourse.setTransferGenEdsOverride(dto.getGenEdOverrides());

        save(userCourse);
    }

    public List<TransferCreditDto> getTransferCreditsForUser(String userId) {
        List<UserCourse> transferCourses =  userCourseRepository.findTransferCreditsByUserId(userId);

        return hydrateCourses(transferCourses).stream()
                .map((course) -> new TransferCreditDto(
                        course.getTransferCreditName(),
                        course.getCourse(),
                        course.getSemester(),
                        course.getTransferGenEdsOverride()
                )).toList();
    }

    public ULConcentrationDTO getULConcentrationAndCourses(String userId) {
        User user = userService.findById(userId);
        String concentration = user.getULConcentration();
        List<UserCourse> concentrationCourses = getULCourses(userId, concentration);
        List<UserCourse> customCourses = userCourseRepository.findCustomULCoursesByUserId(userId);
        return buildULConcentrationAndCourses(concentration, concentrationCourses, customCourses);
    }

    public ULConcentrationDTO getULConcentrationAndCourses(String userId, List<UserCourse> orderedCourses) {
        return getULConcentrationAndCourses(userService.findById(userId), orderedCourses);
    }

    public ULConcentrationDTO getULConcentrationAndCourses(User user, List<UserCourse> orderedCourses) {
        String concentration = user.getULConcentration();
        List<UserCourse> concentrationCourses = isValidConcentration(concentration)
                ? orderedCourses.stream()
                        .filter(course -> course.getCourseId() != null && course.getCourseId().startsWith(concentration))
                        .filter(course -> course.getCourse() != null)
                        .toList()
                : List.of();
        List<UserCourse> customCourses = orderedCourses.stream()
                .filter(course -> Boolean.TRUE.equals(course.getCustomUlConcentration()))
                .filter(course -> course.getCourse() != null)
                .toList();

        return buildULConcentrationAndCourses(concentration, concentrationCourses, customCourses);
    }

    private ULConcentrationDTO buildULConcentrationAndCourses(
            String concentration,
            List<UserCourse> concentrationCourses,
            List<UserCourse> customCourses
    ) {
        List<UserCourse> courses = Stream.concat(concentrationCourses.stream(), customCourses.stream()).toList();

        // Filter out malformed rows and courses that are not 300 level or above.
        courses = hydrateCourses(courses).stream()
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

    private boolean isValidConcentration(String concentration) {
        return concentration != null && !concentration.isEmpty() && concentration.length() <= 4;
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

    private List<UserCourse> hydrateCourses(List<UserCourse> userCourses) {
        Set<String> missingCourseIds = userCourses.stream()
                .filter(userCourse -> userCourse != null
                        && userCourse.getCourse() == null
                        && userCourse.getCourseId() != null
                        && !userCourse.getCourseId().isBlank())
                .map(UserCourse::getCourseId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (missingCourseIds.isEmpty()) {
            return userCourses;
        }

        Map<String, Course> coursesById = courseService.findByIds(List.copyOf(missingCourseIds)).stream()
                .collect(Collectors.toMap(Course::getCourseId, Function.identity()));

        for (String courseId : missingCourseIds) {
            Course course = coursesById.get(courseId);
            if (course == null) {
                throw new CourseNotFoundException("Could not find course with ID: " + courseId);
            }
        }

        userCourses.stream()
                .filter(userCourse -> userCourse != null
                        && userCourse.getCourse() == null
                        && userCourse.getCourseId() != null
                        && !userCourse.getCourseId().isBlank())
                .forEach(userCourse -> userCourse.setCourse(coursesById.get(userCourse.getCourseId())));

        return userCourses;
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
