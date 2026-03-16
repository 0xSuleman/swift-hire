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
│       ├── automation/               # EmailService (SMTP), ReminderScheduler (cron),
│       │                             # NotificationLog entity + repo (NFR 3.7.3)
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
        ├── pages/auth/               # Login, Signup, ResetPassword, VerifyEmail
        ├── pages/shared/             # MyInterviews (role-aware: candidate + employer)
        ├── pages/candidate/          # Dashboard, Profile, JobPostings, Analytics, RateEmployer
        ├── pages/employer/           # Dashboard, HiringPrompt, RecommendedCandidates,
        │                             # AutoSchedule, RateCandidate, EmployerProfile, Analytics
        └── pages/admin/              # AdminDashboard, ManageUsers, SystemReports (+ CSV export)
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

## Running the App

> **macOS Note:** Maven defaults to the Homebrew JDK. Always prefix with `JAVA_HOME` to force Java 17.

### 1. Start MySQL
```bash
brew services start mysql
mysql -u root -e "CREATE DATABASE IF NOT EXISTS swift_hire;"
```

### 2. Start Backend
```bash
cd ~/Desktop/swift-hire/backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn spring-boot:run
# API live at http://localhost:8080
```

### 3. Start Frontend
```bash
cd ~/Desktop/swift-hire/frontend
npm install        # first time only
npm run dev
# UI live at http://localhost:5173
```

### Quick Test (confirm backend is up)
```bash
curl -s http://localhost:8080/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Expected: {"success":false,"message":"Invalid email or password."}
```

---

## Use Cases (All 17 Implemented ✅)

| UC | Name |
|---|---|
| UC-01 | Login (JWT, lockout after 5 failures, role-based redirect) |
| UC-02 | Process Hiring Prompt (Regex NLP, ATS scoring, job posting saved) |
| UC-03 | View Recommended Candidates (ranked by ATS score, profile view) |
| UC-04 | Auto-Schedule Batch (45-min slots, Jitsi Meet links, emails both parties) |
| UC-05 | Rate Candidate (1–5 stars, gated behind COMPLETED slot) |
| UC-06 | Sign Up (password strength via `@Pattern`, role: CANDIDATE or EMPLOYER) |
| UC-07 | Log Out (JWT cleared client-side, redirect) |
| UC-08 | Manage Candidate Profile |
| UC-09 | Upload CV (PDFBox PDF parsing, skills extracted to DB) |
| UC-10 | Set Preferences (location, shift, job type) |
| UC-11 | View Job Postings (ranked feed for candidate, `GET /candidate/job-postings`) |
| UC-12 | Rate Employer (1–5 stars, gated behind COMPLETED slot) |
| UC-13 | Manage Users (admin: view, filter, ban/block/activate) |
| UC-14 | View System Reports + CSV Export (`GET /api/admin/reports/export`) |
| UC-15 | Send Interview Reminders (cron 7d/3d/1d, logged to `notification_logs` table) |
| UC-16 | View Hiring Analytics (5+ Chart.js charts, employer + candidate dashboards) |
| UC-17 | Manage Employer Profile (company name, location, description) |

---

## Key NFRs Implemented

| NFR | Implementation |
|---|---|
| Prompt parse ≤3s | Regex + in-memory dictionary lookup |
| CV parse ≤5s | PDFBox + word-boundary matching |
| Page load ≤2s | React SPA, API pagination |
| BCrypt password hashing | `BCryptPasswordEncoder` bean |
| JWT + configurable expiry | `jwt.expiry-ms` in properties |
| Email verification on signup (NFR 3.4.4) | UUID token, 24h expiry, blocks login until verified |
| Rate limiting (NFR 3.6.6) | Per-IP sliding window: 10 req/min on login, 100 req/min elsewhere → 429 |
| Audit logs for admin actions (NFR 3.8.5) | Every approve/block/deactivate logged to `audit_logs` table |
| Strong password (NFR 3.8.2) | `@Pattern` regex on `SignupRequest` |
| Rate limit + lock at 5 failures | `failedLoginAttempts` on User entity |
| PDF-only, ≤10MB upload | Validated in `CvParserService.validatePdf()` |
| Email retry ×3 | `@Retryable(maxAttempts=3)` on `EmailService` |
| No duplicate reminders | `reminderSent7d/3d/1d` flags on `InterviewSlot` |
| Notification DB log (NFR 3.7.3) | `NotificationLog` entity — logs SENT/FAILED per reminder |
| Slot status flow | PENDING → CONFIRMED → COMPLETED; role-gated PATCH endpoint |
| Archive deleted jobs (NFR 3.9.5) | Soft-delete → `ARCHIVED` status |
| SQL injection + XSS prevention | `GlobalExceptionHandler` + Spring input binding |

---

## Dev Notes / Gotchas

- **Maven on macOS**: always `JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn <cmd>` — Homebrew defaults to latest JDK
- **PDFBox 3.x API**: use `Loader.loadPDF(byte[])` — `PDDocument.load(InputStream)` was removed
- **CV parsing regex**: use `Pattern.find()` not `String.matches()` — multi-line PDF text requires substring search
- **`@Scheduled` + JPA lazy relations**: always add `@Transactional` to the scheduled method to keep the JPA session open
- **Test data timestamps**: raw SQL must use `UTC_TIMESTAMP()` not `NOW()` — Hibernate sends `LocalDateTime` as UTC via JDBC driver (`serverTimezone=UTC`)
- **Stale JWT**: after a backend restart, log out and back in — old tokens cause 403s without a `message` field
- **`Map.of()` with mixed types**: use `LinkedHashMap` with explicit `put()` — `Map.of()` infers a complex intersection type incompatible with `Map<String, Object>`
- **Jitsi Meet links**: `https://meet.jit.si/swift-hire-<12-char-uid>` — no API key needed; DB column still named `calendlyLink`
