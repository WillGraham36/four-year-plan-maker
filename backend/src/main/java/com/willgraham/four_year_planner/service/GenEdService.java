package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.GenEdCourseInfoDto;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.projection.GenEdProjection;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class GenEdService {
    private static final Logger logger = LoggerFactory.getLogger(GenEdService.class);

    @Autowired
    private UserCourseRepository userCourseRepository;

    public List<GenEdCourseInfoDto> getUserCourseGenEds(String userId) {
        logger.info("GenEdService.getUserCourseGenEds called with userId: {}", userId);

        try {
            logger.info("About to call repository.findGenEdsByUserIdNative...");
            List<GenEdProjection> projections = userCourseRepository.findGenEdsByUserIdNative(userId);
            logger.info("Repository call completed. Result size: {}", projections.size());

            List<GenEdCourseInfoDto> result = projections.stream()
                    .map(this::convertProjectionToDto)
                    .collect(Collectors.toList());

            logger.info("Conversion completed. Final result size: {}", result.size());
            return result;
        } catch (Exception e) {
            logger.error("Exception in getUserCourseGenEds for userId {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    private GenEdCourseInfoDto convertProjectionToDto(GenEdProjection projection) {
        // Convert JSON string back to List<List<String>>
        ListOfListStringConverter listConverter = new ListOfListStringConverter();
        List<List<String>> genEds = listConverter.convertToEntityAttribute(projection.getGenEds());

        // Create Semester object
        Semester semester = new Semester();
        semester.setTerm(Term.valueOf(projection.getTerm()));
        semester.setYear(projection.getYear());

        return new GenEdCourseInfoDto(genEds, projection.getCourseId(), semester);
    }
}
