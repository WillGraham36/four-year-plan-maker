package com.willgraham.four_year_planner.projection;

import java.util.List;

public interface CourseProjection {
    String getGenEds(); // This will be the JSON string
    String getCourseId();
    String getTerm();
    Integer getYear();
    List<String> getSelectedGenEds();
    String getGenEdOverrides();
    String getTransferCreditName();
}
