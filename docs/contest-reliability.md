# Contest reliability: first implementation pass

## Student behaviour

- Answers autosave after an editing pause, with periodic saves during continuous typing.
- Only changed answers are sent during autosave; submission sends the complete local answer set.
- Unsynced drafts are stored per attempt in browser storage when available.
- Refresh recovers the server copy and compatible unsynced local changes.
- Concurrent sessions cannot overwrite newer saved answers. A conflict offers recovery from the server.
- Failed requests retry. A lost acknowledgement is reconciled against the server before another write.
- The countdown uses server time plus a monotonic browser clock, not the student's device date.
- The server rejects saves at or after the attempt deadline. Late submission grades only previously saved answers.
- A submission receipt is shown only after the server confirms completion.
- A returning student with an expired, open attempt triggers submission of saved answers.
- Refresh does not count as switching tabs. The existing three-warning auto-submit rule remains; browser-only monitoring is not secure proctoring.
- Question and option props sent to the browser exclude answer keys and explanations.
- Contest pages and API reads bypass the PWA response cache. Reconnecting does not force a page reload.
- Questions with missing answer keys, and free-text questions, remain ungraded. Partial scores are labelled provisional.

## Implementation

### Teacher workspace

- `/teacher/dashboard` now shows teacher-owned course and test-series counts, active contest attempts,
  upcoming published contests, pending contest reviews, and recently edited content.
- Teacher mode opens the dashboard; desktop and mobile navigation include teacher destinations.
- Contest setup and submissions are separate routes with shared navigation.
- Submissions are paginated at 20 students, with status filters and exact email / partial student-ID lookup.
- Student details load only for the current page; list queries do not fetch answer text.
- Individual reviews preserve the list's filters/page when returning and show provisional grading accurately.
- Layout, list and detail reads enforce ownership; provider failures have retry/fallback states.
- `npm run test:submissions` checks query boundaries and pagination using doubles.
- `npm run test:submissions:browser` checks teacher UI flows using isolated fixture data.

No database migration is required. The existing attempt timestamp acts as an optimistic version.
Saves and submissions lock the same PostgreSQL attempt row inside a short transaction.
Answer writes are batched, and duplicate submissions return the existing completion status.
Concurrent starts use insert-on-conflict behaviour without extending an existing attempt's deadline.

## Verification

```sh
npm run test:contests
npm run test:contests:browser
npm run build
```

The browser script uses installed Microsoft Edge in headless mode. It serves the actual student
component through an isolated local fixture with mocked APIs; it does not access production data.
Screenshots are generated under `coverage/contest-browser/`.
The service tests use a transactional database double. They do not establish PostgreSQL throughput
or prove real database locking under load.

## Before a wider rollout

- Deploy between contests: the new client sends an attempt version required by the write endpoints.
- Test authenticated start, save, resume and submit against a dedicated staging database.
- Exercise simultaneous starts and submissions plus intermittent connectivity at the intended student count.
- Measure failed requests, database connection usage, transaction latency and submission completion.
- Verify pooling and hosting configuration against production logs; the previous crash cause is not yet established.
- Add a scheduled expiry worker: an abandoned attempt currently finalizes when its student returns, not while all browsers are closed.
- Freeze published question versions and guard live contest edits before allowing unrestricted question reuse.
- Add explicit manual grading/result publication workflows.

Do not treat passing fixture tests as a production capacity guarantee.
