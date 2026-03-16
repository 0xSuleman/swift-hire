package com.swifthire.user.repository;

import com.swifthire.user.model.AccountStatus;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    List<User> findByRole(Role role);
    List<User> findByAccountStatus(AccountStatus status);

    @Query("SELECT u FROM User u WHERE u.averageRating <= :maxRating AND u.role = :role")
    List<User> findByMaxRatingAndRole(double maxRating, Role role);
}
