package com.willgraham.four_year_planner.controller;

import com.willgraham.four_year_planner.dto.ApiResponse;
import com.willgraham.four_year_planner.dto.GenEdDto;
import com.willgraham.four_year_planner.dto.UserCourseWithInfoDto;
import com.willgraham.four_year_planner.exception.JwtAuthenticationException;
import com.willgraham.four_year_planner.model.GenEd;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.service.GenEdService;
import com.willgraham.four_year_planner.service.UserCourseService;
import com.willgraham.four_year_planner.utils.AuthUtils;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/geneds")
public class GenEdsController {

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

    private final UserCourseService userCourseService;
    private final GenEdService genEdService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GenEdDto>>> getAllGenEdsForUser(Authentication authentication) {
        String userId = AuthUtils.getCurrentUserId(authentication);
        List<GenEdDto> result = getAllGenEds(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    public List<GenEdDto> getAllGenEds(String userId) {
        // Get gen eds from database
        List<UserCourseWithInfoDto> courses = genEdService.getUserCoursesWithInfo(userId);

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