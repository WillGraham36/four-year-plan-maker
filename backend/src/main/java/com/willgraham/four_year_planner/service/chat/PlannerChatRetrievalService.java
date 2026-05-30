package com.willgraham.four_year_planner.service.chat;

import com.willgraham.four_year_planner.dto.CourseDto;
import com.willgraham.four_year_planner.dto.GenEdRequirementDto;
import com.willgraham.four_year_planner.dto.GetUserInfoResponseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatCourseDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatGenEdRequirementDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatIntentDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatProgressDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRequirementDto;
import com.willgraham.four_year_planner.dto.chat.PlannerChatRetrievalDto;
import com.willgraham.four_year_planner.model.Course;
import com.willgraham.four_year_planner.model.CurriculumProgramRequirement;
import com.willgraham.four_year_planner.model.CurriculumRequirementStatus;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.repository.CourseRepository;
import com.willgraham.four_year_planner.repository.CurriculumProgramRequirementRepository;
import com.willgraham.four_year_planner.service.CourseService;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Service
public class PlannerChatRetrievalService {
    private static final int REQUIRED_DEGREE_CREDITS = 120;

    private final CourseService courseService;
    private final CourseRepository courseRepository;
    private final UserCourseService userCourseService;
    private final UserService userService;
    private final GenEdService genEdService;
    private final CurriculumProgramRequirementRepository requirementRepository;

    public PlannerChatRetrievalDto retrieve(String userId, PlannerChatIntentDto intent) {
        GetUserInfoResponseDto userInfo = userService.getUserInfo(userId);
        Map<Semester, List<CourseDto>> userCourses = userCourseService.getAllCoursesForUser(userId);
        List<GenEdRequirementDto> genEdRequirements = genEdService.recalculateAndGetRequirements(userId);

        List<PlannerChatCourseDto> courses = retrieveCourses(intent, userCourses, userInfo);
        List<PlannerChatRequirementDto> requirements = retrieveRequirements(intent, userInfo);
        PlannerChatProgressDto progress = buildProgress(userInfo, userCourses, genEdRequirements);
        List<PlannerChatGenEdRequirementDto> genEds = genEdRequirements.stream()
                .map(requirement -> new PlannerChatGenEdRequirementDto(
                        requirement.getRequirementName(),
                        requirement.getSatisfiedByGenEd(),
                        requirement.getCourseId(),
                        requirement.getSemesterName(),
                        requirement.getTransferCreditName(),
                        requirement.getCourseId() != null && !requirement.getCourseId().isBlank()
                ))
                .toList();

        List<String> notes = new ArrayList<>();
        if (courses.isEmpty()) {
            notes.add("No verified courses matched the request.");
        }
        if (requirements.isEmpty()) {
            notes.add("No approved stored curriculum requirements matched the request.");
        }
        notes.add("Use only these retrieved courses, requirements, and progress facts in the response.");

        return new PlannerChatRetrievalDto(progress, courses, requirements, genEds, notes);
    }

    private List<PlannerChatCourseDto> retrieveCourses(
            PlannerChatIntentDto intent,
            Map<Semester, List<CourseDto>> userCourses,
            GetUserInfoResponseDto userInfo
    ) {
        Map<String, PlannerChatCourseDto> results = new LinkedHashMap<>();
        int limit = intent.limit();

        for (String courseId : intent.courseIds()) {
            Course course = courseService.findOrFetchByCourseId(courseId);
            results.put(course.getCourseId(), PlannerChatCourseDto.fromCourse(course));
        }

        if (intent.query() != null && !intent.query().isBlank()) {
            for (Course course : courseRepository.searchCourses(intent.query(), PageRequest.of(0, limit))) {
                results.putIfAbsent(course.getCourseId(), PlannerChatCourseDto.fromCourse(course));
            }
        }

        if (!intent.departments().isEmpty()) {
            for (Course course : courseRepository.findByDepartments(intent.departments(), PageRequest.of(0, limit))) {
                results.putIfAbsent(course.getCourseId(), PlannerChatCourseDto.fromCourse(course));
            }
        }

        for (CourseDto course : flattenUserCourses(userCourses)) {
            if (matchesGenEd(course, intent.genEds()) || matchesQuery(course, intent.query())) {
                boolean completed = isCompleted(course.getSemester(), userInfo);
                results.putIfAbsent(course.getCourseId(), new PlannerChatCourseDto(
                        course.getCourseId(),
                        course.getName(),
                        course.getCourseId() == null || course.getCourseId().length() < 4
                                ? null
                                : course.getCourseId().substring(0, 4),
                        course.getCredits(),
                        course.getGenEds(),
                        course.getSemester(),
                        completed,
                        !completed
                ));
            }
        }

        return results.values().stream()
                .limit(limit)
                .toList();
    }

