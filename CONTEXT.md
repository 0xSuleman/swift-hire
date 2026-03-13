# CONTEXT.md — Swift Hire Quick Reference
> Load this at the start of every new session to skip codebase re-exploration.
> Updated: 2026-03-13

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
- **Auto-Scheduling**: employer defines window (date + start/end time) → system slots top-N candidates in 45-min blocks → async email with Calendly link
- **Cron Reminders**: 7d, 3d, 1d before interview; dedup via `reminderSent*` flags on InterviewSlot
- **Auth**: JWT (JJWT 0.12.5), 24h expiry, roles: ADMIN / EMPLOYER / CANDIDATE

---

## Backend Package Structure
```
com.swifthire/
├── auth/           controller/AuthController, service/AuthService, filter/JwtAuthFilter, util/JwtUtil
│                   dto/ LoginRequest, LoginResponse, SignupRequest
├── config/         SecurityConfig, CorsConfig
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
│                   scheduler/ReminderScheduler (cron)
├── review/         model/Review, controller/ReviewController, service/ReviewService
│                   repository/ReviewRepository
├── admin/          model/GraphicalReport, controller/AdminController, service/AdminService
│                   repository/GraphicalReportRepository
├── analytics/      controller/AnalyticsController, service/AnalyticsService
├── dictionary/     model/KnownSkillsDictionary(+SkillCategory enum), DataSeeder (seeds 74 entries)
│                   repository/KnownSkillsDictionaryRepository
└── SwiftHireApplication.java
```

---

## Entities & Fields

### User (`users` table)
`id, name, email, password(hashed), phoneNo, address, role(ADMIN/EMPLOYER/CANDIDATE),`
`accountStatus(ACTIVE/BANNED/DEACTIVATED), failedLoginAttempts, averageRating, totalRatings, createdAt, updatedAt`
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
| POST | `/reset-password-request` | NFR 3.8.3 | **TODO** |
| POST | `/reset-password` | NFR 3.8.3 | **TODO** |

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
| DELETE | `/{jobId}` | NFR 3.9.1 |

### `/api/schedule`
| Method | Path | UC | Notes |
|--------|------|----|-------|
| POST | `/batch` | UC-04 | EMPLOYER only |
| GET | `/my-interviews` | — | **TODO** — needs to return slots for logged-in user |

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
| PUT | `/users/{userId}/status` | UC-13 |
| GET | `/reports` | UC-14 |
| GET | `/reports/history` | UC-14 |

### `/api/analytics`
| Method | Path | UC | Notes |
|--------|------|----|-------|
| GET | `/candidate` | UC-16 | returns profileViews, interviewCount, avgRating, skillsCount |
| GET | `/employer` | UC-16 | **TODO** — only returns avgRating/totalRatings; missing time-to-hire, acceptance rate |

---

## 16 Use Cases — Implementation Status
| UC | Name | Status |
|----|------|--------|
| UC-01 | Login | ✅ Done |
| UC-02 | Process Hiring Prompt | ✅ Done |
| UC-03 | View Recommended Candidates | ✅ Done |
| UC-04 | Auto-Schedule Batch | ✅ Done |
| UC-05 | Rate Candidate | ✅ Done |
| UC-06 | Sign Up | ✅ Done |
| UC-07 | Log Out | ✅ Done |
| UC-08 | Manage Profile | ✅ Done |
| UC-09 | Upload CV | ✅ Done |
| UC-10 | Set Preferences | ✅ Done |
| UC-11 | View Job Postings (ranked) | ✅ Done |
| UC-12 | Rate Employer | ✅ Done |
| UC-13 | Manage Users | ✅ Done |
| UC-14 | View System Reports | ⚠️ FE done, BE TODO |
| UC-15 | Send Interview Reminders (cron) | ✅ Done |
| UC-16 | View Hiring Analytics | ⚠️ Candidate done, Employer partial |

---

## Remaining Backend TODOs
1. **`ScheduleController.getMyInterviews()`** — return slots for logged-in candidate/employer (CRITICAL)
2. **`AuthService.requestPasswordReset()` + `resetPassword()`** — fully empty (HIGH)
3. **`AdminService.generateReport()`** — returns placeholder string (HIGH — fixed by GraphicalReport implementation)
4. **`AnalyticsService.getEmployerAnalytics()`** — missing time-to-hire, acceptance rate (MEDIUM)

---

## ACD Consistency (Deliverable-1)
All 4 gaps have been closed in implementation:
1. ✅ `Candidate.atsScore` — added as `@Transient` (derived from MatchScore, contextual per-job)
2. ✅ `JobPosting Uses KnownSkillsDictionary` — `@ManyToMany skillTags` added, join table `job_skill_tags`
3. ✅ `GraphicalReport` class — entity + repo added, `AdminService.generateReport()` implemented
4. ✅ `Admin extends User` — JOINED JPA inheritance, `admins` table, Admin entity added

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
- Divides window into 45-min slots, assigns top-N candidates, generates Calendly links
- Triggers EmailService (async, retryable, 3 attempts, 2s backoff)

### ReminderScheduler
- Cron queries slots where `reminderSentXd=false` AND date approaching
- Sets flag after sending to prevent duplicates

---

## Frontend Pages
```
pages/auth/        Login, Signup, ResetPassword
pages/candidate/   CandidateDashboard, Profile, JobPostings, CandidateAnalytics, RateEmployer
pages/employer/    EmployerDashboard, EmployerProfile, HiringPrompt, RecommendedCandidates,
                   AutoSchedule, EmployerAnalytics, RateCandidate
pages/admin/       AdminDashboard, ManageUsers, SystemReports
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
