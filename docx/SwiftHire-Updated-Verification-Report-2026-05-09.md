# SwiftHire Updated Verification Report

Date: 2026-05-09  
Repository: `/home/suleman-ahmed/Documents/SwiftHire`  
Purpose: verify the updated pulled codebase against the approved proposal, Deliverable 1, and Deliverable 2.

## 1. Executive Summary

The updated codebase is stronger than the previous verified version. It now includes visible improvements for proposal compliance:

- Candidate application tracking page.
- Candidate application status API derived from match scores and interview slots.
- Employer-side application status badges.
- ATS score breakdown fields: skill match, location match, shift match.
- Candidate-side job filtering by match score, location, and shift.
- Employer-side candidate filtering by minimum ATS score and rating.
- Candidate cross-employer scheduling conflict detection.
- Notification logs for invitations and reminders.
- Admin notification log endpoint and UI support.
- Admin delete flow no longer removes previous target audit logs before delete.

However, the project is still not fully proposal-complete or market-ready. The main remaining weaknesses are:

- No first-class `Application` or `ApplicationStatusHistory` entity.
- Prompt history is still not persisted, despite `HiringPrompt` entity existing.
- Job ownership and `/api/jobs/**` security gaps remain.
- Review ownership checks remain missing.
- Slot detail endpoint still leaks interview details to any authenticated user.
- Advanced search is improved but still partial and mostly frontend-side.
- Average ATS score is still not a first-class admin report metric.
- Reminder logging still marks reminder as `SENT` before async delivery is actually known.
- Report date filters are accepted and stored but not applied to report calculations.
- Backend and frontend builds pass, but there are no meaningful project tests.

Current pragmatic status:

| Area | Estimate |
|---|---:|
| Demo breadth | 80-85% |
| Strict proposal compliance | 65-72% |
| Market readiness for proposal scope | 55-62% |

The app is now more defensible in a demo, but it should still be presented as "core flow implemented with partial advanced/history/reporting hardening remaining", not as fully market-ready.

## 2. Verification Inputs

Checked against:

- Proposal image: `/home/suleman-ahmed/Downloads/Image-09_0_11_36.jpg`
- Deliverable 1 extracted text: `docx/extracted/SDA-Team-1-Deliverable-1.txt`
- Deliverable 2 extracted text: `docx/extracted/SDA-Team-1-Deliverable-2-FINALE.txt`
- Backend source: `backend/src/main/java`
- Frontend source: `frontend/src`

Proposal feature list:

1. Process hiring prompts.
2. Register candidates.
3. Score and rank resumes.
4. Set interview windows.
5. Auto-schedule interviews.
6. Send automated email notifications.
7. Basic and advanced search.
8. Track status changes of an application.
9. Admin manages system users/accounts.
10. Graphical reports/statistics such as average ATS score.
11. Red-ink addition: reviews for employer and employee.
12. Red-ink addition: email reminders.
13. Red-ink addition: two-way matching.

## 3. Build and Test Results

| Check | Result | Notes |
|---|---:|---|
| Backend `mvn test` | Passed | Build succeeded. Maven reported no test sources to compile. |
| Frontend `npm run build` | Passed | Vite built successfully. Bundle warning remains. |
| Project tests | Missing | No meaningful backend/frontend project test files were found. |
| Frontend bundle | Warning | Main JS bundle is about 591 kB minified, larger than Vite's 500 kB warning threshold. |

Important limitation:

- This verification is source/build based.
- It did not verify a live database migration, actual email delivery, browser E2E behavior, production deployment, or load/performance NFRs.

## 4. Updated Proposal Feature Coverage

