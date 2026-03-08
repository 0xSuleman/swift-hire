# Swift Hire

**SE2004 — BSE-4A — Team 1 — Spring 2026**
Supervisor: Dr. Ali Afzal Malik | Team Lead: Saad Mehmood [24L-3050]

A dual-driven HR automation platform. Candidates upload CVs; employers type hiring prompts.
The system auto-matches, ranks, schedules interviews, and sends reminders — no external AI API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2 |
| Auth | Spring Security + JWT (jjwt 0.12) |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL 8 |
| CV Parsing | Apache PDFBox 3 |
| Email | JavaMail / Gmail SMTP |
| Scheduler | Spring `@Scheduled` |
| Frontend | React 18 + Vite |
| Charts | Chart.js + react-chartjs-2 |

---

## Project Structure

```
swift-hire/
├── backend/                          # Spring Boot (Maven)
│   ├── pom.xml
│   └── src/main/java/com/swifthire/
│       ├── auth/                     # JWT, login, signup, password reset
│       ├── user/model/               # User, Candidate, Employer, Role, AccountStatus
│       ├── user/repository/          # UserRepository, CandidateRepository, EmployerRepository
│       ├── candidate/                # CV upload, PDFBox parser, preferences, matching
│       ├── employer/                 # Employer profile CRUD
│       ├── job/                      # HiringPrompt, JobPosting, PromptEngine, ATS scoring
│       ├── scheduling/               # InterviewWindow, InterviewSlot, ScheduleService
│       ├── automation/               # EmailService (SMTP), ReminderScheduler (cron)
│       ├── review/                   # Review model, rate candidate/employer
│       ├── analytics/                # Candidate + Employer analytics APIs
│       ├── admin/                    # Manage users (ban/block), system reports
│       ├── dictionary/               # KnownSkillsDictionary (seed table)
│       ├── config/                   # SecurityConfig, CorsConfig
│       └── common/                   # ApiResponse<T>, GlobalExceptionHandler
└── frontend/                         # React + Vite
    └── src/
        ├── api/                      # axios instance + per-module API files
        ├── context/AuthContext.jsx   # JWT storage, login/logout
        ├── components/common/        # ProtectedRoute, StarRating
        ├── pages/auth/               # Login, Signup, ResetPassword
        ├── pages/candidate/          # Dashboard, Profile, JobPostings, Analytics, RateEmployer
        ├── pages/employer/           # Dashboard, HiringPrompt, RecommendedCandidates,
        │                             # AutoSchedule, RateCandidate, EmployerProfile, Analytics
        └── pages/admin/              # AdminDashboard, ManageUsers, SystemReports
```

---

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8
- Node.js 18+ / npm

### Backend Setup

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE swift_hire;"

# 2. Set environment variables (or edit application.properties)
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=your-super-secret-key-32chars-minimum
export MAIL_USERNAME=your@gmail.com
export MAIL_PASSWORD=your-app-password   # Gmail App Password, NOT your real password

# 3. Run
cd backend
mvn spring-boot:run
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
# API proxied to http://localhost:8080
```

---

## Team Assignments

| Member | Roll # | Module |
|---|---|---|
| Saad Mehmood | 24L-3050 | BE1: Core/Auth + Admin + DB Schema |
| [BE2 member] | — | BE2: Candidate Module (PDFBox, preferences, matching) |
| [BE3 member] | — | BE3: Employer Module (Prompt Engine, ATS, JobPostings) |
| [BE4 member] | — | BE4: Automation (Auto-Schedule, Cron, Email, Reviews) |
| [FE1 member] | — | FE1: Candidate-facing UI |
| [FE2 member] | — | FE2: Employer + Admin UI |

---

## Key NFRs Implemented

| NFR | Implementation |
|---|---|
| Prompt parse ≤3s | Regex + in-memory dictionary lookup |
| CV parse ≤5s | PDFBox + word-boundary matching |
| Page load ≤2s | React SPA, API pagination |
| BCrypt password hashing | `BCryptPasswordEncoder` bean |
| JWT + configurable expiry | `jwt.expiry-ms` in properties |
| Rate limit + lock at 5 failures | `failedLoginAttempts` on User entity |
| PDF-only, ≤10MB upload | Validated in `CvParserService.validatePdf()` |
| Email retry ×3 | `@Retryable(maxAttempts=3)` on `EmailService` |
| No duplicate reminders | `reminderSent7d/3d/1d` flags on `InterviewSlot` |
| SQL injection + XSS prevention | `GlobalExceptionHandler` + Spring input binding |
