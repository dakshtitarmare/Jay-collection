# J Collection

Private, mobile-first customer and garment-measurement management application for J Collection.

## Local development

Requirements: Node.js 20.19+ or 22.13+ and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts the frontend and `/api/*` Vercel functions together. There is no second terminal command.

Available checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Test locally

### 1. Configure Firebase

In Firebase Console:

1. Enable **Authentication → Sign-in method → Email/Password**.
2. Create the owner account and copy its Firebase Auth UID.
3. Create or select a Realtime Database.
4. Copy the Firebase Web App configuration into the `VITE_FIREBASE_*` variables below.
5. Copy the owner UID into `J_COLLECTION_OWNER_UID`.

Create a local `.env.local` file in the project root. Do not commit it:

```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_APP_ID=your_web_app_id

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
J_COLLECTION_OWNER_UID=owner_auth_uid

GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

The local service-account JSON under `.env/` is server-only. Never put its contents in a `VITE_*` variable or commit it. The Firebase service-account email must have Editor access to the `Customers` and `MeasurementHistory` tabs in the Google Sheet.

### 2. Start the app locally

The local command uses Vercel's runtime so `/api/*` functions work as well:

```bash
npm run dev
```

Accept the default local project settings when prompted. Open the URL it prints, usually `http://localhost:3000`. If prompted, accept the default local project settings.

In another terminal, verify the public API:

```bash
curl -i http://localhost:3000/api/health
```

It should return HTTP `200` with `"ok": true`. Do not test private endpoints with a browser URL alone; they require a Firebase ID token, which the signed-in frontend sends automatically.

### 3. Manual end-to-end test

1. Open the local URL and sign in with the Firebase owner account.
2. Open **Customers → Add customer**.
3. Create a customer with a mobile number, name, optional email, age, and notes.
4. Confirm the customer appears in the directory.
5. Search using the full or formatted mobile number.
6. Open the profile and add measurements, height, weight, and a reason.
7. Confirm current measurements and the immutable history record appear.
8. Confirm the customer row is present/updated in the `Customers` Sheet tab.
9. Confirm the history row is present in `MeasurementHistory`.
10. Use **Settings → Export customer data** and verify the downloaded JSON.
11. Sign out and confirm protected routes return to the sign-in screen.

If a Firebase or Sheets variable is missing, the UI/API should show an error or `backupStatus: "pending"`; never treat an unverified backup as successful.

## Environment

Copy `.env.example` to `.env.local` when Firebase integration is implemented. Only Firebase Web SDK configuration belongs in `VITE_*` variables. Firebase Admin credentials must remain server-side and must never be committed.

## Current implementation status

Phases 1, 2, 4, and 6 provide the Vite, React, TypeScript, Tailwind CSS, routing, test, lint, and build foundation; Firebase email/password authentication; authenticated customer APIs; and mobile-first customer directory, profile, add-customer, and measurement-history screens.

Export, Firebase rules/indexes, and deployment configuration are now included. Backup reconciliation remains a production follow-up.

## Server configuration

The API reads Firebase Admin configuration only from server-side environment variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`
- `J_COLLECTION_OWNER_UID`

The service-account JSON file in the local `.env/` directory is ignored and must never be imported by frontend code or committed. For Vercel, configure the equivalent values in Project Settings → Environment Variables. `FIREBASE_PRIVATE_KEY` must preserve newlines or use escaped `\n` sequences.

`GET /api/health` is public. All customer endpoints will require `Authorization: Bearer <Firebase ID token>` and owner UID authorization.

## Customer data and Google Sheets

Realtime Database is the operational source for fast search and atomic measurement-history updates. Google Sheets is a server-side backup projection:

- Configure `GOOGLE_SHEETS_SPREADSHEET_ID`. The app creates the `Customers` and `MeasurementHistory` tabs automatically if they do not exist.
- Share the spreadsheet with the service-account email as an editor.
- Use a `Customers` tab with the columns in `server/sheetsBackup.ts`.
- Use a `MeasurementHistory` tab with the columns in `server/sheetsBackup.ts`.
- The app updates the customer row by `customerId` and appends every measurement history record.
- Realtime Database also maintains `customerByMobile/{normalizedMobile}` as the fast lookup index; the mobile number remains a customer lookup key without exposing it in client-side database access.
- Mobile duplicate checks use `customerByMobile` directly and do not query `/customers` by mobile. Existing records created before this index existed should be re-saved or migrated once to populate the lookup entries.

If Google Sheets is unavailable, the API returns `backupStatus: "pending"` after the Realtime Database write and logs only the failure state—not customer values. A later reconciliation job should retry pending backups before production launch.

## Export, Firebase rules, and deployment

- `GET /api/export?format=json` produces an owner-authorized JSON export.
- `database.rules.json` denies direct browser access because all database access goes through the Admin SDK API.
- `database.indexes.json` documents the Realtime Database query indexes. The `.indexOn` entries must also be deployed as part of the database rules:

```bash
npx firebase-tools login
npx firebase-tools use your-firebase-project-id
npx firebase-tools deploy --only database
```

Alternatively, copy the contents of `database.rules.json` into Firebase Console → Realtime Database → Rules and publish them. The Firebase Admin SDK still requires these indexes for `orderByChild("mobile")`, `orderByChild("nameLower")`, and history ordering.
- `vercel.json` sends non-API paths to the SPA entry point while preserving `/api/*`.
- Configure all `.env.example` variables in Vercel Preview and Production environments.
- Deploy first against a non-production Firebase project and verify sign-in, customer creation, measurement history, export, and direct database denial.

## Product documentation

The requirements and architecture baseline is in [`docs/`](./docs/), including the PRD, wireframes, database/API design, deployment guide, and phased implementation prompt.
