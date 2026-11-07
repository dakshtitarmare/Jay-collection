# J Collection — GitHub Copilot Implementation Prompt

**Purpose:** Give this prompt to GitHub Copilot Chat / Agent after adding the four project specification documents to the repository.

## 1. Master prompt

You are acting as a senior full-stack engineer implementing a production-minded MVP for **J Collection**, a clothing business in Nagpur, India.

The product is a private, mobile-first customer and garment-measurement management application. The business owner primarily uses an Android phone but may also use a desktop browser. Both devices must access the same cloud data.

### Source of truth

Read these documents completely before writing code:

1. `docs/01_PRD_J_Collection.md`
2. `docs/02_Wireframes_J_Collection.md`
3. `docs/03_Screen_Flow_and_DB_Design.md`
4. `docs/04_Deployment_Integration_Guide.md`

Treat these documents as the requirements baseline. If they conflict, stop and report the conflict rather than silently inventing a requirement.

### Required technology

- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS (unless the existing repository already uses a consistent alternative). 
- Routing: React Router.
- Authentication: Firebase Authentication Web SDK.
- Backend: Node.js API functions deployed on Vercel from the `api/` directory.
- Database: Firebase Realtime Database.
- Server database access: Firebase Admin SDK only.
- Source control: GitHub.
- App experience: responsive PWA-ready web application. Do not build React Native unless the product owner explicitly changes the scope.

### Core product behavior

1. Only the authorized J Collection owner can access private customer data.
2. Customer fields: name, mobile, optional age, optional notes, status, created timestamp, updated timestamp.
3. Shirt measurements should use the exact agreed fields in the PRD and be extensible for future garment types.
4. The app must support create, list, search, profile, edit, archive, and measurement history.
5. Every measurement update must create a new immutable history snapshot.
6. The current measurement values and the new history record must be committed atomically.
7. Timestamps must be generated server-side and stored consistently in UTC; display in `Asia/Kolkata`.
8. Search must not download the entire database without bounds. Use the documented indexing/query strategy and explain any limitation of Realtime Database search.
9. Provide useful loading, empty, validation, success, and failure states.
10. The interface must work at narrow mobile widths and desktop widths.

### Security requirements — non-negotiable

- Never put Firebase Admin service-account credentials in frontend code or any `VITE_` variable.
- Never commit `.env`, private keys, service-account JSON, or production secrets.
- Verify Firebase ID tokens in every private API endpoint.
- Enforce an owner UID allowlist or securely managed role/custom claim on the server.
- Do not trust owner UID, timestamps, or privileged fields from request bodies.
- Validate and sanitize all inputs on the server, not only in the browser.
- Return 401 for missing/invalid authentication and 403 for authenticated but unauthorized users.
- Do not expose stack traces, secrets, or customer personal data in logs.
- If the architecture uses only the Node API for database access, configure Realtime Database client rules to deny direct client reads/writes. Remember that Admin SDK bypasses RTDB rules, so API authorization is mandatory.
- Do not add public demo credentials or a public customer dataset.

### Engineering requirements

- Use strict TypeScript where practical.
- Keep components small and feature-oriented.
- Separate UI, API client, validation schemas, and Firebase initialization.
- Use typed request/response models.
- Avoid `any` unless justified.
- Add comments for non-obvious logic, not comments that merely repeat code.
- Handle API errors consistently.
- Prevent duplicate form submissions.
- Add tests for validation, authorization helpers, and measurement-history update behavior.
- Add `.env.example` containing variable names only and safe placeholders.
- Update README with local setup, Firebase setup, environment variables, tests, and Vercel deployment.
- Do not introduce extra paid services or unnecessary infrastructure.
- Do not claim that the service is permanently free; document free-tier limits and usage monitoring.

## 2. Required workflow: implement in phases

Do not attempt to generate the entire application in one response. Work in the phases below. At the beginning of each phase, inspect the repository and report what already exists. Preserve working code.

### Phase 0 — Repository inspection and plan

- Inspect files, package manager, existing app structure, and current Git status.
- Read all four specification documents.
- Identify missing requirements, conflicts, and technical risks.
- Propose a file-by-file implementation plan.
- Do not modify files until the plan is presented and approved.

### Phase 1 — Project foundation

- Set up or verify React, Vite, TypeScript, Tailwind, and React Router.
- Establish lint, formatting, typecheck, and test commands.
- Create the feature-oriented directory structure.
- Add `.gitignore` and `.env.example`.
- Add a basic responsive app shell and route placeholders.
- Run build and typecheck.

### Phase 2 — Firebase client authentication

- Configure Firebase Web SDK using `VITE_FIREBASE_*` public web configuration only.
- Implement sign-in, sign-out, auth-state handling, protected routes, and session loading.
- Do not build custom password storage.
- Ensure signed-out users cannot access app screens.
- Add tests or a clear manual test plan.

