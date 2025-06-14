package com.willgraham.four_year_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    private String email;
    private LocalDate createdAt;
    @Column(name = "ul_concentration")
    private String ULConcentration;

}
