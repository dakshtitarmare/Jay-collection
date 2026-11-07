# J Collection — Deployment and Live Integration Guide

**Version:** 1.1  
**Recommended deployment:** React + Vite frontend and Node.js API routes in one Vercel project; Firebase Authentication and Realtime Database as managed backend services.

## 1. Deployment architecture

```text
Owner's Android phone / Desktop browser
                |
              HTTPS
                |
                v
       Vercel project / domain
       +----------------------+
       | React + Vite static  |
       | frontend             |
       |                      |
       | /api/* Node functions|
       +----------+-----------+
                  |
          Firebase Admin SDK
                  |
       +----------+-----------+
       | Firebase project     |
       | Authentication       |
       | Realtime Database    |
       +----------------------+
```

The frontend and API can share one Vercel project and domain. The browser calls relative URLs such as `/api/customers`, avoiding most cross-origin configuration.

## 2. Technology choices

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| UI | Tailwind CSS or chosen component system |
| Routing | React Router |
| Forms | React Hook Form + schema validation |
| Client authentication | Firebase Web SDK |
| Backend | Node.js API functions (Vercel Functions) |
| Server database access | Firebase Admin SDK |
| Database | Firebase Realtime Database |
| Hosting | Vercel |
| Source control | GitHub |
| Optional PWA | Web app manifest + service worker |

A responsive PWA is a practical first release: installable from the browser on supported phones and usable on desktop. It is not the same as a native React Native app. If native device capabilities become necessary, build a separate native client against the same API.

## 3. Repository layout

```text
Jay-Collection/
├── api/
│   ├── health.ts
│   ├── customers/
│   │   ├── index.ts
│   │   ├── search.ts
│   │   └── [id].ts
│   └── customers/
│       └── [id]/
│           └── measurements.ts
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── customers/
│   │   └── measurements/
│   ├── lib/
│   │   ├── firebaseClient.ts
│   │   └── apiClient.ts
│   ├── pages/
│   └── main.tsx
├── public/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

Vercel supports serverless functions from the `api` directory. Use the currently supported Vercel Node.js function conventions and verify the framework/runtime configuration at implementation time.

## 4. Important distinction: Firebase client vs Admin SDK

### Frontend
- Uses Firebase Web SDK for sign-in.
- Receives a Firebase ID token after successful authentication.
- Sends the token in the `Authorization` header to the Node API.
- Does not contain service-account private keys.

### Backend
- Uses Firebase Admin SDK.
- Verifies ID tokens using `verifyIdToken`.
- Checks the authenticated UID against the authorized owner UID or secure role/claim.
- Performs database reads/writes.
- Returns only the data needed by the frontend.

Do not put Firebase Admin credentials in Vite variables. Any variable prefixed with `VITE_` is bundled into browser-accessible code.

## 5. Environment variables

### Frontend variables

Example `.env.example`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=
```

Firebase web configuration is designed to be used by client applications, but database access must still be protected by authentication and security rules. The API key is not a substitute for authorization.

