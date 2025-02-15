package com.willgraham.four_year_planner.repository;

import com.willgraham.four_year_planner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
}
