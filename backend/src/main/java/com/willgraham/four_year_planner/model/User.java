package com.willgraham.four_year_planner.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    private String id;

    @Column(name = "ul_concentration")
    private String ULConcentration = "";

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "start_term")),
            @AttributeOverride(name = "year", column = @Column(name = "start_year"))
    })
    private Semester startSemester;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "end_term")),
            @AttributeOverride(name = "year", column = @Column(name = "end_year"))
    })
    @Column(name = "end_semester")
    private Semester endSemester;
    private String major;
    private String minor;


    @ElementCollection
    @CollectionTable(
            name = "user_off_semesters",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "term")),
            @AttributeOverride(name = "year", column = @Column(name = "year"))
    })
    private List<Semester> offSemesters = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "user_completed_semesters",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "term")),
            @AttributeOverride(name = "year", column = @Column(name = "year")),
    })
    private List<Semester> completedSemesters = new ArrayList<>();

    @Column(name = "note", columnDefinition = "TEXT")
    private String note = "";
    private CsTrack track;

    @Column(name = "is_guest", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean guest = false;

    @Column(name = "guest_created_at")
    private Instant guestCreatedAt;

    @Column(name = "guest_last_seen_at")
    private Instant guestLastSeenAt;

    @Column(name = "guest_expires_at")
    private Instant guestExpiresAt;

    @Column(name = "migrated_to_user_id")
    private String migratedToUserId;

    public User(String id, Semester startSemester, Semester endSemester, String major, String minor, CsTrack track) {
        this.id = id;
        this.startSemester = startSemester;
        this.endSemester = endSemester;
        this.major = major;
        this.minor = minor;
        this.track = track;
    }
}
