# SwiftHire Pragmatic Demo Readiness Report

Date: 2026-05-09  
Purpose: strict demo preparation against the approved proposal and Deliverable 1  
Repository checked: `/home/suleman-ahmed/Documents/SwiftHire`

## 1. Bottom Line

Your project is broad and demoable, but it is not safe to claim "all features are fully implemented" in front of a strict evaluator.

The current codebase can convincingly demonstrate the main recruitment flow:

1. Candidate/employer/admin authentication.
2. Candidate CV upload and skill extraction.
3. Employer hiring prompt.
4. Candidate ranking by ATS-style score.
5. Candidate selection.
6. Auto-scheduling into 45-minute slots.
7. Interview status changes.
8. Rating candidate/employer after completion.
9. Hiring a candidate.
10. Admin user management, analytics, and reports.

However, several proposal items are implemented only at surface level. A strict sir can reduce the perceived completion if he asks for:

- Advanced search filters.
- Application progress history.
- Proof of reminder emails actually being sent and logged.
- Ownership/security checks.
- Average ATS score in reports.
- Prompt history stored in database.
- Real testing evidence for NFRs.

Pragmatic completion estimate before fixes:

- Demo breadth: 75-80%
- Strict requirement compliance: 55-65%
- If you overclaim "100% complete": a strict evaluator can push it down to 40-50%
- If you explain partial items honestly and apply the recommended fixes below: 70-75% becomes defensible

## 2. Verification Performed Again

### Inputs Rechecked

- Proposal image OCR from `/home/suleman-ahmed/Downloads/Image-09_0_11_36.jpg`
- Deliverable 1 extracted text from `docx/extracted/SDA-Team-1-Deliverable-1.txt`
- Deliverable 2 extracted text from `docx/extracted/SDA-Team-1-Deliverable-2-FINALE.txt`
- Backend source under `backend/src/main/java`
- Frontend source under `frontend/src`

### Build Checks

| Check | Result | Meaning |
|---|---:|---|
| `mvn test` in `backend/` | Passed | Backend compiles, but no backend tests exist. Maven reported no test sources. |
| `npm run build` in `frontend/` | Passed | Frontend production build works. Vite warns that JS bundle is larger than 500 kB. |
| Test discovery | Weak | Only dependency test files were found under `node_modules`; no meaningful project tests were found. |

## 3. Proposal Feature Reality Check

The approved proposal lists 10 high-level features. The handwritten notes also add reviews, reminders, and two-way matching. This is the strictest view of your project.

| # | Proposal Feature | Current Status | Demo Confidence | What Sir Can Attack | Recommended Fix |
|---|---|---:|---:|---|---|
| 1 | Process hiring prompts | Partial-Strong | High | Prompt parsing is regex/dictionary based, not AI/NLP. Raw prompt is not saved in `HiringPrompt`. | Save raw prompt in `hiring_prompts`, show prompt history. |
| 2 | Register candidates | Strong | High | Email verification depends on email config. | Prepare verified seeded users and one live signup backup. |
| 3 | Score and rank resumes | Partial-Strong | High | ATS score is mostly skill overlap. Experience is extracted but not used in employer-side score. No precision proof. | Include experience and preference scoring; show score breakdown. |
| 4 | Set interview windows | Strong | High | Works through schedule date/start/end. | Add validation for empty candidate list and job ownership. |
| 5 | Auto-schedule interviews | Partial-Strong | High | Can schedule candidates not necessarily selected/recommended for that job if API is called directly. Orphan windows can be saved if scheduling fails. | Move window save into service transaction; validate job owner and selected candidates. |
| 6 | Automated email notifications | Partial | Medium | Email depends on external Gmail/OAuth config. Reminder logging can say SENT before async send actually succeeds. | Add delivery-accurate logging and a test email button/log view. |
| 7 | Basic + advanced search | Weak-Partial | Medium-Low | Admin search exists, but employer advanced candidate search by skills/experience/location/rating is not exposed. | Add employer candidate filter API and UI. |
| 8 | Track status changes of application | Weak-Partial | Medium | There is interview slot status, but no full application entity or status history. | Add application/status-history table or timeline view from slot events. |
| 9 | Admin manage users/accounts | Partial-Strong | High | Admin functions exist. Permanent delete removes earlier target audit logs before writing delete log. | Prefer soft delete; preserve audit history. |
| 10 | Graphical statistics/reports such as average ATS score | Partial | Medium | Analytics charts exist, but average ATS score is not clearly a first-class report and report date filters are not applied. | Add average ATS metric and apply date filters. |
| 11 | Reviews employer/employee | Partial-Strong | High | Review endpoints lack role/ownership checks. | Enforce rater role and slot ownership. |
| 12 | Email reminders | Partial | Low-Medium | Scheduler can miss reminders because it runs hourly but checks only a narrow time window. | Change scheduler to process due reminders. |
| 13 | Two-way matching | Partial | Medium | Employer-to-candidate and candidate-to-job exist, but candidate preferences/work type are weakly used. | Improve candidate-side and employer-side matching explanations. |

