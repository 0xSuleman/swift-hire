package com.swifthire.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swifthire.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * NFR 3.6.6 — Rate limiting to prevent brute-force attacks.
 * Tracks request timestamps per IP in a sliding 60-second window.
 * Login endpoint gets a stricter limit; all other /api/** get a general limit.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Value("${app.rate-limit.general:100}")
    private int generalLimit;

    @Value("${app.rate-limit.login:10}")
    private int loginLimit;

    private static final long WINDOW_MS = 60_000L;

    // IP → timestamps of requests within the current window
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        String ip = getClientIp(request);
        String path = request.getRequestURI();
        int limit = path.equals("/api/auth/login") ? loginLimit : generalLimit;

        long now = System.currentTimeMillis();

        requestLog.compute(ip, (key, timestamps) -> {
            if (timestamps == null) timestamps = new ArrayDeque<>();
            // Evict timestamps outside the sliding window
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            timestamps.addLast(now);
            return timestamps;
        });

        int count = requestLog.get(ip).size();
        if (count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            String body = objectMapper.writeValueAsString(
                    ApiResponse.error("Too many requests. Please slow down and try again later."));
            response.getWriter().write(body);
            return false;
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