    private List<PlannerChatRequirementDto> retrieveRequirements(PlannerChatIntentDto intent, GetUserInfoResponseDto userInfo) {
        Map<Long, PlannerChatRequirementDto> results = new LinkedHashMap<>();
        int limit = intent.limit();

        List<String> queries = new ArrayList<>();
        queries.addAll(intent.programNames());
        queries.addAll(intent.requirementKeywords());
        if (userInfo.getMajor() != null && !userInfo.getMajor().isBlank()) {
            queries.add(userInfo.getMajor());
        }
        if (intent.query() != null && !intent.query().isBlank()) {
            queries.add(intent.query());
        }

        for (String query : queries) {
            if (query == null || query.isBlank()) {
                continue;
            }
            for (CurriculumProgramRequirement requirement : requirementRepository.searchByStatus(
                    query,
                    CurriculumRequirementStatus.APPROVED,
                    PageRequest.of(0, limit)
            )) {
                results.putIfAbsent(requirement.getId(), toRequirementDto(requirement));
            }
            if (results.size() >= limit) {
                break;
            }
        }

        return results.values().stream().limit(limit).toList();
    }

    private PlannerChatRequirementDto toRequirementDto(CurriculumProgramRequirement requirement) {
        return new PlannerChatRequirementDto(
                requirement.getId(),
                requirement.getProgramName(),
                requirement.getCatalogTitle(),
                requirement.getProgramType(),
                requirement.getStatus(),
                requirement.getCatalogYear(),
                requirement.getSourceUrl(),
                excerpt(requirement.getRawRequirementsText())
        );
    }

    private PlannerChatProgressDto buildProgress(
            GetUserInfoResponseDto userInfo,
            Map<Semester, List<CourseDto>> userCourses,
            List<GenEdRequirementDto> genEdRequirements
    ) {
        int completedCredits = 0;
        int plannedCredits = 0;

        for (CourseDto course : flattenUserCourses(userCourses)) {
            int credits = course.getCredits() == null ? 0 : course.getCredits();
            if (isCompleted(course.getSemester(), userInfo)) {
                completedCredits += credits;
            } else {
                plannedCredits += credits;
            }
        }

        int completedGenEds = (int) genEdRequirements.stream()
                .filter(requirement -> requirement.getCourseId() != null && !requirement.getCourseId().isBlank())
                .count();

        return new PlannerChatProgressDto(
                userInfo.getMajor(),
                userInfo.getTrack() == null ? null : userInfo.getTrack().name(),
                REQUIRED_DEGREE_CREDITS,
                completedCredits,
                plannedCredits,
                completedCredits + plannedCredits,
                completedGenEds,
                genEdRequirements.size()
        );
    }

    private List<CourseDto> flattenUserCourses(Map<Semester, List<CourseDto>> userCourses) {
        return userCourses.values().stream()
                .flatMap(List::stream)
                .sorted(Comparator
                        .comparing(CourseDto::getSemester, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(CourseDto::getIndex, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(CourseDto::getCourseId, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    private boolean isCompleted(Semester semester, GetUserInfoResponseDto userInfo) {
        return userInfo.getCompletedSemesters() != null && userInfo.getCompletedSemesters().contains(semester);
    }

    private boolean matchesGenEd(CourseDto course, List<String> genEds) {
        if (genEds == null || genEds.isEmpty() || course.getGenEds() == null) {
            return false;
        }
        return course.getGenEds().stream()
                .flatMap(List::stream)
                .anyMatch(genEds::contains);
    }

    private boolean matchesQuery(CourseDto course, String query) {
        if (query == null || query.isBlank()) {
            return false;
        }
        String normalizedQuery = query.toLowerCase();
        return containsIgnoreCase(course.getCourseId(), normalizedQuery)
                || containsIgnoreCase(course.getName(), normalizedQuery);
    }

    private boolean containsIgnoreCase(String value, String normalizedQuery) {
        return value != null && value.toLowerCase().contains(normalizedQuery);
    }

    private String excerpt(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() <= 1200 ? compact : compact.substring(0, 1200);
    }
}