## 4. Deliverable 1 Use Case Reality Check

| UC | Use Case | Status | Demo Notes | Strict Risk |
|---|---|---:|---|---|
| UC-01 | Login | Strong | JWT login, email verification check, role redirect, lockout logic exist. | Logout does not invalidate JWT server-side. |
| UC-02 | Process Hiring Prompt | Partial-Strong | Employer can submit prompt and receive job/candidate results. | Raw prompt not persisted; unrecognized input not logged. |
| UC-03 | View Recommended Candidates | Partial-Strong | Ranked list with match score and profile modal exists. | Any authenticated user may GET job candidates by API; ownership is missing. |
| UC-04 | Auto-Schedule Batch | Partial-Strong | Preview and confirm flow exists with 45-minute slots. | Ownership/eligibility validation is weak. Window can be saved before later failure. |
| UC-05 | Rate Candidate | Partial | UI and endpoint exist after completed interview. | Backend does not verify the rater is the employer for that slot. |
| UC-06 | Sign Up | Strong | Candidate/employer signup, password validation, email verification exist. | Live email can fail if Gmail config is invalid. |
| UC-07 | Log Out | Partial | Frontend clears token and redirects. | Backend logout does not blacklist JWT. |
| UC-08 | Manage Candidate Profile | Partial | Profile view, CV upload, preferences exist. | Full name/phone/address edit UI is limited. |
| UC-09 | Upload CV | Partial-Strong | PDF upload, PDFBox parsing, skill extraction exist. | Only PDF; file validation is basic. |
| UC-10 | Set Preferences | Strong | Location, shift, work type UI exists. | Work type is not strongly used in matching. |
| UC-11 | View Job Postings | Partial | Candidate sees ranked jobs. | No advanced filters. No apply/application lifecycle. |
| UC-12 | Rate Employer | Partial | UI and endpoint exist after completed interview. | Backend does not verify the rater is the candidate for that slot. |
| UC-13 | Manage Users | Partial-Strong | Admin user list, filters, status updates, audit logs exist. | Delete/audit behavior should be tightened. |
| UC-14 | View System Reports | Partial | Admin report UI, history, CSV logic exist. | Backend stores date range but does not apply date filters to calculations. |
| UC-15 | Send Interview Reminders | Partial | Scheduler and NotificationLog exist. | Hard to demo live; scheduling logic can miss reminders. |
| UC-16 | View Hiring Analytics | Partial-Strong | Candidate, employer, admin analytics pages exist. | Some metrics are shallow; NFR performance not proven. |
| UC-17 | Manage Employer Profile | Strong | Employer profile read/update exists in backend and frontend. | Low risk. |

## 5. Strong Demo Areas

These are the features you can show confidently.

### 5.1 Authentication and Roles

