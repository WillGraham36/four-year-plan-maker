package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.GenEdDto;
import com.willgraham.four_year_planner.dto.UserCourseWithInfoDto;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.projection.CourseProjection;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Optional;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class GenEdService {

    public static final List<String> GENEDS_LIST = List.of(
            "FSAW",
            "FSPW",
            "FSMA",
            "FSOC",
            "FSAR",

            "DSNL",
            "DSNS",
            "DSNL", // DSNS or DSNL
            "DSHS",
            "DSHS",
            "DSHU",
            "DSHU",
            "DSSP",
            "DSSP",

            "SCIS",
            "SCIS",

            "DVUP",
            "DVUP",
            "DVCC" //DVUP or DVCC
    );
    private static final Logger logger = LoggerFactory.getLogger(GenEdService.class);

    @Autowired
    private UserCourseRepository userCourseRepository;

    public List<UserCourseWithInfoDto> getUserCoursesWithInfo(String userId) {
        logger.info("GenEdService.getUserCourseGenEds called with userId: {}", userId);

        try {
            List<CourseProjection> projections = userCourseRepository.findAllCoursesWithInfoByUser(userId);

            List<UserCourseWithInfoDto> result = projections.stream()
                    .map(this::convertProjectionToDto)
                    .collect(Collectors.toList());

            logger.info("Conversion completed. Final result size: {}", result.size());
            return result;
        } catch (Exception e) {
            logger.error("Exception in getUserCourseGenEds for userId {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    private UserCourseWithInfoDto convertProjectionToDto(CourseProjection projection) {
        // Convert JSON string back to List<List<String>>
        ListOfListStringConverter listConverter = new ListOfListStringConverter();
        List<List<String>> genEds = listConverter.convertToEntityAttribute(projection.getGenEds());

        // Create Semester object
        Semester semester = new Semester();
        semester.setTerm(Term.valueOf(projection.getTerm()));
        semester.setYear(projection.getYear());

        // If there are genEd overrides return those instead
        if(projection.getGenEdOverrides() != null && !projection.getGenEdOverrides().isEmpty()) {
            List<List<String>> genEdOverrides = listConverter.convertToEntityAttribute(projection.getGenEdOverrides());
            return new UserCourseWithInfoDto(genEdOverrides, projection.getCourseId(), semester, projection.getSelectedGenEds(), projection.getTransferCreditName());
        }

        return new UserCourseWithInfoDto(genEds, projection.getCourseId(), semester, projection.getSelectedGenEds(), "");



    }

    public List<GenEdDto> getAllGenEds(String userId) {
        // Get gen eds from database
        List<UserCourseWithInfoDto> courses = getUserCoursesWithInfo(userId);

        // Remove genEds if the current course is not taken in the same semester
        for(UserCourseWithInfoDto course : courses) {
            List<List<String>> updatedGenEds = filterGenEds(course, courses);
            course.setGenEds(updatedGenEds);
        }

        List<GenEdDto> result = new ArrayList<>();

        for (UserCourseWithInfoDto course : courses) {
            List<String> selectedGroup;

            // Use selectedGenEds if present
            if (course.getSelectedGenEds() != null && !course.getSelectedGenEds().isEmpty()) {
                selectedGroup = course.getSelectedGenEds();
            } else {
                // Fall back to the first genEd group that contains valid genEds
                selectedGroup = null;
                for (List<String> genEdGroup : course.getGenEds()) {
                    if (genEdGroup.stream().anyMatch(GENEDS_LIST::contains)) {
                        selectedGroup = genEdGroup;
                        break;
                    }
                }
            }

            // If we found a valid group (either selected or matched), add GenEdDtos for it
            if (selectedGroup != null) {
                for (String genEd : selectedGroup) {
                    int pipeIndex = genEd.indexOf("|");
                    if(pipeIndex != -1) { // This is a dependant genEd, but we already filtered so we know its dependencies are met
                        genEd = genEd.substring(0, pipeIndex);
                    }
                    if (GENEDS_LIST.contains(genEd)) {
                        result.add(new GenEdDto(genEd, course.getCourseId(), course.getSemester().getName(), course.getTransferCreditName()));
                    }
                }
            }
        }
        return result;
    }

    /**
     * Filters out dependant gen eds if the requirements are not met
     * @param course - course to filter out genEds from
     * @param courses - list of courses in which to modify
     * @return - Updated course with filtered genEds
     */
    private static List<List<String>> filterGenEds(UserCourseWithInfoDto course, List<UserCourseWithInfoDto> courses) {
        List<List<String>> updatedGenEds = new ArrayList<>();

        for(List<String> genEdGroup : course.getGenEds()) {
            List<String> processedGroup = new ArrayList<>();
            boolean shouldKeepGroup = true;
            boolean foundDependency = false;

            for(String genEd : genEdGroup) {
                int index = genEd.indexOf('|');
                if(index != -1) { // There IS a dependent genEd
                    String baseGenEd = genEd.substring(0, index); // Get part before |
                    String dependentOnId = genEd.substring(index + 1); // Get part after | (skip the | itself)

                    // Check if the dependent course exists in the current semester
                    boolean dependencyExists = false;
                    for(UserCourseWithInfoDto checkCourse : courses) {
                        if(checkCourse.getCourseId().equals(dependentOnId) &&
                                checkCourse.getSemester().equals(course.getSemester())) {
                            dependencyExists = true;
                            break;
                        }
                    }

                    if(dependencyExists) {
                        // Dependency exists, add the base genEd (without the |part) to be merged
                        processedGroup.add(baseGenEd);
                        foundDependency = true;
                    } else {
                        // Dependency doesn't exist, mark this group for removal
                        shouldKeepGroup = false;
                        break;
                    }
                } else {
                    // No dependency, keep as is
                    processedGroup.add(genEd);
                }
            }

            if(shouldKeepGroup) {
                if(foundDependency && updatedGenEds.size() > 0) {
                    // Merge with the last group (assuming it's the other array you want to merge with)
                    List<String> lastGroup = updatedGenEds.getLast();
                    lastGroup.addAll(processedGroup);
                } else {
                    updatedGenEds.add(processedGroup);
                }
            }
        }
        return updatedGenEds;
    }

}
