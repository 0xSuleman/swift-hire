package com.swifthire.user.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employer {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String companyDetails;

    private String companyLocation;
}