| # | Proposal Feature | Current Status | Updated Verification |
|---|---|---:|---|
| 1 | Process hiring prompts | Partial-Strong | Prompt parsing creates job postings and returns parsed skills/location/shift/experience. Raw prompt is still not saved in `HiringPrompt`. |
| 2 | Register candidates | Strong | Signup, email verification, login, password reset, and profile creation exist. |
| 3 | Score and rank resumes | Partial-Strong | ATS score now stores skill match percentage plus location/shift match booleans. Experience is still not used in score. No precision/performance proof. |
| 4 | Set interview windows | Strong | Date/start/end window flow exists. Validation exists for future window and duration. |
| 5 | Auto-schedule interviews | Partial-Strong | Preview and batch scheduling exist. Candidate cross-employer conflict detection was added. Still missing job ownership and match eligibility validation. |
| 6 | Automated email notifications | Partial-Strong | Invitation logs now use `PENDING`, `SENT`, `FAILED`. Verification/reset/hire emails exist. Reminder delivery accuracy still weak. |
| 7 | Basic + advanced search | Partial | Candidate job filters and employer candidate filters were added, but advanced search is still limited and mostly frontend filtering over returned results. |
| 8 | Track application status changes | Partial | Candidate applications page and derived application statuses were added. Still no real application entity or immutable history. |
| 9 | Admin manage users/accounts | Partial-Strong | Admin user management, filters, audit logs, reports, analytics, notification logs exist. Delete is still permanent, and audit log deletion is allowed. |
| 10 | Graphical reports including average ATS | Partial | Analytics dashboards exist. Average ATS score is still not surfaced as a first-class admin report metric. Date filters are not applied. |
| 11 | Reviews employer/employee | Partial | UI and endpoints exist. Backend still lacks participant/role ownership checks. |
| 12 | Email reminders | Partial | Scheduler now runs every minute. Still uses narrow time windows and async delivery logging issue remains. |
| 13 | Two-way matching | Partial-Strong | Employer-to-candidate and candidate-to-job matching both exist. Candidate applications and filters improve this. Matching quality is still basic. |

## 5. Deliverable 1 Use Case Coverage

| UC | Use Case | Status | Notes |
|---|---|---:|---|
| UC-01 | Login | Strong | JWT login, role redirect, email verification check, failed-login lockout. Logout is still client-side only. |
| UC-02 | Process Hiring Prompt | Partial-Strong | Prompt parsing returns parsed details now. Raw prompt persistence/history still missing. |
| UC-03 | View Recommended Candidates | Partial-Strong | Ranked candidates, score breakdown, profile modal, filters, application status badges. Missing job ownership check in `getRankedCandidates`. |
| UC-04 | Auto-Schedule Batch | Partial-Strong | Preview, confirm, 45-min slots, invitations, candidate conflict check. Missing job ownership and recommended-candidate validation. |
| UC-05 | Rate Candidate | Partial | Rating works after completed slot. Missing role/participant ownership validation. |
| UC-06 | Sign Up | Strong | Candidate/employer signup with password validation and verification email. |
| UC-07 | Log Out | Partial | Frontend clears auth state. No server-side JWT revocation. |
| UC-08 | Manage Candidate Profile | Partial-Strong | Backend update exists; frontend supports profile view, CV upload, preferences. Full editable profile UI remains limited. |
| UC-09 | Upload CV | Partial-Strong | PDF upload, validation, PDFBox parsing, dictionary skill extraction. PDF-only and basic file safety. |
| UC-10 | Set Preferences | Strong | Location, shift, work type preferences exist. |
| UC-11 | View Job Postings | Partial-Strong | Candidate ranked jobs plus frontend filters by match score/location/shift. Still no true backend advanced search. |
| UC-12 | Rate Employer | Partial | Rating works after completed slot. Missing role/participant ownership validation. |
| UC-13 | Manage Users | Partial-Strong | Admin user filters, status changes, audit logs, delete, detail, interviews/reviews/activity. Permanent delete remains. |
| UC-14 | View System Reports | Partial | Reports/history/export exist. Date filters still not applied in backend calculations. |
| UC-15 | Send Interview Reminders | Partial | Scheduler, flags, notification logs exist. Async delivery/logging and due-window reliability remain weak. |
| UC-16 | View Hiring Analytics | Partial-Strong | Candidate, employer, admin analytics exist. Average ATS/report NFR remains incomplete. |
| UC-17 | Manage Employer Profile | Strong | Employer profile read/update exists in backend and frontend. |