### Phase 3 — Secure Node API foundation

- Create Vercel Node.js API handlers under `api/`.
- Initialize Firebase Admin SDK server-side only.
- Implement reusable bearer-token verification and owner authorization middleware/helper.
- Implement consistent JSON success/error responses.
- Add `/api/health`.
- Validate method, body size, and request data.
- Confirm Admin credentials are never included in the client bundle.
- Test missing token, invalid token, and unauthorized UID cases.

### Phase 4 — Database schema and customer APIs

Implement:
- `GET /api/customers`
- `GET /api/customers/search`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `POST /api/customers/:id/archive`

Requirements:
- Stable generated IDs.
- Server timestamps.
- Normalized mobile number.
- `nameLower` for documented prefix search.
- Bounded list results and pagination/cursor behavior.
- Duplicate mobile-number behavior must follow the PRD's client-confirmation decision. If not confirmed, do not silently enforce uniqueness; report the decision needed.
- Never accept a database path or owner UID from the client as an authorization shortcut.

### Phase 5 — Measurement APIs and history

Implement:
- `POST /api/customers/:id/measurements`
- `GET /api/customers/:id/measurements`

The POST endpoint must:
1. Authenticate and authorize the owner.
2. Validate customer existence and active status.
3. Validate garment type, unit, allowed measurement keys, and numeric values.
4. Generate history ID and timestamp server-side.
5. Atomically update current measurements and append a history snapshot.
6. Return success only after the database confirms the operation.

History records are immutable through ordinary application endpoints. A correction creates a new snapshot with a reason.

Write tests for:
- Valid measurement update.
- Invalid numeric values.
- Unsupported measurement keys.
- Missing customer.
- Unauthorized request.
- Atomic update behavior or a reliable integration test against the Firebase Emulator.

### Phase 6 — Frontend customer experience

Build screens in this order:
1. Dashboard.
2. Customer directory and search.
3. Add customer form.
4. Customer profile.
5. Edit customer details.
6. Update measurements.
7. Measurement history.
8. Settings and export entry point.

Use the wireframes as structural guidance. Ensure:
- Responsive mobile-first layouts.
- Numeric input support for measurements.
- Unit labels remain visible.
- Form validation and clear errors.
- Save buttons disable while submitting.
- Success is shown only after API success.
- Customer list does not load every history record.
- Dates display in `Asia/Kolkata`.

### Phase 7 — Export, quality, and accessibility

- Implement owner-authorized CSV or JSON export if included in MVP scope.
- Escape CSV values safely.
- Add accessibility labels, keyboard navigation, focus states, and sufficient contrast.
- Add loading, empty, and error states.
- Run tests, lint, typecheck, and production build.
- Review for exposed secrets and personal data in logs.

### Phase 8 — Deployment readiness

- Verify Vercel build/output configuration.
- Verify SPA deep-link routing does not swallow `/api/*`.
- Document all required Vercel environment variables.
- Ensure Preview and Production point to the intended Firebase projects.
- Provide a deployment checklist and smoke-test commands.
- Do not deploy or change production resources without explicit authorization.

## 3. API contract expectations

All private routes use:

`Authorization: Bearer <Firebase ID token>`

Use JSON request and response bodies. Return a consistent error shape, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Chest measurement must be a positive number."
  }
}
```

Do not include internal stack traces in API responses.

## 4. Required deliverables

At the end of implementation, provide:
- Working source code.
- `README.md` with setup and deployment steps.
- `.env.example` with placeholders only.
- Database schema documentation.
- API endpoint documentation.
- Tests and their results.
- Firebase rules/indexes files where applicable.
- Vercel configuration.
- A list of unresolved client decisions.
- A security checklist.
- A manual end-to-end test plan.

## 5. How Copilot must communicate

- Explain the purpose of each significant file before or while creating it.
- Work one phase at a time.
- Do not skip ahead.
- Do not invent customer requirements, measurement fields, credentials, Firebase project IDs, or deployment URLs.
- Ask one focused question when a missing client decision blocks implementation.
- If a requested feature conflicts with the architecture, explain the trade-off and propose the smallest safe change.
- After each phase, summarize changed files, commands run, test results, known issues, and the next phase.
- Do not state that something works unless it has been tested or clearly label it as unverified.

**Start with Phase 0 only. Inspect the repository and the four specification files, then return the implementation plan. Do not write application code yet.**

## 6. Short prompt for resuming a later phase

After a phase is complete, use:

> Continue with the next phase in `docs/05_GitHub_Copilot_Implementation_Prompt.md`. First inspect the current repository state and previous phase results. Preserve existing working code. Implement only the next phase, run its relevant checks, and report changed files, test results, risks, and any client decisions required. Do not skip phases or invent requirements.