### Vercel server-side variables

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=
J_COLLECTION_OWNER_UID=
```

- Add these in Vercel Project Settings → Environment Variables.
- Add them for the correct environments (Preview and Production as appropriate).
- Never commit real values to GitHub.
- For a private key stored with escaped newlines, convert `\\n` to actual newline characters in the server initialization code.
- Prefer a secure supported service-account or workload identity approach where available. If using a service-account key, restrict access and rotate it if exposed.

## 6. Authentication and request flow

1. Owner signs in through Firebase Authentication in the frontend.
2. Frontend obtains a fresh Firebase ID token.
3. Frontend calls `fetch('/api/customers', { headers: { Authorization: 'Bearer ' + token } })`.
4. Node API extracts the bearer token.
5. Firebase Admin SDK verifies token signature, issuer, audience, and expiry.
6. API checks that UID is authorized for J Collection.
7. API validates request data.
8. API reads/writes Realtime Database.
9. API returns JSON response.
10. Frontend updates UI only after confirmed success.

## 7. Example frontend API helper

```ts
// src/lib/apiClient.ts
import { getAuth } from "firebase/auth";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const token = await user.getIdToken();

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Request failed.");
  }

  return body as T;
}
```

This is an illustrative helper. Add typed error handling, token refresh/retry policy where appropriate, and avoid exposing sensitive server errors.

## 8. Example Vercel Node API handler

The exact handler shape should match the Vercel Node.js runtime and installed SDK versions. This simplified example demonstrates the security sequence:

```ts
// api/health.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  return res.status(200).json({
    ok: true,
    service: "Jay-Collection-api"
  });
}
```

Private handlers should:
- Reject unsupported HTTP methods.
- Require a bearer token.
- Verify it using Firebase Admin SDK.
- Check owner authorization.
- Validate all request fields.
- Return consistent JSON and status codes.

Do not copy a demo handler into production without implementing those checks.

## 9. Vercel configuration and deployment

Typical flow:
1. Push the repository to a private GitHub repository owned by or shared with the client.
2. Sign in to Vercel and import the repository.
3. Configure the project framework as Vite (or allow detection).
4. Set the build command, usually `npm run build`.
5. Set output directory to `dist`.
6. Add environment variables.
7. Deploy a Preview build.
8. Test authentication and API routes against a non-production Firebase project first.
9. Configure Production environment variables.
10. Deploy production and test the production domain.
11. Optionally attach a custom domain owned by the client.

Vercel automatically creates preview deployments for branches and production deployments from the configured production branch. Confirm the selected branch in Project Settings.

## 10. SPA routing

If using React Router, configure Vercel rewrites so client-side routes return the SPA entry point while `/api/*` continues to resolve to functions.

Example `vercel.json` (validate against current Vercel routing behavior before use):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

If this rewrite interferes with API routing in the selected project setup, use a more specific rewrite that excludes `/api`. Test direct navigation and refresh on routes such as `/customers/abc123`.

## 11. Firebase setup checklist

1. Create a Firebase project under the client's ownership where practical.
2. Register a Web app and copy its web configuration.
3. Enable the selected sign-in provider in Firebase Authentication.
4. Create Realtime Database in the appropriate region.
5. Decide the database schema and indexes before importing real customer records.
6. Configure client database rules to deny direct access if all data access is through the Node API.
7. Create server-side Admin SDK credentials using a secure supported method.
8. Add server variables to Vercel.
9. Configure authorized domains for Firebase Authentication.
10. Test unauthorized access and owner-only access.
11. Set up data export and backup procedures.

## 12. GitHub workflow

Recommended branches:
- `main`: production-ready code.
- `develop`: integration branch, if the team needs one.
- `feature/<short-name>`: individual feature work.

For each feature:
1. Create a feature branch.
2. Implement one scoped change.
3. Run lint, typecheck, tests, and build.
4. Review the diff and ensure no secrets are present.
5. Push and open a pull request.
6. Test the Vercel Preview deployment.
7. Merge only after checks pass.

Use GitHub secret scanning where available. If a service-account key is committed, removing it in a later commit is not enough: revoke/rotate the exposed credential immediately.

## 13. Testing before launch

### Functional
- Add, search, view, edit, archive customer.
- Update measurements and confirm history snapshot.
- Check date/time display in India Standard Time.
- Test duplicate mobile-number behavior.
- Test empty and invalid fields.

### Security
- No token → 401.
- Invalid/expired token → 401.
- Authenticated but unauthorized UID → 403.
- User cannot read another business's data.
- Admin credentials absent from browser bundle and Git history.
- Database direct client access denied if API-only architecture is selected.

### Deployment
- Refresh a nested frontend route.
- Confirm `/api/health` works.
- Confirm production environment variables are set.
- Confirm preview and production use intended Firebase projects.
- Test on a real Android phone and desktop browser.

## 14. Operational cost and limits

Vercel and Firebase have separate plans, quotas, and terms. Do not promise permanent zero cost. Check current pricing before launch and monitor:
- Firebase database storage and downloads.
- Vercel function invocations, duration, and bandwidth.
- Authentication and any optional services.
- Backup storage.

The expected 200–300 business actions per day is a modest starting workload, but actual database downloads depend on query design and payload size.

## 15. Official references

- Vercel Functions: https://vercel.com/docs/functions
- Vercel Git deployments: https://vercel.com/docs/deployments/git
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Verify Firebase ID tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Realtime Database security: https://firebase.google.com/docs/database/security
- Realtime Database usage and billing: https://firebase.google.com/docs/database/usage/billing
