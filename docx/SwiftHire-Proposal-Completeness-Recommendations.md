# SwiftHire Proposal-Focused Market Readiness Recommendations

Date: 2026-05-09  
Purpose: complete the approved proposal as a market-ready product without adding unrelated features.

## 1. Guiding Rule

Do not expand SwiftHire beyond the approved proposal yet. The goal is not to add random SaaS features. The goal is to make the proposed recruitment automation product complete, defensible, and reliable.

The proposal promises:

1. Hiring prompt processing.
2. Candidate registration.
3. Resume scoring and ranking.
4. Interview windows.
5. Auto-scheduled interviews.
6. Automated email notifications.
7. Basic and advanced search.
8. Application status tracking/progress history.
9. Admin user/account management.
10. Graphical statistics/reports such as average ATS score.

The instructor's red-ink additions also point to:

1. Reviews for employer and employee.
2. Email reminders.
3. Two-way matching between candidate and employer.
4. Candidate, employer, job posting, and admin-focused flows.

## 2. Required Additions to Complete the Proposal

### 2.1 Full Application Lifecycle and History

Add a real application tracking model instead of relying only on interview status.

Recommended entities:

- `Application`
- `ApplicationStatusHistory`

Recommended application statuses:

- `RECOMMENDED`
- `SHORTLISTED`
- `SCHEDULED`
- `CONFIRMED`
- `COMPLETED`
- `REVIEWED`
- `HIRED`
- `REJECTED`

Required UI:

- Employer can view each candidate's progress for a job.
- Candidate can view their own application/interview progress.
- Admin can inspect application progress for audit/reporting.

This directly completes:

- "Ability to track the status changes of an application."
- "Recruiters can view the application progress history."

### 2.2 Real Advanced Search

The proposal explicitly says "Search: Basic + Advanced." Prompt matching alone is not enough for a market-ready version.

Employer-side candidate filters:

- skills
- ATS score range
- years of experience
- location
- shift
- rating
- application status
- availability/interview status

Candidate-side job filters:

- required skill
- match score range
- location
- shift
- employer rating
- job status

Admin-side filters:

- role
- account status
- rating
- registration date
- job count
- application/interview status

Required UI:

- Filter bar above recommended candidates.
- Filter bar above candidate job postings.
- Clear active filters.
- Empty state when no records match.

This completes:

- Basic search.
- Advanced search.
- Recruiter filtering by predefined criteria.

### 2.3 Prompt History and Prompt Explainability

A market-ready prompt feature must be auditable and understandable.

Required backend:

- Save every raw hiring prompt.
- Store parsed skills, location, shift, experience, and linked job posting.
- Link prompt to employer.

Required UI:

- Show employer a parsed summary:
  - skills detected
  - experience detected
  - location detected
  - shift detected
- Allow employer to edit parsed values before final matching.
- Show prompt history in employer job details.

This completes:

- Hiring prompt processing.
- Prompt-driven candidate sourcing.
- Reduction of manual searching.

### 2.4 Better ATS Scoring and Ranking

The current ATS score should become explainable and more complete.

Recommended score components:

- skill match percentage
- experience match percentage
- location match
- shift match
- work type match
- rating bonus

Required UI:

- Show overall ATS score.
- Show score breakdown for each candidate.
- Show why candidate ranked higher or lower.

Example:

```text
Overall ATS Score: 82%
Skills: 60/70
Experience: 10/15
Location: 5/5
Shift: 5/5
Rating Bonus: 2/5
```

Required reports:

- average ATS score per job
- average ATS score across platform
- top-ranked candidates per job
- candidates below threshold

This completes:

- "Ability to score and rank resumes."
- "Statistics such as average ATS score."

### 2.5 Auto-Scheduling Hardening

Auto-scheduling is central to the proposal. It should be reliable and secure.

Required backend validation:

- Employer owns the job.
- Candidate IDs belong to shortlisted/recommended candidates for that job.
- Candidate list is not empty.
- Interview window is in the future.
- Window has enough time.
- Employer has no overlapping interview.
- Candidate has no overlapping interview with any employer.
- Schedule is saved only after all validation passes.

Required UI:

- Schedule preview before confirmation.
- Clear conflict messages.
- Clear slot duration and total time required.
- Show scheduled candidates after confirmation.

This completes:

- "Ability to set interview windows."
- "Ability to auto-schedule interviews."
- "Interviews are auto-scheduled for top-ranked profiles."

### 2.6 Reliable Email Notifications and Reminders

Keep emails limited to proposal-related recruitment events.

Required email types:

- signup verification
- interview invitation
- interview reminder
- interview confirmed/cancelled
- candidate hired
- candidate rejected, if rejection is added to application lifecycle

Required reminder types:

- 7 days before interview
- 3 days before interview
- 1 day before interview

Required notification log states:

- `PENDING`
- `SENT`
- `FAILED`
- `RETRYING`

Important requirement:

- Do not mark an email as `SENT` until actual delivery succeeds.

Required admin view:

- notification logs
- failed emails
- retry status

This completes:

