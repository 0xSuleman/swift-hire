**SwiftHire Verification and Validation Report**  
Date: 2026-05-09  
   
 Project: SwiftHire  
   
 Domain: Human Resources  
   
 Implementation target from proposal: Java Web App  
**1. Scope**  
This report verifies the current SwiftHire codebase against:  
- Project proposal image: /home/suleman-ahmed/Downloads/Image-09_0_11_36.jpg  
- Deliverable 1: docx/SDA-Team-1-Deliverable-1.pdf  
- Deliverable 2: docx/SDA-Team-1-Deliverable-2-FINALE.pdf  
- Current source code under backend/ and frontend/  
The verification was source-code based, with backend and frontend build checks. It did not include live database testing, production email delivery testing, browser end-to-end testing, load testing, or manual usability testing.  
**2. Executive Verdict**  
SwiftHire is a substantial implementation, not just scaffolding. The project includes a Spring Boot backend, React frontend, authentication, role-based dashboards, candidate and employer profiles, CV parsing, hiring prompt processing, ATS-style matching, interview scheduling, email notifications, reviews, analytics, and admin management.  
All 17 documented use cases from Deliverable 1 have at least some implementation coverage. However, several are only partially complete when compared with the proposal, Deliverable 1, and Deliverable 2. The most important gaps are authorization and ownership checks, missing persistence of raw hiring prompts, incomplete advanced search/filtering, weak application status history, reminder reliability issues, incomplete report filtering, and lack of automated tests.  
**3. Build and Verification Results**  
| | | |  
|-|-|-|  
| **Area** | **Result** | **Notes** |   
| Backend Maven build/tests | Passed | mvn test completed successfully. No backend test sources were present. |   
| Frontend production build | Passed | npm run build completed successfully. Vite warned that the main JS chunk is larger than 500 kB. |   
| Source structure | Verified | Spring Boot backend and Vite/React frontend are present. |   
| Deliverable alignment | Partially aligned | Most classes and modules from D2 are represented, but some behavior differs from the diagrams/specification. |   
| Runtime behavior | Not fully verified | No live database, email, or browser E2E run was performed. |   
   
**4. Proposal Feature Coverage**  
| | | |  
|-|-|-|  
| **Proposal Feature** | **Status** | **Evidence / Notes** |   
| Ability to process hiring prompts | Partial | PromptEngineService parses skills, locations, shifts, experience, and creates job postings through JobService. Raw HiringPrompt records are not persisted. |   
| Ability to register candidates | Implemented | Candidate signup exists through auth flow and creates candidate profile records. |   
| Ability to score and rank resumes | Partial | ATS matching exists through AtsScoreService, but scoring is mostly skill overlap plus basic filters. Experience is parsed but not meaningfully used in scoring. |   
| Ability to set interview windows | Implemented | Employer scheduling accepts start/end windows and slot duration. |   
| Ability to auto-schedule interviews | Partial | Batch scheduling and preview exist. Missing stronger ownership and candidate eligibility validation. |   
| Ability to send automated email notifications | Partial | Email service exists for verification, reset, interview invitations/reminders, and hiring notices. Reliability is not proven and reminder logging can mark sent before async delivery succeeds. |   
| Search: basic + advanced | Partial / Weak | Admin user search/filter exists. Candidate job ranking exists. Recruiter advanced candidate search by skills/location/experience/rating is not clearly implemented. |   
| Track status changes of an application | Partial / Weak | Interview slot status and hired flag exist, but there is no full application lifecycle or status history entity. |   
| Admin manage system users/accounts | Partial | Admin user listing, filtering, status changes, delete, audit views, and reports exist. Some deletion/audit behavior needs care. |   
| Graphical statistics/reports such as average ATS score | Partial | Analytics dashboards exist, but average ATS reporting and date-filtered backend reports are incomplete. |   
| Reviews for employer and employee | Partial | Candidate and employer review flows exist, but role and ownership checks are weak. |   
| Email reminders | Partial | Scheduler exists, but hourly cron plus narrow reminder windows can miss reminders. |   
| Two-way candidate/employer matching | Partial | Employer-to-candidate matching and candidate-to-job recommendations exist, but advanced controls and evidence of matching quality are limited. |   
   