Evidence:

- `backend/src/main/java/com/swifthire/auth/service/AuthService.java`
- `backend/src/main/java/com/swifthire/config/SecurityConfig.java`
- `frontend/src/App.jsx`
- `frontend/src/components/common/ProtectedRoute.jsx`

What works:

- Login.
- Candidate/employer signup.
- Email verification flow.
- Password reset flow.
- Role-specific frontend routes.
- Admin/candidate/employer dashboards.

Demo advice:

- Use prepared verified accounts for the main demo.
- Show live signup only if email delivery is working before class.
- Say: "We implemented email verification, but for the demo we use pre-verified seeded accounts to avoid depending on external email latency."

### 5.2 Candidate Profile, CV Upload, Preferences

Evidence:

- `CandidateService.uploadAndParseCV`
- `CvParserService.extractTextFromPdf`
- `CvParserService.parseSkills`
- `frontend/src/pages/candidate/Profile.jsx`

What works:

- Candidate profile loads.
- Candidate uploads a PDF CV.
- Backend extracts text using PDFBox.
- Skills are matched using `KnownSkillsDictionary`.
- Candidate can set location, shift, and work type preferences.

Demo advice:

- Prepare a clean PDF CV containing known dictionary skills like `java`, `spring boot`, `react`, `mysql`, `docker`.
- Avoid testing DOCX or image resumes. The system supports PDF only.

### 5.3 Employer Hiring Prompt and Ranked Candidates

Evidence:

- `PromptEngineService`
- `JobService.processHiringPrompt`
- `AtsScoreService.scoreAndRank`
- `frontend/src/pages/employer/HiringPrompt.jsx`
- `frontend/src/pages/employer/RecommendedCandidates.jsx`

What works:

- Employer enters prompt.
- Skills/location/shift/experience are parsed.
- Job posting is created.
- Candidate match scores are calculated.
- Recommended candidates are shown with ranking and ATS match score.

Demo advice:

- Use a prompt that exactly matches dictionary terms and seeded candidate CV skills.
- Best prompt format: `Need a Java developer with Spring Boot, MySQL, Docker, day shift in Lahore`.
- Do not use vague prompts like `need a smart backend person` because dictionary parsing may fail.

### 5.4 Auto-Scheduling

Evidence:

- `ScheduleService.previewBatch`
- `ScheduleService.scheduleBatch`
- `ScheduleController`
- `frontend/src/pages/employer/AutoSchedule.jsx`

What works:

- Employer selects candidates.
- Employer enters date/time window.
- System previews 45-minute slots.
- System saves slots and generates meeting links.
- Candidate/employer can see scheduled interviews.

Demo advice:

- Use a future time window long enough for selected candidates.
- For 2 candidates, use at least 90 minutes.
- Do not directly open `/employer/schedule/:jobId` without selected candidates; go through recommended candidates first.

### 5.5 Interview Status, Reviews, Hiring

Evidence:

- `ScheduleController.updateSlotStatus`
- `ReviewService`
- `EmployerService.hireCandidate`
- `frontend/src/pages/shared/MyInterviews.jsx`

What works:

- Candidate can confirm/cancel pending interview.
- Employer can mark confirmed interview complete.
- Candidate/employer can rate after completion.
- Employer can mark candidate hired.

Demo advice:

- Use already-seeded completed interviews if available.
- If doing live flow, schedule an interview for a time already passed or adjust the database/test data, because employer cannot mark complete before interview start.

### 5.6 Admin Management and Analytics

Evidence:

- `AdminController`
- `AdminService`
- `AnalyticsService`
- `frontend/src/pages/admin/ManageUsers.jsx`
- `frontend/src/pages/admin/SystemReports.jsx`
- `frontend/src/pages/admin/AdminAnalytics.jsx`

What works:

- Admin can view/search/filter users.
- Admin can approve/block/deactivate/delete users.
- Audit logs exist.
- System reports and report history exist.
- Analytics charts exist.

