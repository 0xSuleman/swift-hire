# CONTEXT.md — Swift Hire Quick Reference
> Load this at the start of every new session to skip codebase re-exploration.
> Updated: 2026-03-13 (session 3)

---

## Project Vitals
- **Name**: Swift Hire — Recruitment Automation Platform
- **Course**: SE2004, Spring 2026, BSE-4A, FAST-NUCES, Supervisor: Dr. Ali Afzal Malik
- **Team Lead**: Saad Mehmood [24L-3050]
- **Team**: FE1, FE2, BE1, BE2, BE3, BE4 (6 members)
- **Stack**: Java 17 + Spring Boot 3.2.4 | React 18 + Vite | MySQL (`swift_hire`)
- **Ports**: Backend → 8080, Frontend → 5173 (proxied via Vite)
- **Package root**: `com.swifthire` — never change
- **Maven**: always run with `JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn`

---

## Team Assignments
| Role | Responsibility |
|------|---------------|
| FE1  | Candidate-facing UI |
| FE2  | Employer + Admin UI |
| BE1  | Core/Auth + Admin APIs + DB Schema |
| BE2  | Candidate Module (PDFBox, preferences, matching) |
| BE3  | Employer Module (PromptEngine, ATS, job postings) |
| BE4  | Automation (auto-schedule, cron, email, reviews, analytics) |

---

## Key Architecture
- **Dual-Driven Marketplace**: Candidate pushes CV → system matches to Jobs; Employer types Prompt → system ranks Candidates
- **Custom NLP**: Pure Regex + KnownSkillsDictionary (NO external AI API)
- **ATS Score**: (matched_tags / required_tags) × 100 + location bonus (+5) + shift bonus (+5), max 100
- **Auto-Scheduling**: employer defines window (date + start/end time) → system slots top-N candidates in 45-min blocks → async email with Jitsi Meet link
- **Cron Reminders**: 7d, 3d, 1d before interview; dedup via `reminderSent*` flags; `@Transactional` on scheduler; CONFIRMED+PENDING slots included
- **Auth**: JWT (JJWT 0.12.5), 24h expiry, roles: ADMIN / EMPLOYER / CANDIDATE

---

## Backend Package Structure
```
com.swifthire/
├── auth/           controller/AuthController, service/AuthService, filter/JwtAuthFilter, util/JwtUtil
│                   dto/ LoginRequest, LoginResponse, SignupRequest
├── config/         SecurityConfig, CorsConfig (includes PATCH in allowedMethods)
├── common/         dto/ApiResponse, exception/GlobalExceptionHandler, ResourceNotFoundException
├── user/           model/ User, Candidate, Employer, Role(enum), AccountStatus(enum)
│                   repository/ UserRepository, CandidateRepository, EmployerRepository
├── job/            model/ JobPosting, HiringPrompt, MatchScore
│                   controller/JobController, service/ JobService, PromptEngineService, AtsScoreService
│                   repository/ JobPostingRepository, MatchScoreRepository
├── scheduling/     model/ InterviewWindow, InterviewSlot(+SlotStatus enum)
│                   controller/ScheduleController, service/ScheduleService
│                   repository/ InterviewWindowRepository, InterviewSlotRepository
├── automation/     service/EmailService (@Async @Retryable)
│                   scheduler/ReminderScheduler (@Transactional cron, logs to NotificationLog)
│                   model/NotificationLog, repository/NotificationLogRepository
├── review/         model/Review, controller/ReviewController, service/ReviewService
│                   repository/ReviewRepository
├── admin/          model/GraphicalReport, controller/AdminController, service/AdminService
│                   repository/GraphicalReportRepository
├── analytics/      controller/AnalyticsController, service/AnalyticsService
├── candidate/      controller/CandidateController, service/CandidateService, CvParserService
├── employer/       controller/EmployerController, service/EmployerService
├── dictionary/     model/KnownSkillsDictionary(+SkillCategory enum), DataSeeder (seeds 74 entries)
│                   repository/KnownSkillsDictionaryRepository
└── SwiftHireApplication.java
```

---

## Entities & Fields

### User (`users` table)
`id, name, email, password(hashed), phoneNo, address, role(ADMIN/EMPLOYER/CANDIDATE),`
`accountStatus(ACTIVE/BANNED/DEACTIVATED), failedLoginAttempts, averageRating, totalRatings,`
`emailVerified, verificationToken, verificationTokenExpiry, createdAt, updatedAt`
implements UserDetails; @Inheritance(JOINED)

### Admin (`admins` table) — extends User
No extra fields. Methods: manageUsers, viewSystemReports (in AdminController/AdminService).

### Candidate (`candidates` table)
`id(FK→users), cvFilePath, parsedSkills(TEXT CSV), preferredLocation, preferredShift, workType, profileViews, atsScore(@Transient)`
@OneToOne @MapsId → User