**5. Deliverable 1 Use Case Coverage**  
| | | | |  
|-|-|-|-|  
| **UC** | **Use Case** | **Status** | **Verification Notes** |   
| UC-01 | Login | Complete | Auth controller, JWT utility, login page, failed-attempt handling, email verification check, and role redirect exist. |   
| UC-02 | Process Hiring Prompt | Partial | Prompt parsing and job creation exist. Missing raw prompt persistence and explicit logging of unrecognized prompt input. |   
| UC-03 | View Recommended Candidates | Partial | Ranked candidate list exists for employers. Matching is basic and depends on parsed CV skills. |   
| UC-04 | Auto-Schedule Batch | Partial | Preview and confirmation exist. Missing full ownership/eligibility validation and external calendar integration. |   
| UC-05 | Rate Candidate | Partial | Rating endpoint and UI exist. Missing strong role and slot ownership checks. |   
| UC-06 | Sign Up | Complete | Candidate/employer signup, validation, profile creation, and email verification exist. Admin self-signup is blocked. |   
| UC-07 | Log Out | Partial | Frontend clears auth state. Backend logout endpoint is present, but JWT invalidation/blacklisting is not implemented. |   
| UC-08 | Manage Candidate Profile | Partial | Backend update exists, frontend mainly supports viewing profile, CV upload, and preferences; full editable candidate profile UI is limited. |   
| UC-09 | Upload CV | Partial | PDF upload, validation, parsing, and skill extraction exist. Missing stronger file sanitization and broader document support. |   
| UC-10 | Set Preferences | Complete | Candidate preference update exists and is wired to frontend. |   
| UC-11 | View Job Postings | Partial | Candidate recommended jobs page exists. Manual advanced filters/search are limited. |   
| UC-12 | Rate Employer | Partial | Rating endpoint and UI exist. Missing strong role and slot ownership checks. |   
| UC-13 | Manage Users | Partial | Admin user management is implemented. Some audit/delete behavior and access hardening need review. |   
| UC-14 | View System Reports | Partial | Reports and CSV export logic exist. Backend date filters are stored but not applied to the underlying query calculations. |   
| UC-15 | Send Interview Reminders | Partial | Scheduler and reminder email methods exist. Reliability and accurate sent/failed logging need improvement. |   
| UC-16 | View Hiring Analytics | Partial | Candidate, employer, and admin analytics exist. Some report metrics from the proposal are incomplete. |   
| UC-17 | Manage Employer Profile | Complete | Employer profile read/update exists in backend and frontend. |   
   