Demo advice:

- Show admin after the core candidate/employer flow.
- Use admin as "monitoring and control" proof, not as the main story.

## 6. Weak Areas a Strict Evaluator Can Crush

### 6.1 Advanced Search Is Not Really Complete

Proposal says: "Search: Basic + Advanced."

Current reality:

- Admin can search/filter users.
- Candidate can see ranked jobs.
- Employer can see recommended candidates after a prompt.
- `CandidateRepository` has some preference query methods, but no polished employer advanced search UI/API is exposed.

Strict objection:

> Show me advanced candidate search by skill, years of experience, location, shift, rating, and ATS score.

Current answer:

> We implemented prompt-driven matching and admin search. Advanced manual recruiter filters are partial and should be completed.

Recommended fix:

- Add `GET /api/jobs/{jobId}/candidates/search`.
- Filter by `skill`, `location`, `shift`, `workType`, `minRating`, `minScore`.
- Add UI controls above recommended candidates.
- Reuse existing `MatchScore` records and candidate fields.

### 6.2 Application Progress History Is Weak

Proposal says:

> Recruiters can view the application progress history.

Current reality:

- There is `InterviewSlot.status`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.
- Candidate has hired fields.
- Admin activity has some events.
- There is no first-class `Application` entity and no immutable status history table.

Strict objection:

> Show me the complete application history for this candidate/job from recommendation to interview to hired/rejected.

Current answer:

> The current implementation tracks interview status and hiring status. Full application history is partial.

Recommended fix:

- Add `Application` entity: candidate, jobPosting, status, createdAt, updatedAt.
- Add `ApplicationStatusHistory`: application, oldStatus, newStatus, changedBy, changedAt.
- Create history records when candidate is shortlisted, scheduled, confirmed, completed, reviewed, hired, rejected.
- Show timeline in employer candidate profile and candidate interview/job page.

Quick demo alternative:

- Add a "Progress History" modal using existing slot status, created time, start time, completion, review, and hired status.
- Label it honestly as interview/application progress.

### 6.3 Prompt History Is Not Saved

Deliverable 2 includes `HiringPrompt`.

Current reality:

- `HiringPrompt` entity exists.
- No repository/use was found.
- `JobService.processHiringPrompt` parses raw text and creates a job, but does not save a prompt row.

Strict objection:

> Where is the hiring prompt stored? Show me prompt history.

Recommended fix:

- Add `HiringPromptRepository`.
- In `processHiringPrompt`, create `HiringPrompt` with employer, jobPosting, rawText.
- Set `job.setHiringPrompt(prompt)` or persist the relationship consistently.
- Add employer prompt history page or include raw prompt in My Jobs.

### 6.4 Reports Do Not Fully Respect Filters

Current reality:

- `AdminService.generateReport(category, from, to, userType, adminEmail)` accepts `from` and `to`.
- It saves the date range in `GraphicalReport`.
- But report calculations use all users/jobs/reviews/interviews instead of filtering by created date.

Strict objection:

> Generate report from this date to this date. Why are old records still counted?

Recommended fix:

- Parse `from` and `to` into dates.
- Add repository queries or stream filters using `createdAt`, `generatedAt`, `startTime`, etc.
- Apply date range before counting/reporting.

### 6.5 Average ATS Score Is Not a Strong First-Class Report

Proposal explicitly mentions:

> Statistics such as average ATS score.

Current reality:

- Match scores exist.
- Candidate analytics shows ATS-style top matches.
- Admin reports do not clearly expose average ATS score as a main metric.

Strict objection:

> Show average ATS score report.

Recommended fix:

- Add `averageAtsScore` to admin analytics and reports.
- Add per-job average, top score, bottom score, candidate count.
- Add chart in System Reports or Admin Analytics.

### 6.6 Reminder Emails Are Risky to Demo Live

Current reality:

