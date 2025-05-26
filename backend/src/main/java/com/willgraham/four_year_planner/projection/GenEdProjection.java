package com.willgraham.four_year_planner.projection;

public interface GenEdProjection {
    String getGenEds(); // This will be the JSON string
    String getCourseId();
    String getTerm();
    Integer getYear();
}