### Employer (`employers` table)
`id(FK→users), companyName, companyDetails(TEXT), companyLocation`
@OneToOne @MapsId → User

### JobPosting (`job_postings` table)
`id, employer(ManyToOne), hiringPrompt(OneToOne mapped), jobTitle, requiredSkills(TEXT CSV),`
`location, shift, experienceYears, status(OPEN/CLOSED/ARCHIVED), createdAt`
`skillTags(@ManyToMany → KnownSkillsDictionary) via join table job_skill_tags`

### HiringPrompt (`hiring_prompts` table)
`id, employer(ManyToOne), jobPosting(OneToOne), rawText(TEXT), submissionDate`

### MatchScore (`match_scores` table)
`id, candidate(ManyToOne), jobPosting(ManyToOne), matchPercentage(0–100), ranking`
unique constraint: (candidate_id, job_posting_id)

### InterviewWindow (`interview_windows` table)
`id, employer(ManyToOne), date, startTime, endTime`

### InterviewSlot (`interview_slots` table)
`id, window(ManyToOne), candidate(ManyToOne), jobPosting(ManyToOne),`
`startTime, endTime, status(PENDING/CONFIRMED/CANCELLED/COMPLETED), calendlyLink,`
`reminderSent7d, reminderSent3d, reminderSent1d`

### Review (`reviews` table)
`id, rater(ManyToOne→User), ratee(ManyToOne→User), interviewSlot(ManyToOne), ratingValue(1–5), comment(TEXT), createdAt`
unique: (rater_id, interview_slot_id)

### GraphicalReport (`graphical_reports` table)
`id, reportType(users/jobs/ratings/analytics), dateRangeFrom, dateRangeTo, generatedAt, data(TEXT JSON), generatedBy(ManyToOne→User)`

### NotificationLog (`notification_logs` table)
`id, recipientEmail, eventType(REMINDER_7D/REMINDER_3D/REMINDER_1D/INVITATION), interviewSlotId, status(SENT/FAILED), errorMessage(TEXT), sentAt`
— Added session 3 for NFR 3.7.3

### KnownSkillsDictionary (`known_skills_dictionary` table)
`id, skillName(unique), category(SKILL/LOCATION/SHIFT)` — 74 entries seeded

---

## All API Endpoints

### `/api/auth`
| Method | Path | UC | Notes |
|--------|------|----|-------|
| POST | `/signup` | UC-06 | role: CANDIDATE or EMPLOYER only |
| POST | `/login` | UC-01 | returns JWT + userId/name/email/role |
| POST | `/logout` | UC-07 | client-side JWT discard |
| GET  | `/verify-email` | NFR 3.4.4 | `?token=` — marks emailVerified=true; blocks login until verified |
| POST | `/reset-password-request` | NFR 3.8.3 | generates UUID token, emails link (1h expiry) |
| POST | `/reset-password` | NFR 3.8.3 | validates token, hashes new password, resets lock |

### `/api/candidate` (@PreAuthorize CANDIDATE)
| Method | Path | UC |
|--------|------|----|
| GET | `/profile` | UC-08 |
| PUT | `/profile` | UC-08 |
| POST | `/cv` | UC-09 |
| PUT | `/preferences` | UC-10 |
| GET | `/job-postings` | UC-11 |

### `/api/employer` (@PreAuthorize EMPLOYER)
| Method | Path | UC |
|--------|------|----|
| GET | `/profile` | UC-17 |
| PUT | `/profile` | UC-17 |

### `/api/jobs` (@PreAuthorize EMPLOYER)
| Method | Path | UC |
|--------|------|----|
| POST | `/prompt` | UC-02 |
| GET | `/{jobId}/candidates` | UC-03 |
| GET | `/` | list employer's postings |
| PUT | `/{jobId}` | NFR 3.9.1 |
| DELETE | `/{jobId}` | NFR 3.9.1 (soft-delete → ARCHIVED) |

### `/api/schedule`
| Method | Path | UC | Notes |
|--------|------|----|-------|
| POST | `/batch` | UC-04 | EMPLOYER only |
| GET | `/my-interviews` | — | role-aware: returns slots for CANDIDATE or EMPLOYER |
| PATCH | `/slots/{slotId}/status` | — | CANDIDATE: confirm/cancel; EMPLOYER: complete/cancel |

### `/api/reviews`
| Method | Path | UC |
|--------|------|----|
| POST | `/candidate` | UC-05 |
| POST | `/employer` | UC-12 |
| GET | `/user/{userId}` | — |

