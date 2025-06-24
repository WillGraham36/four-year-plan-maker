package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.OnboardingFormRequestDto;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.ULConcentrationAreas;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@AllArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("User not found with ID: " + id));
    }

    public void updateULConcentrationById(String userId, String concentration) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found with ID: " + userId));

        user.setULConcentration(concentration);
        userRepository.save(user);
    }

    public User buildUserFromDto(OnboardingFormRequestDto dto, String userId) {
        Semester startSemester = new Semester(dto.getStartTerm(), dto.getStartYear());
        Semester endSemester = new Semester(dto.getEndTerm(), dto.getEndYear());

        return new User(
                userId,
                startSemester,
                endSemester,
                dto.getMajor(),
                dto.getMinor()
        );
    }


    public User createOrUpdateUser(User newUser) {
        return userRepository.findById(newUser.getId())
                .map(existingUser -> {
                    // Update fields you want to allow updating
                    existingUser.setULConcentration(newUser.getULConcentration());
                    existingUser.setStartSemester(newUser.getStartSemester());
                    existingUser.setEndSemester(newUser.getEndSemester());
                    existingUser.setMajor(newUser.getMajor());
                    existingUser.setMinor(newUser.getMinor());
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> userRepository.save(newUser));
    }

    public Optional<OnboardingFormRequestDto> getOnboardingFormUserValues(String userId) {
        Optional<User> user = userRepository.findById(userId);

        // Check if user exists
        if(user.isEmpty()) {
            return Optional.empty();
        }

        OnboardingFormRequestDto dto = new OnboardingFormRequestDto(
                user.get().getStartSemester().getTerm(),
                user.get().getStartSemester().getYear(),
                user.get().getEndSemester().getTerm(),
                user.get().getEndSemester().getYear(),
                user.get().getMajor(),
                user.get().getMinor()
        );
        return Optional.of(dto);
    }

}