- `ReminderScheduler` exists.
- It checks 7-day, 3-day, and 1-day reminders.
- It runs hourly.
- It checks only `now + threshold +/- 5 minutes`.
- Reminder email method is async, but scheduler logs `SENT` immediately after invoking it.

Strict objection:

> Prove the reminder was sent and logged reliably.

Risk:

- If an interview is at 2:30 PM, an hourly job at 2:00 or 3:00 can miss the 2:25-2:35 window.
- Async delivery can fail after the log is already marked `SENT`.

Recommended fix:

- Track reminder due timestamps.
- Query reminders where due time is <= now and flag is false.
- Log `SENT` only after email delivery success.
- Add `FAILED` log on real failure.
- Add admin notification log view.

Demo advice:

- Do not rely on live cron in the demo.
- Say: "The reminder scheduler is implemented for background operation; in demo we show scheduling/invitation emails and code/log model. Reminder timing is long-term and not ideal for a short live demo."

### 6.7 Authorization and Ownership Gaps Are Serious

This is the biggest engineering risk.

Current issues found:

- `SecurityConfig` restricts `/api/admin`, `/api/candidate`, `/api/employer`, but job mutations under `/api/jobs/**` are not fully role-restricted.
- `JobService.updateJobPosting`, `archiveJobPosting`, and `closeJobPosting` load by ID and do not verify that the current employer owns the job.
- `JobService.getRankedCandidates` does not verify that the job belongs to the logged-in employer.
- `ScheduleService.scheduleBatch` loads `JobPosting` but does not verify it belongs to the scheduling employer.
- `ScheduleController.getSlot` returns slot summary without checking candidate/employer ownership.
- `ReviewService.rateCandidate` and `rateEmployer` do not verify the rater is actually the employer/candidate connected to that slot.

Strict objection:

> Can one employer modify another employer's job if they know the ID?

Current answer:

> The UI prevents that, but the backend ownership checks need hardening.

Recommended fix:

- Add service-level ownership checks everywhere.
- Do not rely only on frontend routing.
- Add tests proving unauthorized access fails.

### 6.8 Secrets and Demo Environment Risk

Current reality:

- Credential-like Google/OAuth defaults are present in backend properties.
- `application.properties` imports optional `application-secrets.properties`, but defaults still include sensitive-looking values.

Risk:

- If sir opens config, this looks unprofessional and unsafe.
- If those credentials are real, they should be considered exposed.

Recommended fix:

- Move all secrets to environment variables or `application-secrets.properties`.
- Remove real-looking defaults from committed config.
- Rotate any exposed email/OAuth credentials.
- Keep only placeholders in repository files.

## 7. Recommended Fixes by Priority

### Priority 0: Demo Preparation, No Code Required

Do these before your demo even if you do not code more:

1. Prepare three browser profiles or incognito windows: candidate, employer, admin.
2. Use verified seeded accounts, not live signup as the main path.
3. Have a known-good PDF CV with dictionary skills.
4. Use a known-good prompt with exact dictionary skills.
5. Pre-create at least one completed interview so rating/hiring can be shown immediately.
6. Pre-create enough candidates so ranking looks real.
7. Test email delivery before class; if not reliable, do not make email the center of the demo.
8. Prepare a short honest sentence for partial items: "This part is implemented as status/interview tracking; full application history table is next."

### Priority 1: Must-Fix Code Issues Before a Strict Demo

These are the fixes that most protect your marks.

#### Fix 1: Job Authorization and Ownership

Files:

- `backend/src/main/java/com/swifthire/config/SecurityConfig.java`
- `backend/src/main/java/com/swifthire/job/service/JobService.java`
- `backend/src/main/java/com/swifthire/job/controller/JobController.java`

Implement:

- Restrict all `/api/jobs/**` endpoints to `EMPLOYER`, except if a specific candidate/admin endpoint is intended.
- In `JobService`, resolve employer from email and verify `job.getEmployer().getId().equals(employer.getId())`.
- Apply this check to:
  - `getRankedCandidates`
  - `updateJobPosting`
  - `archiveJobPosting`
  - `closeJobPosting`

