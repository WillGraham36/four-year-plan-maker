package com.willgraham.four_year_planner.service;

import com.willgraham.four_year_planner.dto.CreateOffTermRequestDto;
import com.willgraham.four_year_planner.dto.GetUserInfoResponseDto;
import com.willgraham.four_year_planner.dto.OnboardingFormRequestDto;
import com.willgraham.four_year_planner.exception.InvalidInputException;
import com.willgraham.four_year_planner.exception.NotFoundException;
import com.willgraham.four_year_planner.exception.UserNotFoundException;
import com.willgraham.four_year_planner.model.CsTrack;
import com.willgraham.four_year_planner.model.Semester;
import com.willgraham.four_year_planner.model.Term;
import com.willgraham.four_year_planner.model.User;
import com.willgraham.four_year_planner.repository.UserCourseRepository;
import com.willgraham.four_year_planner.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@AllArgsConstructor
@Service
public class UserService {

    private static final int MAX_NOTE_LENGTH = 50000;

    private final UserRepository userRepository;
    private final UserCourseRepository userCourseRepository;

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

        if(dto.getMajor().equals("Computer Science") && dto.getTrack() == null) {
            throw new InvalidInputException("CS students must select a track");
        }

        return new User(
                userId,
                startSemester,
                endSemester,
                dto.getMajor(),
                dto.getMinor(),
                dto.getTrack()
        );
    }


    public void createOrUpdateUser(User newUser) {
        userRepository.findById(newUser.getId())
                .map(existingUser -> {
                    // Update fields you want to allow updating
                    existingUser.setStartSemester(newUser.getStartSemester());
                    existingUser.setEndSemester(newUser.getEndSemester());
                    existingUser.setMajor(newUser.getMajor());
                    existingUser.setMinor(newUser.getMinor());
                    existingUser.setTrack(newUser.getTrack());
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

        User existingUser = user.get();
        if (existingUser.getStartSemester() == null
                || existingUser.getEndSemester() == null
                || existingUser.getMajor() == null
                || existingUser.getMajor().isBlank()) {
            return Optional.empty();
        }

        OnboardingFormRequestDto dto = new OnboardingFormRequestDto(
                existingUser.getStartSemester().getTerm(),
                existingUser.getStartSemester().getYear(),
                existingUser.getEndSemester().getTerm(),
                existingUser.getEndSemester().getYear(),
                existingUser.getMajor(),
                existingUser.getMinor(),
                existingUser.getTrack()
        );
        return Optional.of(dto);
    }

    public GetUserInfoResponseDto getUserInfo(String userId) {
        Optional<User> user = userRepository.findById(userId);

        return user.map(this::getUserInfo).orElseGet(GetUserInfoResponseDto::new);

    }

    public GetUserInfoResponseDto getUserInfo(User user) {
        return new GetUserInfoResponseDto(
                user.getStartSemester(),
                user.getEndSemester(),
                user.getOffSemesters(),
                user.getCompletedSemesters(),
                user.getNote(),
                user.getTrack(),
                user.getMajor(),
                user.isGuest()
        );
    }

    public void createOffTerm(String userId, CreateOffTermRequestDto semester) {
        if(semester.getTerm() != Term.SUMMER && semester.getTerm() != Term.WINTER) {
            throw new InvalidInputException("Only SUMMER or WINTER terms allowed");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        Semester offSemester = new Semester(semester.getTerm(), semester.getYear());

        // Check if this off semester already exists for the user
        boolean alreadyExists = user.getOffSemesters().stream()
                .anyMatch(existingSemester -> existingSemester.getTerm() == offSemester.getTerm()
                        && Objects.equals(existingSemester.getYear(), offSemester.getYear()));

        if (alreadyExists) {
            throw new InvalidInputException("Off semester already exists for "
                    + semester.getTerm() + " " + semester.getYear());
        }

        // Add the off semester to the user's list
        user.getOffSemesters().add(offSemester);

        // Save the updated user
        userRepository.save(user);
    }

    public void deleteOffTerm(String userId, Term term, int year) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        Semester offSemester = new Semester(term, year);

        boolean alreadyExists = user.getOffSemesters().stream()
                .anyMatch(existingSemester -> existingSemester.getTerm() == offSemester.getTerm()
                        && Objects.equals(existingSemester.getYear(), offSemester.getYear()));

        if (!alreadyExists) {
            throw new InvalidInputException("No off semester exists for "
                    + term + " " + year);
        }

        // Remove the off semester from the user's list
        user.getOffSemesters().remove(offSemester);

        // Remove the term from completed semesters if it exists
        user.getCompletedSemesters().removeIf(cs ->
                cs.getTerm().equals(term) && cs.getYear().equals(year));

        // Remove all the courses from the user
        userCourseRepository.deleteByUserIdAndSemester_TermAndSemester_Year(userId, term, year);

        // Save the updated user
        userRepository.save(user);
    }

    public List<Semester> getCompletedSemesters(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        return new ArrayList<>(user.getCompletedSemesters());
    }

    @Transactional
    public void updateSemesterCompletion(String userId, Term term, int year, boolean isComplete) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        // Remove existing entry (if any)
        user.getCompletedSemesters().removeIf(cs ->
                cs.getTerm().equals(term) && cs.getYear().equals(year));

        // Add new entry only if completing
        if (isComplete) {
            Semester completedSemester = new Semester(term, year);
            user.getCompletedSemesters().add(completedSemester);
        }

        userRepository.save(user);
    }

    @Transactional
    public void updateUserNote(String userId, String note) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if(note.length() > MAX_NOTE_LENGTH) throw new InvalidInputException("Note cannot be longer than " + MAX_NOTE_LENGTH + " characters");
        note = note.trim();


        user.setNote(note);

        userRepository.save(user);
    }

    @Transactional
    public void updateUserTrack(String userId, CsTrack track) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        if(!user.getMajor().equals("Computer Science")) {
            throw new InvalidInputException("User must be a Computer Science major to update their track");
        }
        user.setTrack(track);
        userRepository.save(user);
    }
}