- "Ability to send automated email notifications."
- Red-ink "email reminders."

### 2.7 Two-Way Reviews

The instructor added reviews, so this should be completed properly.

Required behavior:

- Employer can rate candidate only after a completed interview.
- Candidate can rate employer only after a completed interview.
- A user can rate only once per interview.
- Only actual interview participants can review.
- Ratings update average score.

Required UI:

- Employer rating form.
- Candidate rating form.
- Average rating on candidate profile.
- Average rating on employer/company profile.
- Admin can view review history.

This completes:

- Red-ink "reviews: employer + employee."

### 2.8 Admin Completion

Admin management must be product-grade because it is explicitly in the proposal.

Required admin capabilities:

- view candidates
- view employers
- search users
- filter users
- approve/block/deactivate users
- preserve audit logs
- view reports
- export reports
- view notification logs
- view application/interview history

Important correction:

- Prefer soft delete over permanent delete.
- Do not erase audit history when deleting/deactivating a user.

This completes:

- "Ability to manage system users and accounts."

### 2.9 Graphical Reports and Statistics

Reports must be more than static dashboard cards.

Required reports:

- average ATS score
- candidate ranking report
- interviews scheduled
- interviews completed
- hired candidates
- application status breakdown
- employer ratings
- candidate ratings
- user/account status report
- notification success/failure report

Required filters:

- date range
- employer
- job
- candidate
- application status
- account role

Required export:

- CSV export
- report history

This completes:

- "Statistics (Graphical Report) for various indicators such as Average ATS Score."

## 3. Market-Ready Hardening Needed for Proposal Features

These are not extra features. They are required to make the proposed features reliable.

### 3.1 Backend Ownership and Permission Checks

Add ownership checks everywhere.

Required checks:

- Employer cannot modify another employer's job.
- Employer cannot view another employer's recommended candidates.
- Employer cannot schedule interviews for another employer's job.
- Candidate cannot view another candidate's slot details.
- Candidate cannot rate an employer unless they attended that interview.
- Employer cannot rate a candidate unless they conducted that interview.
- Admin-only endpoints must stay admin-only.

This protects:

- job posting
- scheduling
- reviews
- application history
- reports

### 3.2 Data Validation

Required validation:

- prompt cannot be empty
- unknown prompt should return useful message
- CV must be valid PDF
- file size limit enforced
- interview window must be future date/time
- schedule cannot exceed available window
- rating must be 1-5
- review comment length limit
- report date range must be valid
- filters must have valid values

### 3.3 Testing

Minimum required tests:

- auth tests
- prompt parsing tests
- CV parsing tests
- ATS scoring tests
- job ownership tests
- scheduling conflict tests
- review ownership tests
- reminder scheduling tests
- report filter tests
- admin permission tests

At least one end-to-end test should cover:

```text
candidate signup/profile/CV
employer prompt
ranked candidates
schedule interview
confirm interview
complete interview
review
hire
admin report
```

### 3.4 Seeded Demo and Production Data

Prepare realistic data:

- verified candidates
- parsed CV skills
- employers
- jobs
- match scores
- scheduled interviews
- completed interviews
- reviews
- reports
- notification logs

This is necessary for a stable demo and for market-like testing.

### 3.5 Secret and Configuration Cleanup

Required:

- remove real-looking secrets from committed config
- use environment variables
- rotate exposed credentials
- keep placeholders in `.env.example`
- keep production config separate from development config

## 4. What Not to Add Yet

These are outside the approved proposal and should not be prioritized now:

- payment system
- subscriptions
- recruiter CRM
- public job board
- AI chatbot
- resume builder
- video interview platform
- mobile app
- company branding pages
- third-party job scraping
- social login

These may be useful later, but they do not help complete the approved proposal.

## 5. Best Implementation Priority

If time is limited, implement in this order:

1. Backend ownership and permission checks.
2. Full application lifecycle/history.
3. Advanced search filters.
4. Prompt history and parsed prompt explanation.
5. ATS score breakdown.
6. Average ATS score reports.
7. Reliable reminders and notification logs.
8. Two-way review ownership hardening.
9. Admin report filters and audit preservation.
10. Automated tests.

## 6. Final Product Definition

SwiftHire is market-ready for the approved proposal only when this workflow is complete:

1. Candidate registers and verifies account.
2. Candidate uploads CV.
3. System extracts skills from CV.
4. Candidate sets preferences.
5. Employer registers and manages company profile.
6. Employer enters hiring prompt.
7. System stores prompt and parses requirements.
8. System scores and ranks candidates.
9. Employer searches/filters ranked candidates.
10. Employer shortlists candidates.
11. System tracks application progress.
12. Employer sets interview window.
13. System auto-schedules interviews.
14. System sends invitation emails.
15. System sends reminder emails.
16. Candidate confirms/cancels interview.
17. Employer completes interview.
18. Candidate and employer review each other.
19. Employer hires or rejects candidate.
20. Admin manages users and views reports.
21. Admin can see average ATS score and other graphical statistics.

If every step above works reliably, the app matches the proposal and is product-ready without unnecessary add-ons.