### `/api/admin` (@PreAuthorize ADMIN)
| Method | Path | UC |
|--------|------|----|
| GET | `/users` | UC-13 |
| GET | `/users/{userId}` | UC-13 |
| PUT | `/users/{userId}/status` | UC-13 — also writes AuditLog (NFR 3.8.5) |
| GET | `/audit-logs` | NFR 3.8.5 |
| GET | `/reports` | UC-14 |
| GET | `/reports/export` | UC-14 | returns CSV file download |
| GET | `/reports/history` | UC-14 |

### `/api/analytics`
| Method | Path | UC |
|--------|------|----|
| GET | `/candidate` | UC-16 |
| GET | `/employer` | UC-16 |

---

## 17 Use Cases — Implementation Status
| UC | Name | Status |
|----|------|--------|
| UC-01 | Login | ✅ Done |
| UC-02 | Process Hiring Prompt | ✅ Done |
| UC-03 | View Recommended Candidates | ✅ Done |
| UC-04 | Auto-Schedule Batch | ✅ Done |
| UC-05 | Rate Candidate | ✅ Done |
| UC-06 | Sign Up | ✅ Done |
| UC-07 | Log Out | ✅ Done |
| UC-08 | Manage Candidate Profile | ✅ Done |
| UC-09 | Upload CV | ✅ Done |
| UC-10 | Set Preferences | ✅ Done |
| UC-11 | View Job Postings (ranked) | ✅ Done |
| UC-12 | Rate Employer | ✅ Done |
| UC-13 | Manage Users | ✅ Done |
| UC-14 | View System Reports + CSV Export | ✅ Done |
| UC-15 | Send Interview Reminders (cron + NotificationLog) | ✅ Done |
| UC-16 | View Hiring Analytics | ✅ Done |
| UC-17 | Manage Employer Profile | ✅ Done |

All 17 UCs fully implemented and verified. ✅

---

## Session 4 Changes (2026-03-16)

### New Features
- **NFR 3.4.4 — Email Verification**: UUID token generated on signup, 24h expiry stored on `User`; `GET /api/auth/verify-email?token=` verifies and unblocks login; frontend shows "Check Your Email" confirmation screen + new `VerifyEmail.jsx` page; `verifyEmail` is idempotent to handle React 18 StrictMode double-call
- **NFR 3.6.6 — Rate Limiting**: `RateLimitInterceptor` + `WebConfig`; sliding 60s window per IP via `ConcurrentHashMap`; login capped at 10 req/min, all other `/api/**` at 100 req/min; returns 429 with `ApiResponse` error; limits configurable in `application.properties`
- **NFR 3.8.4 — Account Lockout fix**: `@Transactional(noRollbackFor=...)` on `login()` — counter was silently rolling back on `BadCredentialsException`
- **NFR 3.8.5 — Audit Logs**: `AuditLog` entity + `GET /api/admin/audit-logs`; every approve/block/deactivate action logged with admin email, target, and timestamp; shown in `ManageUsers.jsx`
- **GlobalExceptionHandler**: Added `IllegalStateException` handler (was falling through to generic 500)
- **SQL grandfathering**: existing users updated to `email_verified=true` after column addition

### Bug Fixes
- React 18 StrictMode fires `useEffect` twice — `verifyEmail` backend now returns early if already verified instead of throwing on the second call

### Docs Updated
- `CONTEXT.md`, `README.md`, `CLAUDE.md`: updated for session 4 changes
- `CLAUDE.md` Mistake Log: added StrictMode double-useEffect pattern

---

## Session 3 Changes (2026-03-13)

### Fixes
- **CORS**: Added `PATCH` to allowed methods in `CorsConfig.java` (was blocking slot status updates)
- **Slot Status Flow**: Added `PATCH /api/schedule/slots/{slotId}/status` endpoint; enforces role-based transitions (CANDIDATE: confirm/cancel; EMPLOYER: complete/cancel)
- **Rating Gate**: `ReviewService` now checks slot is `COMPLETED` before allowing rating
- **Password Reset**: `AuthService.resetPassword()` now resets `failedLoginAttempts` + sets `ACTIVE` status
- **Reset Page**: `ResetPassword.jsx` detects `?token=` param and shows set-new-password form

### New Features
- **Analytics Charts**: 5+ Chart.js charts on both `EmployerAnalytics.jsx` and `CandidateAnalytics.jsx` (Bar, Doughnut, Pie, Horizontal Bar, Radar); ratings distribution (1★–5★) on both
- **MyInterviews**: Role-aware page with action buttons (Confirm/Cancel/Mark Complete/Rate)
- **UC-14 Export**: `GET /api/admin/reports/export` returns CSV download; Export CSV button wired in `SystemReports.jsx`
- **UC-15 NotificationLog**: `NotificationLog` entity + `NotificationLogRepository`; `ReminderScheduler` logs SENT/FAILED per email with `@Transactional`; `findSlotsBetween` fixed to include `CONFIRMED` slots