**6. Deliverable 2 Design Alignment**  
Deliverable 2 describes a design with packages/classes around authentication, user management, candidate profiles, employer profiles, job postings, hiring prompts, matching, scheduling, email/reminders, reviews, analytics, and admin reporting. The current codebase broadly follows this structure.  
**Aligned Areas**  
- Authentication service/controller, JWT utility, signup/login/reset/verification flows.  
- User, Candidate, Employer, JobPosting, MatchScore, InterviewSlot, Review, AuditLog, and GraphicalReport models.  
- Services for candidate profiles, employer profiles, jobs, prompt parsing, ATS scoring, scheduling, email, reminders, reviews, analytics, and admin.  
- Frontend role-separated dashboards for candidate, employer, and admin.  
**Deviations**  
- HiringPrompt model exists, but raw prompt records are not saved when processing prompts.  
- Email implementation uses Gmail REST/OAuth style logic rather than the SMTP/JavaMailSender-style service implied by some documentation.  
- Scheduling creates meeting links, but no true Calendly API integration was found.  
- Some sequence-diagram assumptions around validation, logging, and failure states are weaker in the actual implementation.  
- Application progress/history is not modeled as a first-class application lifecycle entity.  
**7. Implemented System Areas**  
**Authentication and Account Security**  
Implemented:  
- Login, signup, logout endpoint, email verification, resend verification, password reset request, and password reset.  
- Role-based JWT generation.  
- Password complexity validation.  
- Email verification before login.  
- Failed-login attempt tracking and lock/deactivation behavior.  
- Basic in-memory rate limiting.  
Main gaps:  
- Logout does not invalidate already-issued JWTs.  
- Rate limiting is in-memory and not distributed.  
- JWT is stored in frontend local storage, which increases impact of XSS.  
- Some secret-like Google OAuth/email values are present in application properties and should be moved to environment variables.  
**Candidate Features**  
Implemented:  
- Candidate dashboard and profile view.  
- CV PDF upload and parsing through PDFBox.  
- Skill extraction using dictionary matching.  
- Candidate preferences.  
- Recommended job postings based on skills/preferences.  
- Candidate interview view and employer rating flow.  
- Candidate analytics dashboard.  
Main gaps:  
- Full editable candidate profile UI is limited compared with the backend capability.  
- CV validation checks content type and size, but deeper file safety checks are limited.  
- Job posting view has limited manual search/filter controls.  
- Recommendation quality is not verified against the required precision/recall-style non-functional requirements.  
**Employer Features**  
Implemented:  
- Employer dashboard and profile management.  
- Hiring prompt form.  
- Prompt parsing into job requirements.  
- Job posting creation.  
- Ranked candidate recommendations.  
- Candidate profile modal/view.  
- Batch interview preview and scheduling.  
- Interview view.  
- Candidate rating.  
- Candidate hiring flow.  
- Employer analytics dashboard.  
- Job close/archive flows.  
Main gaps:  
- Employer job update/archive/close ownership checks are weak or missing in service-layer logic.  
- Prompt processing does not persist raw prompt history.  
- Advanced candidate search is incomplete.  
- Scheduling does not fully verify that selected candidates are eligible/recommended for the job.  
- Scheduling does not verify all ownership relationships strongly enough.  
**Admin Features**  
Implemented:  
- Admin dashboard.  
- User listing, search, filtering, status update, delete.  
- Audit log views.  
- User interview/review/activity views.  
- System reports.  
- Report history.  
- Admin analytics.  
Main gaps:  
- Report date filters are not consistently applied to backend calculations.  
- Permanent delete behavior removes existing audit logs for the target user before recording deletion, which can weaken audit completeness.  
- Admin report CSV export exists in backend, while frontend also generates CSV client-side instead of consistently using backend export.  
**Scheduling, Email, and Reminders**  
Implemented:  
- Batch schedule preview.  
- Batch schedule confirmation.  
- Interview slot model and statuses.  
- Meeting link generation.  
- Invitation emails.  
- Reminder scheduler.  
- Auto-completion of expired interviews.  
Main gaps:  
- Reminder scheduler runs hourly while checking narrow reminder windows, so reminders can be missed for interviews not aligned close to the hour.  
- Reminder logging marks messages as sent immediately after invoking an async email method, so async failures may not be reflected accurately.  
- No durable retry queue was found.  
- No confirmed external calendar provider integration was found.  
**Reviews and Ratings**  
Implemented:  
- Employer can rate candidates.  
- Candidate can rate employers.  
- Duplicate rating prevention by rater/slot.  
- Average rating recalculation.  
- Review lists for users/admin.  
Main gaps:  
- Review service lacks strong role and slot ownership validation.  
- Any authenticated user may be able to attempt rating operations if they know a completed slot ID.  
**Analytics and Reports**  
Implemented:  
- Candidate analytics.  
- Employer analytics.  
- Admin analytics.  
- Graphical report entity/history.  
- Report categories for users, jobs, ratings, and analytics.  
Main gaps:  
- Date filters are not fully applied in backend report generation.  
- Average ATS score reporting from the proposal is incomplete or not clearly surfaced as a first-class report.  
- No performance/load evidence is present for analytics/reporting.  
**8. Major Risks and Required Fixes**  
**8.1 Authorization and Ownership Gaps**  
Severity: High  
Some backend routes and service methods rely on authentication but do not fully enforce role and ownership rules.  
Examples:  
- Job mutation endpoints are not sufficiently restricted by Spring Security matchers.  
- Job update/archive/close service methods do not verify the logged-in employer owns the job.  
- Scheduling does not strongly verify the job belongs to the requesting employer.  
- Slot detail retrieval lacks ownership protection.  
- Review creation lacks strong role and ownership validation.  
Recommended fixes:  
- Restrict job mutation endpoints to EMPLOYER.  
- Enforce job ownership inside JobService, not only at controller/security level.  
- Enforce slot ownership for all schedule read/update endpoints.  
- Enforce role-specific review permissions and confirm rater is connected to the completed interview slot.  
**8.2 Hiring Prompt Persistence Missing**  
Severity: Medium-High  
The design includes a HiringPrompt concept, but prompt processing creates a job posting and scores candidates without saving the raw prompt request as a durable prompt record.  
Recommended fixes:  
- Add/use HiringPromptRepository.  
- Save raw prompt text, parsed fields, employer, associated job posting, and created timestamp.  
- Use this history in employer dashboard and admin reporting.  
**8.3 Reminder Reliability and Logging**  
Severity: Medium-High  
The scheduler checks 7-day, 3-day, and 1-day reminder windows using a narrow time range, but the cron schedule is hourly. This can miss reminders for interviews not close to the exact hourly check. Also, async email sending can fail after the scheduler has already logged the reminder as sent.  
Recommended fixes:  
- Query all pending reminders due before now, not only a narrow window.  
- Store reminder due states per slot.  
- Log SENT only after actual delivery returns successfully.  
- Add retry handling or a durable notification queue.  
**8.4 Advanced Search and Application History Are Incomplete**  
Severity: Medium  
The proposal explicitly mentions basic + advanced search and application status tracking. The current implementation has some search/filtering and status fields, but does not provide a complete application pipeline/history model.  
Recommended fixes:  
- Add employer-facing candidate advanced search by skills, location, shift, experience, rating, and ATS score.  
- Add candidate-facing job filters.  
- Add an Application or ApplicationStatusHistory entity if the intended domain includes full pipeline tracking.  
**8.5 Tests Are Missing**  
Severity: Medium  
The backend build passes, but no backend test sources were present. Frontend build passes, but no automated frontend test run was verified.  
Recommended fixes:  
- Add backend service tests for prompt parsing, ATS scoring, scheduling conflicts, auth, admin reports, and reviews.  
- Add controller/security tests for role and ownership enforcement.  
- Add frontend workflow tests for login, candidate CV upload, employer prompt, scheduling, and admin reports.  
- Add at least one end-to-end happy path covering candidate signup, CV upload, employer prompt, schedule, reminder eligibility, review, and analytics visibility.  
**9. Non-Functional Requirement Assessment**  
| | | |  
|-|-|-|  
| **NFR Area** | **Status** | **Notes** |   
| Performance | Not proven | No load/performance tests found. |   
| Scalability | Partial | Architecture can scale in principle, but in-memory rate limiting and scheduler design are not distributed-safe. |   
| Usability | Partial | Frontend is functional and role-based, but no usability test evidence was found. |   
| Data validation | Partial | DTO validation exists in several places. Some service-layer validation remains weak. |   
| Search and filters | Partial | Admin filtering exists. Candidate/employer advanced search is incomplete. |   
| Security and access control | Partial / Risky | Role checks exist, but ownership gaps are significant. Secrets should be moved out of committed properties. |   
| Notifications | Partial | Email flows exist, but reliability guarantees are not proven. |   
| Account management | Partial | Signup, verification, reset, admin management exist. JWT invalidation is missing. |   
| Job and candidate management | Partial | Core flows exist. Application lifecycle/history is weak. |   
| Integration | Partial | Gmail-style email integration exists. No confirmed calendar/Calendly integration. |   
   
