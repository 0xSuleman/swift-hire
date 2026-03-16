# CLAUDE.md — Swift Hire Project Instructions

This file is automatically read by Claude Code at the start of every session.
It contains hard rules to follow and a running log of past mistakes to never repeat.

---

## Hard Rules

1. Always read a file before modifying it.
2. Never guess file paths — verify with Glob or the known project structure.
3. Never add unrequested features, extra error handling, or "improvements" beyond the task.
4. Never create new files if editing an existing one is sufficient.
5. Always follow the SE principles defined in `se-principles.md`.
6. Always align implementation with the 17 UCs and NFRs from Deliverable-1.
7. MySQL is the database — do not suggest or switch to another.
8. No external AI APIs — all NLP/matching is custom Regex + KnownSkillsDictionary.
9. Backend package root is `com.swifthire`. Never change this.
10. Frontend runs on Vite (port 5173), proxied to Spring Boot (port 8080).

---

## Mistake Log

> Format: [Date] — What went wrong — How to avoid it

- [2026-03-08] — Used `@Retryable` in `EmailService` without adding `spring-retry` dependency
  to `pom.xml`. Always check that every annotation/library used has its dependency declared.

- [2026-03-08] — Lombok annotations (@Getter, @Builder etc.) silently don't generate methods
  unless `annotationProcessorPaths` is explicitly added to maven-compiler-plugin. Always include
  this in pom.xml when using Lombok.

- [2026-03-08] — PDFBox 3.x changed `PDDocument.load(InputStream)` to `Loader.loadPDF(byte[])`.
  Always verify library API versions match the version declared in pom.xml before using them.

- [2026-03-08] — `Map.of()` with mixed value types (Long, String, double) infers a complex
  intersection type that is incompatible with `Map<String, Object>`. Always use `LinkedHashMap`
  with explicit `put()` calls when building maps with mixed types.

- [2026-03-08] — Maven on macOS defaults to the Homebrew JDK (Java 25), not the project's
  target Java 17. Always run: `JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn <command>`

- [2026-03-08] — `ScheduleController.getMyInterviews()` was left as a TODO stub without
  noting it clearly. Always mark incomplete methods with `// TODO(BE4):` and the responsible
  team member so nothing silently fails at runtime.

- [2026-03-08] — `AdminService.generateReport()` returns a placeholder map. Must be
  implemented by BE1 before integration testing.

- [2026-03-12] — `String.matches()` in Java requires the ENTIRE string to match the regex.
  Multi-line PDF text always returned empty skills because `.` doesn't match `\n`.
  Always use `Pattern.compile(..., CASE_INSENSITIVE).matcher(text).find()` for substring search.

- [2026-03-12] — `InterviewWindow` was created in-memory and passed to `ScheduleService`
  without being persisted. Always save JPA entities before referencing them in child entities.

- [2026-03-12] — A stale JWT after a backend restart causes Spring Security to return 403
  with its own error format (no `message` field), not our `ApiResponse`. Frontend fallback
  shows generic message. Fix: always log out and back in after a backend restart during testing.

- [2026-03-16] — React 18 StrictMode mounts effects TWICE in development. Any `useEffect`
  that fires a non-idempotent API call (e.g. a one-shot token consumption endpoint) will be
  called twice: the first call succeeds and clears state (token nulled), the second call fails.
  Fix: make the backend endpoint idempotent — detect "already done" and return success instead
  of throwing. Never clear state that the endpoint uses to identify the resource before confirming
  both calls are handled.
