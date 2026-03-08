# Software Engineering Principles — Swift Hire

These principles govern every design and implementation decision in this project.
Claude Code must consult this file when making architectural or code-level choices.

---

## 1. Modularity
**Definition:** The system is divided into independent, interchangeable units with well-defined boundaries.

**In Swift Hire:**
- Backend is split into packages: `auth`, `candidate`, `employer`, `job`, `scheduling`, `automation`, `review`, `analytics`, `admin`, `dictionary`, `common`. Each is independently buildable and testable.
- Frontend is split into `pages/`, `components/`, `api/`, `context/`. Pages never call each other directly.
- Never put business logic in a Controller. Controllers call Services; Services call Repositories.
- Never import one feature package into another directly — use shared `common/` or pass data via DTOs.

---

## 2. Separation of Concerns (SoC)
**Definition:** Each module addresses a distinct concern and does not bleed into another's responsibility.

**In Swift Hire:**
- `CvParserService` only parses — it does not save to DB (that's `CandidateService`).
- `PromptEngineService` only parses prompts — it does not run ATS (that's `AtsScoreService`).
- `EmailService` only sends emails — it does not decide when to send (that's `ReminderScheduler`).
- `AuthService` handles authentication only — it does not touch candidate/employer profile data.
- React pages handle UI state only — all HTTP calls go through the `api/` layer, never directly with `fetch`.

---

## 3. Abstraction
**Definition:** Hide implementation details behind clean interfaces. Expose only what is necessary.

**In Swift Hire:**
- `ApiResponse<T>` abstracts all HTTP responses — callers never build raw response maps.
- `KnownSkillsDictionary` abstracts the matching vocabulary — parser logic does not hardcode skill names.
- The `api/` layer in React (e.g., `candidateApi.js`) abstracts all Axios calls — pages never import `axios` directly.
- Repositories abstract DB queries — Services never write raw SQL (use JPQL or method naming).

---

## 4. Refinement (Stepwise Refinement)
**Definition:** Start with high-level design and progressively fill in detail. Never over-engineer the first pass.

**In Swift Hire:**
- Week 1–2: Entities + Auth skeleton (no business logic yet).
- Week 3–4: Core algorithms (Parser, ATS) with basic implementation, then optimise.
- Week 5–6: Automation layer built on top of a working scheduler.
- Never jump to implementing edge cases before the happy path works end-to-end.
- Mark unfinished methods with `// TODO(BEX): description` — never delete a stub silently.

---

## 5. Rigor and Formality
**Definition:** Be precise. Use defined contracts (DTOs, API specs, error codes) not vague assumptions.

**In Swift Hire:**
- Every API response uses `ApiResponse<T>` — never return raw objects or raw strings.
- Every UC has defined pre/post conditions (from D1) — implementation must satisfy them exactly.
- Error messages must match the exact wording from the UCs (e.g., "Prompt cannot be empty.", "You have already rated this candidate for this interview.").
- Validation annotations (`@NotBlank`, `@Email`, `@Pattern`) are the formal contract for input — never skip them.
- NFR benchmarks are measurable targets (e.g., ≤3s, ≤5s) — not suggestions.

---

## 6. Anticipation of Change
**Definition:** Design so that likely future changes require minimal rework.

**In Swift Hire:**
- `KnownSkillsDictionary` is a DB table, not a hardcoded list — new skills are added via data, not code changes.
- `application.properties` uses environment variables (`${DB_USERNAME}`, `${JWT_SECRET}`) — switching environments requires no code change.
- `ApiResponse<T>` is generic — adding new fields to responses doesn't break existing callers.
- Role enum (`CANDIDATE`, `EMPLOYER`, `ADMIN`) is in one place — adding a new role is a single-point change.
- The ATS scoring formula is isolated in `AtsScoreService.calculateMatch()` — tuning the algorithm touches one method.

---

## 7. Incrementality
**Definition:** Build and deliver in small, working increments. Each increment adds value and is testable.

**In Swift Hire:**
- Week-by-week delivery (see execution plan): each week produces runnable, integrated features.
- Never merge a feature that breaks an existing working endpoint.
- Frontend integration happens only after the backend endpoint is confirmed working (test with Postman first).
- DB schema uses `ddl-auto=update` during development — schema evolves incrementally without dropping data.

---

## 8. Generality
**Definition:** Solve the general problem, not just the specific case in front of you — but only when it adds real value.

**In Swift Hire:**
- `EmailService.send()` is a private general method used by both invitation and reminder emails — not duplicated.
- `AtsScoreService.parseTags()` is a reusable utility for splitting comma-separated skill strings — used in both scoring and matching.
- `GlobalExceptionHandler` handles all exception types in one place — not scattered across controllers.
- Do NOT over-generalise: don't build a plugin system when a simple method works fine.

---

## 9. Correctness
**Definition:** The system must do exactly what the specification (UCs + NFRs) requires. No more, no less.

**In Swift Hire:**
- Every UC alternate flow must be handled: empty prompt, no candidates found, already rated, insufficient time window, etc.
- NFR constraints are hard requirements: PDF only, ≤10MB, BCrypt, JWT, 5-attempt lockout, ≥85% ATS precision.
- Unit test each service method against its UC pre/post conditions.
- Never mark a UC as "done" until both the happy path AND all alternate flows are implemented and tested.

---

## 10. Robustness
**Definition:** The system behaves sensibly under abnormal conditions — bad input, service failures, edge cases.

**In Swift Hire:**
- `CvParserService.validatePdf()` rejects non-PDF and oversized files before PDFBox runs.
- `EmailService` uses `@Retryable(maxAttempts=3)` — SMTP failures don't crash the scheduling flow.
- `GlobalExceptionHandler` catches all unhandled exceptions and returns a clean `ApiResponse` — never expose stack traces to the client.
- `ReminderScheduler` checks `reminderSentXd` flags before sending — idempotent, safe to re-run.
- `ScheduleService` validates the time window before allocating slots — no silent overflow.

---

## 11. Coupling
**Definition:** Minimise dependencies between modules. A change in one should not ripple through others.

**Types to aim for:** Data coupling (pass simple data) > Stamp coupling (pass objects) >> Control coupling (pass flags that change behaviour) >> Content coupling (access internals directly) ❌

**In Swift Hire:**
- Controllers are coupled to Services only — never to Repositories directly.
- Services are coupled to Repositories and other Services via constructor injection (not field injection).
- `EmailService` knows nothing about `InterviewSlot` internals — it receives only primitive email/name/time/link parameters.
- Frontend API modules are coupled to the axios instance only — pages are coupled to API modules only.
- Never use `@Autowired` field injection — always use constructor injection (`@RequiredArgsConstructor`).

---

## 12. Cohesion
**Definition:** Every module should have one clear reason to exist. All its parts should work toward a single purpose.

**Aim for:** Functional cohesion (best) > Sequential > Communicational > Procedural > Temporal > Logical > Coincidental (worst) ❌

**In Swift Hire:**
- `CvParserService`: one job — parse a PDF into skills. (Functional cohesion ✅)
- `PromptEngineService`: one job — parse a text prompt into structured tags. (Functional cohesion ✅)
- `ReminderScheduler`: one job — check and send timed email reminders. (Functional cohesion ✅)
- `AuthService`: one job — authenticate users and manage sessions. (Functional cohesion ✅)
- If a service grows beyond ~200 lines, ask: "Is it doing two things?" If yes, split it.

---

## Quick Checklist (apply before every code change)

- [ ] Does this change violate any module boundary? (Modularity, SoC)
- [ ] Am I exposing internals that should be hidden? (Abstraction)
- [ ] Does the error message match the exact UC wording? (Rigor)
- [ ] Is this hardcoded where it should be configurable? (Anticipation of Change)
- [ ] Does this handle the alternate flows from the UC? (Correctness)
- [ ] Does this fail gracefully on bad input or service outage? (Robustness)
- [ ] Am I creating a new dependency that wasn't necessary? (Coupling)
- [ ] Is this method doing more than one thing? (Cohesion)
- [ ] Am I adding something not asked for? (Incrementality — STOP if yes)