## 6. Improvements Since Previous Verification

### 6.1 Application Status View Added

Evidence:

- `frontend/src/pages/candidate/MyApplications.jsx`
- `frontend/src/api/candidateApi.js`
- `backend/src/main/java/com/swifthire/candidate/controller/CandidateController.java`
- `backend/src/main/java/com/swifthire/candidate/service/CandidateService.java`
- `backend/src/main/java/com/swifthire/job/service/JobService.java`

What improved:

- Candidate can view matched jobs as "applications".
- Employer recommended candidate list shows derived statuses.
- Statuses include `RECOMMENDED`, `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `HIRED`.

Remaining gap:

- These are derived from `MatchScore`, `InterviewSlot`, and candidate hired fields.
- There is still no first-class `Application` table and no status history table.

Strict assessment:

- Good demo improvement.
- Still partial for "application progress history".

### 6.2 ATS Breakdown Added

Evidence:

- `MatchScore.skillMatchPct`
- `MatchScore.locationMatched`
- `MatchScore.shiftMatched`
- `AtsScoreService.scoreAndRank`
- `RecommendedCandidates.jsx` ATS breakdown modal

What improved:

- Employer can see more than just a single score.
- ATS score is more explainable.

Remaining gap:

- Experience is parsed but not scored.
- Work type is not used in scoring.
- Rating is displayed and filterable but not part of the persisted ATS score.
- No scoring tests or accuracy evidence.

### 6.3 Search/Filters Improved

Evidence:

- `frontend/src/pages/candidate/JobPostings.jsx`
- `frontend/src/pages/employer/RecommendedCandidates.jsx`
- `frontend/src/pages/admin/ManageUsers.jsx`

What improved:

- Candidate can filter jobs by minimum match score, location, and shift.
- Employer can filter candidates by minimum ATS and minimum rating.
- Admin can search/filter users.

Remaining gap:

- Employer candidate filtering is only min ATS and min rating.
- Candidate filtering is frontend-side over loaded results.
- No backend advanced search endpoint for skills, experience, location, shift, rating, status, and ATS range.

### 6.4 Notification Logs Improved

Evidence:

- `NotificationLog`
- `EmailService.trySendInvitation`
- `AdminController.getNotificationLogs`
- `AdminService.getNotificationLogs`
- `SystemReports.jsx` notification log UI references

What improved:

- Interview invitation email attempts are logged as `PENDING`, then `SENT` or `FAILED`.
- Admin can fetch notification logs.

Remaining gap:

- Reminder logging still calls async method then immediately records `SENT`.
- `NotificationLog` comment says `SENT` or `FAILED`, but invitation code uses `PENDING` too. The model should formally support `PENDING`.

### 6.5 Scheduling Conflict Detection Improved

Evidence:

- `InterviewSlotRepository.findOverlappingSlotsByCandidate`
- `ScheduleService.scheduleBatch`

What improved:

- A candidate's overlapping slots across employers are now checked.

Remaining gap:

- Preview still checks only employer conflict, not candidate cross-conflict.
- If candidate conflicts are found during scheduling, the code silently skips that candidate instead of clearly reporting which candidate could not be scheduled.
- Job ownership is still not validated in `ScheduleService`.

### 6.6 Admin Audit Behavior Slightly Improved

Evidence:

- `AdminService.deleteUser`

What improved:

- The code no longer deletes prior audit logs for the target user before saving delete audit log.

Remaining gap:

- `deleteUser` is still permanent deletion.
- Admin can delete audit log entries through `DELETE /api/admin/audit-logs/{id}`.
- For a market-ready audit trail, user deletion should be soft delete/deactivation and audit deletion should usually be disabled or highly restricted.

## 7. Remaining High-Risk Gaps

### 7.1 Job Authorization and Ownership Remain Weak

Severity: High

Evidence:

- `SecurityConfig` allows `GET /api/jobs/**` for any authenticated user.
- Non-GET `/api/jobs/**` routes fall through to `anyRequest().authenticated()`.
- `JobService.getRankedCandidates` does not verify job ownership.
- `JobService.updateJobPosting`, `archiveJobPosting`, and `closeJobPosting` do not verify job ownership.

Impact:

- An authenticated user may call job mutation endpoints if they know a job ID.
- One employer may modify/archive/close another employer's job through API calls.
- Any authenticated user may fetch ranked candidates for a job through `GET /api/jobs/{jobId}/candidates`.

Recommended fix:

- In `SecurityConfig`, require employer role for all employer job routes.
- In `JobService`, add a helper:

```java
private JobPosting findOwnedJob(String email, Long jobId)
```

- Use it in:
  - `getRankedCandidates`
  - `updateJobPosting`
  - `archiveJobPosting`
  - `closeJobPosting`
  - schedule validation

### 7.2 Review Ownership Checks Still Missing

Severity: High

Evidence:

- `ReviewService.rateCandidate`
- `ReviewService.rateEmployer`

Current behavior:

- Checks rating value.
- Checks completed slot.
- Checks duplicate rating by rater/slot.
- Does not verify rater is the actual employer/candidate for that interview.

Recommended fix:

- `rateCandidate`: require rater role `EMPLOYER` and rater ID equals `slot.jobPosting.employer.user.id`.
- `rateEmployer`: require rater role `CANDIDATE` and rater ID equals `slot.candidate.user.id`.

### 7.3 Slot Detail Endpoint Still Leaks Data

Severity: High

Evidence:

- `ScheduleController.getSlot`

Current behavior:

- Any authenticated user can fetch slot details if they know `slotId`.

Recommended fix:

- If candidate, require slot candidate user ID equals requester ID.
- If employer, require slot window employer user ID equals requester ID.
- Block admins or explicitly allow admins with a separate admin endpoint.

### 7.4 Prompt History Still Missing

Severity: Medium-High

Evidence:

- `HiringPrompt` entity exists.
- No `HiringPromptRepository` was found.
- `JobService.processHiringPrompt` does not save `HiringPrompt`.

Impact:

- You cannot show durable prompt history.
- Deliverable 2 design is only partially implemented.

Recommended fix:

- Add `HiringPromptRepository`.
- Save raw prompt, employer, job posting, and parsed metadata.
- Show prompt text/history in employer jobs.

### 7.5 Application History Is Derived, Not Real History

Severity: Medium-High

Evidence:

- `CandidateService.getMyApplications`
- `JobService.getCandidateApplicationStatuses`

Current behavior:

- Derives application status from match score, slot status, and hired flag.
- Does not record transitions.
- Does not support `SHORTLISTED`, `REVIEWED`, or `REJECTED`.

Recommended fix:

- Add `Application` entity.
- Add `ApplicationStatusHistory` entity.
- Write a history row every time status changes.

### 7.6 Reminder Delivery Logging Still Not Reliable

Severity: Medium-High

Evidence:

- `ReminderScheduler.sendAndLog`
- `EmailService.sendInterviewReminder` is `@Async`

Current behavior:

- Scheduler calls async email method.
- It then immediately writes `SENT`.
- If async delivery fails later, the log may still say sent.

Scheduler improvement:

- It now runs every minute, which reduces the earlier hourly miss risk.

Remaining issue:

- It still uses `startTime BETWEEN now + threshold - 5 minutes` and `now + threshold + 5 minutes`.
- A down server or delayed scheduler may still miss reminders.

Recommended fix:

- Store due reminder states.
- Query "due and unsent" reminders where due time <= now.
- Mark `SENT` only after synchronous delivery success or callback completion.

### 7.7 Reports Still Ignore Date Filters

Severity: Medium

Evidence:

- `AdminService.generateReport(category, from, to, userType, adminEmail)`

Current behavior:

- Accepts `from` and `to`.
- Saves date range in `GraphicalReport`.
- Counts all users/jobs/reviews/interviews without applying the date range.

Recommended fix:

- Parse `from` and `to`.
- Filter users by `createdAt`.
- Filter jobs by `createdAt`.
- Filter reviews by `createdAt`.
- Filter interviews by `startTime`.

### 7.8 Average ATS Report Still Missing

Severity: Medium

Current behavior:

- Candidate analytics shows ATS scores for top job matches.
- Employer recommended candidates show ATS breakdown.
- Admin reports do not clearly expose average ATS score.

Recommended fix:

- Add average ATS score to `AdminService.generateReport("analytics")`.
- Add per-job average ATS score to job reports.
- Add top/bottom ATS distribution.

### 7.9 Secrets Still Appear in Properties

Severity: High for production readiness

Evidence:

- `backend/src/main/resources/application.properties` contains real-looking default values for Google OAuth client, secret, refresh token, and JWT default.

Recommended fix:

- Remove real-looking defaults from committed properties.
- Keep only environment variable placeholders.
- Rotate any credentials that were committed.

### 7.10 Automated Tests Still Missing

Severity: Medium

Current behavior:

- Backend compiles but has no test sources.
- Frontend builds but has no project tests.

Recommended minimum tests:

- Auth and role tests.
- Job ownership tests.
- Prompt parsing tests.
- ATS score tests.
- Scheduling conflict tests.
- Review ownership tests.
- Reminder logging tests.
- Report date filter tests.
- Candidate application status tests.

## 8. Market-Ready Proposal Completion Checklist

### Must Fix Before Calling It Market-Ready

| Priority | Item | Why |
|---:|---|---|
| P0 | Job ownership checks | Prevent cross-employer data modification. |
| P0 | Review ownership checks | Prevent fake/unauthorized ratings. |
| P0 | Slot detail ownership checks | Prevent interview data leakage. |
| P0 | Remove/rotate committed secrets | Production security requirement. |
| P1 | Save hiring prompt history | Direct proposal and D2 alignment. |
| P1 | Real application/status history | Direct proposal requirement. |
| P1 | Average ATS reporting | Direct proposal requirement. |
| P1 | Backend advanced search/filter APIs | Makes "advanced search" defensible. |
| P2 | Reminder delivery-accurate logs | Makes UC-15 reliable. |
| P2 | Date-filtered reports | Makes UC-14 credible. |
| P2 | Automated tests | Required for market readiness. |

### Good Improvements Already Done

| Item | Status |
|---|---:|
| ATS breakdown UI/data | Added |
| Candidate applications page | Added |
| Employer application status badges | Added |
| Candidate job filters | Added |
| Employer candidate filters | Added |
| Candidate cross-schedule conflict check | Added |
| Invitation notification logs | Added |
| Admin notification logs | Added |

## 9. Updated Demo Strategy

Your demo story is now stronger. Use this flow:

1. Admin login: show users, reports, analytics, notification logs.
2. Candidate login: profile, CV upload, preferences, recommended jobs, applications page.
3. Employer login: prompt entry, parsed result, ranked candidates, ATS breakdown, filters.
4. Select candidates and schedule interviews.
5. Candidate confirms interview.
6. Employer marks complete, rates candidate, hires candidate.
7. Candidate applications page updates status.
8. Admin reports/notification logs show system activity.

Avoid claiming:

- Full application history table.
- Full advanced search.
- Guaranteed email delivery.
- Real Calendly integration.
- Fully secure backend.
- Fully tested product.

Safe wording:

> The updated version now covers the core proposal flow end to end and adds application-status tracking, ATS breakdown, filters, and notification logs. The remaining market-readiness work is hardening ownership checks, persisting prompt/application history, completing average ATS reports, and adding tests.

## 10. Final Verdict

The pull improved proposal completeness meaningfully. The app is now better suited for a strict demo because several previously weak areas have visible UI/API coverage.

Still, from a product-readiness perspective, the most important work is not more UI. It is backend correctness:

- enforce ownership,
- persist the missing domain history,
- make reports truthful,
- make notification logs accurate,
- remove secrets,
- add tests.

Once those are addressed, SwiftHire can credibly claim the approved proposal is complete and market-ready within the proposal scope.
