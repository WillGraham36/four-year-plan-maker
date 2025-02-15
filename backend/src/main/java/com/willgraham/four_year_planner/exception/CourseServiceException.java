package com.willgraham.four_year_planner.exception;

public class CourseServiceException extends RuntimeException {
    public CourseServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
