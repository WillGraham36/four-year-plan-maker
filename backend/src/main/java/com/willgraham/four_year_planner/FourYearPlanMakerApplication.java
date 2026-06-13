package com.willgraham.four_year_planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class FourYearPlanMakerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FourYearPlanMakerApplication.class, args);
	}

}
