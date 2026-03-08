package com.swifthire.admin.service;

import com.swifthire.common.exception.ResourceNotFoundException;
import com.swifthire.user.model.AccountStatus;
import com.swifthire.user.model.Role;
import com.swifthire.user.model.User;
import com.swifthire.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    public List<Map<String, Object>> getUsers(String role, Double maxRating, String status) {
        List<User> users;

        if (maxRating != null && role != null) {
            users = userRepository.findByMaxRatingAndRole(maxRating, Role.valueOf(role.toUpperCase()));
        } else if (role != null) {
            users = userRepository.findByRole(Role.valueOf(role.toUpperCase()));
        } else if (status != null) {
            users = userRepository.findByAccountStatus(AccountStatus.valueOf(status.toUpperCase()));
        } else {
            users = userRepository.findAll();
        }

        if (users.isEmpty()) {
            throw new IllegalArgumentException("No users found matching the criteria.");
        }

        return users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            u.getId());
            m.put("name",          u.getName());
            m.put("email",         u.getEmail());
            m.put("role",          u.getRole().name());
            m.put("status",        u.getAccountStatus().name());
            m.put("averageRating", u.getAverageRating());
            return m;
        }).toList();
    }

    public Map<String, Object> getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            user.getId());
        m.put("name",          user.getName());
        m.put("email",         user.getEmail());
        m.put("role",          user.getRole().name());
        m.put("status",        user.getAccountStatus().name());
        m.put("averageRating", user.getAverageRating());
        m.put("totalRatings",  user.getTotalRatings());
        m.put("createdAt",     user.getCreatedAt().toString());
        return m;
    }

    @Transactional
    public void updateUserStatus(Long userId, String action) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        AccountStatus newStatus = switch (action.toLowerCase()) {
            case "approve" -> AccountStatus.ACTIVE;
            case "block"   -> AccountStatus.BANNED;
            case "delete"  -> AccountStatus.DEACTIVATED;
            default -> throw new IllegalArgumentException("Invalid action. Use: approve, block, delete.");
        };

        if (user.getAccountStatus() == newStatus) {
            throw new IllegalArgumentException("Action already active.");
        }

        user.setAccountStatus(newStatus);
        userRepository.save(user);
    }

    public Map<String, Object> generateReport(String category, String from, String to, String userType) {
        // TODO: implement per category (users, jobs, ratings, analytics)
        // Each category returns aggregated stats for the given date range
        return Map.of("category", category, "status", "TODO: implement report generation");
    }
}