**10. File-Level Evidence**  
Key backend files:  
- backend/src/main/java/com/swifthire/auth/service/AuthService.java  
- backend/src/main/java/com/swifthire/auth/controller/AuthController.java  
- backend/src/main/java/com/swifthire/auth/util/JwtUtil.java  
- backend/src/main/java/com/swifthire/config/SecurityConfig.java  
- backend/src/main/java/com/swifthire/config/RateLimitInterceptor.java  
- backend/src/main/java/com/swifthire/job/service/PromptEngineService.java  
- backend/src/main/java/com/swifthire/job/service/JobService.java  
- backend/src/main/java/com/swifthire/job/service/AtsScoreService.java  
- backend/src/main/java/com/swifthire/job/controller/JobController.java  
- backend/src/main/java/com/swifthire/candidate/service/CandidateService.java  
- backend/src/main/java/com/swifthire/candidate/service/CvParserService.java  
- backend/src/main/java/com/swifthire/schedule/service/ScheduleService.java  
- backend/src/main/java/com/swifthire/schedule/controller/ScheduleController.java  
- backend/src/main/java/com/swifthire/email/EmailService.java  
- backend/src/main/java/com/swifthire/automation/ReminderScheduler.java  
- backend/src/main/java/com/swifthire/review/service/ReviewService.java  
- backend/src/main/java/com/swifthire/admin/service/AdminService.java  
- backend/src/main/java/com/swifthire/analytics/AnalyticsService.java  
Key frontend files:  
- frontend/src/App.jsx  
- frontend/src/context/AuthContext.jsx  
- frontend/src/components/common/ProtectedRoute.jsx  
- frontend/src/components/common/AppLayout.jsx  
- frontend/src/pages/auth/Login.jsx  
- frontend/src/pages/auth/Signup.jsx  
- frontend/src/pages/auth/VerifyEmail.jsx  
- frontend/src/pages/auth/ResetPassword.jsx  
- frontend/src/pages/candidate/Profile.jsx  
- frontend/src/pages/candidate/JobPostings.jsx  
- frontend/src/pages/candidate/CandidateAnalytics.jsx  
- frontend/src/pages/candidate/RateEmployer.jsx  
- frontend/src/pages/employer/HiringPrompt.jsx  
- frontend/src/pages/employer/RecommendedCandidates.jsx  
- frontend/src/pages/employer/AutoSchedule.jsx  
- frontend/src/pages/employer/MyJobs.jsx  
- frontend/src/pages/employer/EmployerProfile.jsx  
- frontend/src/pages/employer/EmployerAnalytics.jsx  
- frontend/src/pages/employer/RateCandidate.jsx  
- frontend/src/pages/shared/MyInterviews.jsx  
- frontend/src/pages/admin/ManageUsers.jsx  
- frontend/src/pages/admin/SystemReports.jsx  
- frontend/src/pages/admin/AdminAnalytics.jsx  
**11. Recommended Completion Roadmap**  
**Priority 1: Security and Correctness**  
1. Fix job route authorization and service-layer ownership checks.  
2. Fix schedule ownership and slot detail authorization.  
3. Fix review role/ownership checks.  
4. Move secrets out of application.properties and rotate any exposed credentials.  
5. Add backend security/controller tests for the above.  
**Priority 2: Proposal and Deliverable Completeness**  
1. Persist hiring prompt history.  
2. Add application lifecycle/history tracking.  
3. Implement advanced candidate and job search filters.  
4. Improve ATS scoring to include experience, preferences, and clearer score explanations.  
5. Surface average ATS score in analytics/reports.  
**Priority 3: Reliability and Evidence**  
1. Rework reminder scheduling to use due reminders and accurate delivery logging.  
2. Add automated unit/integration tests.  
3. Add frontend workflow tests.  
4. Add load/performance evidence for core NFR claims.  
5. Document supported integrations clearly: Gmail/email, generated meeting links, and whether calendar/Calendly is in scope.  
**12. Final Assessment**  
The project is in a good functional state for a student software design implementation and demonstrates most of the major promised modules. It can likely be demoed successfully for core flows: signup/login, profile setup, CV upload, employer prompt, candidate recommendation, scheduling, emails, reviews, analytics, and admin management.  
It is not yet complete from a production-quality verification perspective. The main work needed before claiming full compliance is to harden authorization, persist prompt/application history, complete advanced search, improve reminder reliability, apply report filters correctly, and add tests that prove the stated behavior and non-functional requirements.  
