package com.swifthire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SwiftHireApplication {
    public static void main(String[] args) {
        SpringApplication.run(SwiftHireApplication.class, args);
    }
}
