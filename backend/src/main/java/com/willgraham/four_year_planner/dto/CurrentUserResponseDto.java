package com.willgraham.four_year_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserResponseDto {
    private boolean authenticated;
    private boolean guest;
    private String userId;
    private boolean onboarded;
    private Instant guestExpiresAt;

    public static CurrentUserResponseDto anonymous() {
        return new CurrentUserResponseDto(false, false, null, false, null);
    }
}