Expected result:

- One employer cannot view/modify another employer's job or ranked candidates.

#### Fix 2: Schedule Ownership and Transaction Safety

Files:

- `ScheduleController`
- `ScheduleService`

Implement:

- Validate `candidateIds` is not empty.
- Validate job belongs to logged-in employer.
- Validate candidates being scheduled came from `MatchScore` records for that job.
- Move interview window creation into `ScheduleService.scheduleBatch` inside the same transaction, or make the controller method transactional.
- Save the window only after all validation passes.

Expected result:

- Failed scheduling does not leave orphan windows.
- Employer cannot schedule interviews for another employer's job.

#### Fix 3: Review Ownership Checks

File:

- `backend/src/main/java/com/swifthire/review/service/ReviewService.java`

Implement:

- `rateCandidate`: require rater role `EMPLOYER` and require rater ID equals slot job employer user ID.
- `rateEmployer`: require rater role `CANDIDATE` and require rater ID equals slot candidate user ID.
- Keep existing completed-slot and duplicate-review checks.

Expected result:

- Reviews become defensible under security questioning.

#### Fix 4: Slot Detail Ownership

File:

- `backend/src/main/java/com/swifthire/scheduling/controller/ScheduleController.java`

Implement:

- In `getSlot`, verify:
  - candidate requester owns `slot.candidate`
  - employer requester owns `slot.window.employer`
  - admin either blocked or explicitly allowed

Expected result:

- Rating page context cannot leak interview details to unrelated users.

### Priority 2: Proposal Compliance Fixes

#### Fix 5: Persist Hiring Prompts

Files:

- `HiringPrompt.java`
- new `HiringPromptRepository.java`
- `JobService.java`

Implement:

- Save raw prompt text.
- Link prompt to employer and job posting.
- Show prompt text/history in employer jobs or analytics.

Demo value:

- When sir asks "where is the hiring prompt stored?", you can show DB-backed prompt history.

#### Fix 6: Add Application Progress History

Implement one of these:

Option A, proper:

