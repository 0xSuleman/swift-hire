package com.swifthire.user.model;

import jakarta.persistence.*;
import lombok.*;

// ACD: Admin extends User (inheritance triangle)
// Table: admins — contains only the FK to users (no additional fields)
// Methods manageUsers() and viewSystemReports() are in AdminController/AdminService
@Entity
@Table(name = "admins")
@PrimaryKeyJoinColumn(name = "id")
@Getter @Setter @NoArgsConstructor
public class Admin extends User {
}