### Docs Updated
- `CONTEXT.md`: fully rewritten with all 17 UCs, session 3 changes, NotificationLog entity, new endpoints, gotchas
- `README.md`: added UC table (all 17), expanded NFR table, updated project structure (MyInterviews, NotificationLog, CSV export), added Dev Notes / Gotchas section

---

## Remaining TODOs
**Nothing remaining.** All 17 UCs + all NFRs implemented and merged to `main`.

### Known NFR gaps
**None.** All NFRs fully implemented as of 2026-03-16.

---

## Email / SMTP
- Gmail credentials in `application.properties` for local dev: `hmehmood180@gmail.com`
- App password: `nucb ztif hfha kjxo`
- **Do NOT commit `application.properties` with credentials to GitHub**
- `@EnableAsync` on `SwiftHireApplication` — all email methods are truly async

---

## Key Service Logic

### PromptEngineService
- Input: raw text prompt (e.g., "Need Java dev 3 yrs lahore night shift")
- Output: `ParsedPrompt` record — skills Set, locations Set, shifts Set, experienceYears Integer
- Uses `Pattern.compile(..., CASE_INSENSITIVE).matcher(text).find()` for word-boundary matching
- Throws if nothing recognized

### CvParserService
- `Loader.loadPDF(byte[])` — PDFBox 3.0.2 API (NOT `PDDocument.load()`)
- Uses `Pattern.find()` NOT `String.matches()` (multi-line text fix)
- Returns comma-separated skill names

### AtsScoreService
- Scores ALL candidates against a JobPosting; filters zero-scores
- (matched/required) × 100 + loc bonus + shift bonus; cap 100
- Clears old MatchScores for the job before saving new ones

### ScheduleService
- Divides window into 45-min slots, assigns top-N candidates
- Generates Jitsi Meet links: `https://meet.jit.si/swift-hire-<12-char-uid>` (no API key needed)
- Emails BOTH candidate AND employer via EmailService on slot creation
- NOTE: DB column still named `calendlyLink` — just a string, no schema change needed

### ReminderScheduler
- `@Transactional` — keeps JPA session open to avoid LazyInitializationException
- `findSlotsBetween` queries PENDING + CONFIRMED slots within ±5 min of threshold
- Sets `reminderSentXd = true` after sending to prevent duplicates
- Logs every send attempt to `notification_logs` table (SENT or FAILED with error message)

---

## Frontend Pages
```
pages/auth/        Login, Signup, ResetPassword (handles both request + token flows via ?token= param)
pages/shared/      MyInterviews (role-aware: used by both /candidate/interviews and /employer/interviews)
pages/candidate/   CandidateDashboard, Profile, JobPostings, CandidateAnalytics, RateEmployer
pages/employer/    EmployerDashboard, EmployerProfile, HiringPrompt, RecommendedCandidates,
                   AutoSchedule, EmployerAnalytics, RateCandidate
pages/admin/       AdminDashboard, ManageUsers, SystemReports (with Export CSV)
```
JWT stored in localStorage as `sh_token`. Axios instance in `api/axios.js` adds Bearer header.

---

## Git Rules
- Never include "Co-Authored-By: Claude" or any AI authorship line in commit messages
- Always push to a new feature branch — never directly to main
- User verifies and merges to main themselves

## Critical Gotchas (from CLAUDE.md Mistake Log)
- Maven: always `JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn <cmd>`
- PDFBox 3.x: `Loader.loadPDF(byte[])` NOT `PDDocument.load(InputStream)`
- CV parsing: use `Pattern.find()` NOT `String.matches()` (multi-line PDF text)
- Lombok: requires `annotationProcessorPaths` in maven-compiler-plugin
- `Map.of()` with mixed types → use `LinkedHashMap` with explicit `put()`
- JPA entities: always persist parent before referencing in child
- Stale JWT after backend restart → log out and back in
- `spring-retry` dependency must be declared in pom.xml for `@Retryable`
- `@Scheduled` methods accessing lazy JPA relations → always add `@Transactional`
- `findSlotsBetween` uses UTC-based LocalDateTime — raw SQL inserts must use `UTC_TIMESTAMP()` not `NOW()` for test data

---

## File Paths Quick Reference
| What | Where |
|------|-------|
| Backend source | `backend/src/main/java/com/swifthire/` |
| App properties | `backend/src/main/resources/application.properties` |
| POM | `backend/pom.xml` |
| Frontend pages | `frontend/src/pages/` |
| Frontend API clients | `frontend/src/api/` |
| Auth context | `frontend/src/context/AuthContext.jsx` |
| D1 context files | `/Users/macbookpro/Desktop/SH-Deliverable-1/` |
| Project rules | `CLAUDE.md` |
| This file | `CONTEXT.md` |