- `Application`
- `ApplicationStatusHistory`
- statuses like `RECOMMENDED`, `SHORTLISTED`, `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `REVIEWED`, `HIRED`, `REJECTED`

Option B, quick demo:

- Build a "Progress History" view from existing interview slot status, review status, and hired status.

Demo value:

- This directly covers the proposal sentence "application progress history."

#### Fix 7: Add Advanced Search

Backend:

- Add candidate search endpoint for employers.
- Use filters:
  - skill
  - location
  - shift
  - work type
  - min rating
  - min ATS score
  - experience if you add candidate experience

Frontend:

- Add filter controls above recommended candidate list.

Demo value:

- Turns proposal item 7 from weak to defensible.

#### Fix 8: Add Average ATS Report

Backend:

- Compute average match score from `match_scores`.
- Add per-job average ATS score.
- Add platform average ATS score.

Frontend:

- Add chart/card in Admin Analytics or System Reports.

Demo value:

- Directly answers proposal item 10.

### Priority 3: Reliability and NFR Fixes

#### Fix 9: Reminder Scheduler Correctness

Implement:

- Use due-reminder queries instead of narrow +/- 5-minute windows.
- Track next due reminder or query `slot.startTime.minusDays(1/3/7) <= now`.
- Log after actual email delivery.
- Add retry queue or retry status.

#### Fix 10: Report Date Filters

Implement:

- Apply `from` and `to` to users/jobs/reviews/interviews before counting.
- Add repository methods instead of filtering everything in memory where possible.

#### Fix 11: Tests

Add at minimum:

- Prompt parsing tests.
- ATS score tests.
- Schedule conflict tests.
- Job ownership security tests.
- Review ownership tests.
- Admin report filter tests.
- One frontend workflow test or manual demo checklist.

#### Fix 12: Secret Cleanup

Implement:

- Remove real-looking defaults from committed properties.
- Use environment variables.
- Rotate exposed credentials.

## 8. What Not to Claim in Demo

Do not say:

- "All 17 use cases are fully complete."
- "Advanced search is fully implemented."
- "We have complete application history."
- "ATS accuracy is 85% proven."
- "Reminder delivery is guaranteed."
- "Calendar/Calendly integration is implemented."
- "Reports fully support date filtering."
- "The backend is fully secure."

Safer wording:

- "All 17 use cases have implementation coverage, but some are partial."
- "The core hiring flow is implemented end to end."
- "Advanced search exists partially through prompt matching and admin filters; manual recruiter filters are the next improvement."
- "Application progress is currently represented through interview status and hiring status; full status history is a recommended extension."
- "ATS scoring is deterministic and explainable using dictionary skill matching, not an ML model."
- "Email invitations are implemented; long-term reminders are handled by a scheduler and are not ideal for a short live demo."

## 9. Suggested Demo Script

Use this order. It matches the proposal and hides weak areas until after core value is shown.

### Step 1: Admin Opens System

Show:

- Admin dashboard.
- Existing users.
- User filters/search.
- Analytics/report page.

Say:

> Admin can monitor users, reports, ratings, jobs, and platform activity.

Avoid:

- Deep date-filter challenge unless fixed.

### Step 2: Candidate Profile and CV

Show:

- Candidate login.
- Profile page.
- Upload prepared PDF CV.
- Parsed skills.
- Preferences.

Say:

> Candidate data and parsed CV skills become the matching input.

Avoid:

- Uploading random CVs that may not contain dictionary skills.

### Step 3: Employer Hiring Prompt

Show:

- Employer login.
- Hiring prompt page.
- Submit known-good prompt.
- Recommended candidates.
- Candidate profile modal.

Say:

> The prompt is converted into structured job requirements and ranked against parsed CV skills.

Avoid:

- Claiming AI/LLM if asked. Say deterministic parser.

### Step 4: Auto-Schedule

Show:

- Select two candidates.
- Enter future window with enough time.
- Generate preview.
- Confirm schedule.
- Show created interview slots.

Say:

> The system allocates non-overlapping 45-minute interview slots and sends invitations.

Avoid:

- Selecting too many candidates for a short window.

### Step 5: Candidate Confirms

Show:

- Candidate interview page.
- Confirm interview.
- Join link.

Say:

> Candidate can track and update interview status.

### Step 6: Employer Completes, Reviews, Hires

Show:

- Employer interview page.
- Mark complete.
- Rate candidate.
- Hire candidate.

Say:

> Completion, reviews, and hire status close the recruitment loop.

Avoid:

- Trying to mark complete for future interview unless you have seeded completed data.

### Step 7: Candidate Rates Employer

Show:

- Candidate rate employer page for completed interview.

Say:

> Two-way review support was added from proposal notes.

### Step 8: Admin Reports Again

Show:

- Updated users/ratings/interviews/report history.

Say:

> Admin can monitor platform state after hiring activity.

## 10. Likely Sir Questions and Best Answers

| Question | Bad Answer | Better Answer |
|---|---|---|
| Is this AI based? | Yes, it understands any prompt. | It is deterministic NLP using regex and a skills dictionary. It extracts known skills, location, shift, and experience. |
| Show advanced search. | It is fully done. | Prompt-based matching and admin search are implemented. Manual recruiter advanced filters are partial and listed as next fix. |
| Where is application progress history? | It is complete. | Interview status and hire status are tracked. A full immutable application history table is the next extension. |
| Show average ATS report. | It is in analytics somewhere. | Match scores exist and candidate analytics shows ATS scores. Admin average ATS reporting should be added as a first-class metric. |
| Are reminders guaranteed? | Yes. | Scheduler exists for 7d/3d/1d reminders, but reliable delivery proof needs improved due-reminder logic and delivery-accurate logs. |
| Can one employer access another employer's job? | No, frontend prevents it. | The UI prevents it, but backend ownership checks should also be hardened. |
| Do you have tests? | Maven passed. | Maven build passes, but automated tests are not yet added. The test plan should cover prompt, ATS, scheduling, security, reviews, and reports. |
| Is Calendly integrated? | Yes. | The system generates Jitsi meeting links; the DB field name says Calendly but there is no Calendly API integration. |
| Can it parse every resume? | Yes. | It supports PDF text extraction and dictionary skill matching. Scanned/image resumes and DOCX are outside current scope. |

## 11. Evidence Map

### Backend

| Feature | Evidence |
|---|---|
| Login/signup/reset/verification | `AuthService`, `AuthController`, `JwtUtil` |
| Role security | `SecurityConfig`, `ProtectedRoute` on frontend |
| Rate limiting | `RateLimitInterceptor` |
| Prompt parsing | `PromptEngineService` |
| Job creation/ranked candidates | `JobService`, `AtsScoreService`, `MatchScoreRepository` |
| CV parsing | `CandidateService`, `CvParserService` |
| Candidate preferences/jobs | `CandidateService.getRecommendedJobs` |
| Employer profile/hiring | `EmployerService` |
| Scheduling | `ScheduleService`, `ScheduleController`, `InterviewSlot`, `InterviewWindow` |
| Email | `EmailService` |
| Reminders | `ReminderScheduler`, `NotificationLog` |
| Reviews | `ReviewService`, `ReviewController` |
| Admin | `AdminController`, `AdminService`, `AuditLog`, `GraphicalReport` |
| Analytics | `AnalyticsService`, `AnalyticsController` |

### Frontend

| Feature | Evidence |
|---|---|
| Routes | `frontend/src/App.jsx` |
| Auth context | `frontend/src/context/AuthContext.jsx` |
| Layout/navigation | `frontend/src/components/common/AppLayout.jsx` |
| Candidate profile/CV/preferences | `frontend/src/pages/candidate/Profile.jsx` |
| Candidate job recommendations | `frontend/src/pages/candidate/JobPostings.jsx` |
| Candidate analytics | `frontend/src/pages/candidate/CandidateAnalytics.jsx` |
| Employer prompt | `frontend/src/pages/employer/HiringPrompt.jsx` |
| Recommended candidates | `frontend/src/pages/employer/RecommendedCandidates.jsx` |
| Auto-schedule | `frontend/src/pages/employer/AutoSchedule.jsx` |
| Interviews | `frontend/src/pages/shared/MyInterviews.jsx` |
| Ratings | `RateCandidate.jsx`, `RateEmployer.jsx` |
| Admin users | `frontend/src/pages/admin/ManageUsers.jsx` |
| Admin reports | `frontend/src/pages/admin/SystemReports.jsx` |
| Admin analytics | `frontend/src/pages/admin/AdminAnalytics.jsx` |

## 12. Final Demo Strategy

Your best strategy is not to pretend the system is complete. Your best strategy is to show a polished end-to-end recruitment workflow and be precise about partial features.

Recommended opening line:

> SwiftHire automates the core recruitment flow: candidates upload CVs, employers enter hiring prompts, the system ranks candidates by ATS-style matching, schedules interviews, sends notifications, tracks interview status, supports reviews, and gives admin analytics. Some advanced extensions like full application history and manual advanced search are partially implemented and are documented as next improvements.

That answer is harder to crush because it matches the actual code.

If you can only fix a few things before demo, fix these:

1. Job ownership and `/api/jobs/**` authorization.
2. Review ownership checks.
3. Schedule job ownership and empty candidate validation.
4. Add prompt persistence.
5. Add average ATS metric to admin analytics/report.

Those five changes protect the most marks with the least scope.
