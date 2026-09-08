package com.willgraham.four_year_planner.model;

import com.willgraham.four_year_planner.utils.ListOfListStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(
        name = "user_courses",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_courses_user_course_semester",
                        columnNames = {"user_id", "course_id", "term", "year"}
                )
        },
        indexes = {
                @Index(name = "idx_user_courses_user_semester", columnList = "user_id, term, year")
        }
)
public class UserCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;  // Only store the userId

    /**
     * A planner placement points at one shared catalog course. Course metadata is
     * therefore stored only in courses; this table stores placement-specific data.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_courses_course"))
    private Course course;

    /**
     * Convenience value used by service/DTO code while a placement is being
     * hydrated. It is not a second database column; the relationship above is
     * authoritative.
     */
    @Transient
    private String unresolvedCourseId;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "term", column = @Column(name = "term", nullable = false)),
            @AttributeOverride(name = "year", column = @Column(name = "year", nullable = false))
    })
    private Semester semester;

    private List<String> selectedGenEds;


    @Column(name = "transfer_credit_name")
    private String transferCreditName;

    @Column(name = "custom_ul_concentration")
    private Boolean customUlConcentration = false;

    @Convert(converter = ListOfListStringConverter.class)
    @Column(columnDefinition = "TEXT") // Ensure enough space for JSON storage
    private List<List<String>> transferGenEdsOverride;

    private Integer index;

    public String getCourseId() {
        return course != null ? course.getCourseId() : unresolvedCourseId;
    }

    public void setCourseId(String courseId) {
        this.unresolvedCourseId = courseId;
    }
}
