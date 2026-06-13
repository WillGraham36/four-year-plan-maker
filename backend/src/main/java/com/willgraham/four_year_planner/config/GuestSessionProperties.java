package com.willgraham.four_year_planner.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.guest")
public class GuestSessionProperties {
    private String cookieName = "terpplanner_guest";
    private String cookieDomain = "";
    private boolean cookieSecure = true;
    private String cookieSameSite = "Lax";
    private int sessionDays = 30;
    private int cleanupInactiveDays = 45;
}
