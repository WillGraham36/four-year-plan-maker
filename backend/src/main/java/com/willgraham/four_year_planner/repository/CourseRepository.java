package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {


}
