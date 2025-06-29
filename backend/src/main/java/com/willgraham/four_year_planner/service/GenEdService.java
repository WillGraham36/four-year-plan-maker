package com.willgraham.four_year_planner.service;

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

import java.util.List;
import java.util.Optional;
import java.util.Optional;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class GenEdService {
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
}
