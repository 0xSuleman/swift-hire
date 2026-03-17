-- Swift Hire — Admin Seed
-- Run this ONCE after setting up the database to create the admin account.
-- Login: admin@swifthire.com / Admin@1234

INSERT INTO users (name, email, password, phone_no, role, account_status, email_verified, failed_login_attempts, average_rating, total_ratings, created_at, updated_at)
VALUES ('Admin', 'admin@swifthire.com', '$2b$10$agXmzL2r42ZA.xR5uyph..B2XlcgNGbA3u8p/CG9sz9c7QgA3SNee', NULL, 'ADMIN', 'ACTIVE', 1, 0, 0.0, 0, NOW(), NOW());

INSERT INTO admins (id) VALUES (LAST_INSERT_ID());
