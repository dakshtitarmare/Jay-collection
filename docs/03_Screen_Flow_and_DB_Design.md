# J Collection — Screen Flow and Database Design

**Version:** 1.1  
**Backend direction:** Node.js API on Vercel + Firebase Authentication + Firebase Realtime Database.

## 1. High-level architecture

```text
+--------------------------+       HTTPS        +---------------------------+
| Responsive Web App / PWA | -----------------> | Vercel Deployment         |
| React + Vite + TypeScript|                     |                           |
|                          |                     | Static frontend           |
| Firebase Auth SDK        |                     | Node.js API functions      |
+--------------------------+                     +-------------+-------------+
          |                                                     |
          | Firebase ID token in Authorization header           |
          +---------------------------------------------------->|
                                                                |
                                                     Verify ID token
                                                     with Firebase Admin
                                                                |
                                                                v
                                                   +-------------------------+
                                                   | Firebase Realtime DB    |
                                                   | customers               |
                                                   | measurementHistory      |
                                                   +-------------------------+
```

The browser/mobile app calls the Node API. The Node API verifies the Firebase ID token and uses the Firebase Admin SDK to access the database. This keeps privileged database credentials off the client.

## 2. Screen flow

```text
App launch
   |
   v
Check authentication state
   |----------------------|
   |                      |
Signed out             Signed in
   |                      |
Sign-in screen         Dashboard
                          |
          +---------------+----------------+
          |               |                |
      Customers        Add customer      Settings
          |
      Search/list
          |
      Customer profile
          |
   +------+-------------------+
   |                          |
Edit customer          Update measurements
                              |
                       Validate form
                              |
                       Submit to API
                              |
                 Atomic current + history write
                              |
                     Profile / history view
```

## 3. Data model principles

- Use stable server-generated IDs, not array positions.
- Store timestamps as UTC epoch milliseconds or a consistent ISO-8601 format. Pick one and use it everywhere; this design uses epoch milliseconds.
- Store measurement unit with each snapshot.
- Store current measurements for quick profile display.
- Store immutable history snapshots for auditability.
- Keep customer profile and measurement history logically separate.
- Do not download every customer's full history for the directory screen.

## 4. Suggested Realtime Database structure

```json
{
  "customers": {
    "cust_abc123": {
      "name": "Rahul Sharma",
      "nameLower": "rahul sharma",
      "mobile": "9198XXXXXXXX",
      "age": 32,
      "notes": "Prefers slightly loose fit",
      "status": "active",
      "createdAt": 1793790000000,
      "updatedAt": 1793790000000,
      "currentMeasurementId": "meas_001",
      "currentMeasurements": {
        "garmentType": "shirt",
        "unit": "inches",
        "values": {
          "chest": 40,
          "waist": 34,
          "shoulder": 18,
          "shirtLength": 29,
          "sleeveLength": 24,
          "elbow": 12,
          "cuff": 9,
          "neck": 16,
          "armhole": 18
        },
        "updatedAt": 1793790000000
      }
    }
  },
  "measurementHistory": {
    "cust_abc123": {
      "meas_001": {
        "garmentType": "shirt",
        "unit": "inches",
        "values": {
          "chest": 40,
          "waist": 34,
          "shoulder": 18
        },
        "reason": "Initial measurements",
        "createdAt": 1793790000000
      }
    }
  },
  "indexes": {
    "customerByMobile": {
      "9198XXXXXXXX": "cust_abc123"
    }
  }
}
```

This is an illustrative shape. Add the complete agreed measurement fields and validate them on the server. Avoid using a raw mobile number as a Firebase key without normalization and collision handling.

## 5. Search strategy

Realtime Database is not a full-text search engine. Do not promise arbitrary substring search across all fields without implementing it deliberately.

For MVP:
- Normalize mobile numbers to digits plus country code.
- Store `nameLower` for case-insensitive prefix search.
- Use `.indexOn` for fields used in queries.
- For a small dataset, a bounded customer list with client-side filtering may be acceptable, but do not fetch an unbounded dataset as the business grows.
- If flexible contains-search becomes important, consider a dedicated search service or move to a database with richer query support.

Example database rules index declaration (adapt paths to the final schema):

```json
{
  "rules": {
    "customers": {
      ".indexOn": ["nameLower", "mobile"]
    }
  }
}
```

## 6. API contract

Base URL example: `https://<your-vercel-domain>/api`

All private endpoints require:
`Authorization: Bearer <Firebase ID token>`

### Authentication
Firebase client SDK signs the owner in and obtains an ID token. The API verifies it using Firebase Admin SDK. Do not send passwords to your own API unless implementing a documented custom auth flow; Firebase Auth should manage credentials.

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Public health check; no private data |
| GET | `/api/customers?limit=20&cursor=...` | List customers |
| GET | `/api/customers/search?q=...` | Search customer |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id` | Get profile |
| PATCH | `/api/customers/:id` | Update profile fields |
| POST | `/api/customers/:id/measurements` | Create new measurement snapshot and update current values |
| GET | `/api/customers/:id/measurements` | Get history |
| POST | `/api/customers/:id/archive` | Archive customer |
| GET | `/api/export` | Export authorized business data |

Use proper status codes: 200, 201, 400, 401, 403, 404, 409, 429, and 500 as appropriate. Return a consistent JSON error shape without leaking stack traces.

## 7. Measurement update transaction

A measurement update must not update the current profile while failing to create history.

Recommended sequence:
1. Verify ID token and owner authorization.
2. Validate customer ID and payload.
3. Validate allowed measurement keys, numeric values, unit, and garment type.
4. Generate a new history ID and server timestamp.
5. Use a Realtime Database multi-location atomic update (or transaction) to write:
   - `customers/{id}/currentMeasurements`
   - `customers/{id}/currentMeasurementId`
   - `customers/{id}/updatedAt`
   - `measurementHistory/{id}/{historyId}`
6. Return success only after Firebase confirms the write.

Never accept `createdAt`, `updatedAt`, or owner ID from the browser as authoritative values.

## 8. Example measurement history record

```json
{
  "garmentType": "shirt",
  "unit": "inches",
  "values": {
    "chest": 40.5,
    "waist": 35,
    "shoulder": 18,
    "shirtLength": 29,
    "sleeveLength": 24,
    "elbow": 12,
    "cuff": 9,
    "neck": 16,
    "armhole": 18
  },
  "reason": "Customer requested a looser fit",
  "createdAt": 1793790000000,
  "createdBy": "firebase-auth-uid"
}
```

## 9. Security design

- Create the owner account through Firebase Authentication.
- Keep an allowlist of authorized owner UID(s) on the server, or use custom claims managed securely.
- Verify Firebase ID tokens on every private API route.
- Do not trust a UID supplied in request JSON.
- Store Firebase Admin service-account credentials as Vercel server-side environment variables.
- Never prefix privileged environment variables with `VITE_`.
- Deny direct client reads/writes to private RTDB paths if all access goes through the Node API.
- Admin SDK bypasses Realtime Database Security Rules; authorization must therefore be enforced in the API itself.
- Apply request validation, sensible body-size limits, rate limiting, and safe error handling.
- Do not log customer names, phone numbers, or measurements.
- Restrict CORS to the deployed frontend origin if cross-origin requests are used. Same-origin `/api` calls are simpler.

## 10. Indexes and rules

A possible rules baseline when the browser never accesses private data directly:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

This blocks client SDK access. The server's Firebase Admin SDK uses privileged credentials and is not governed by these client rules. Confirm this behavior in a test project before production.

Add query indexes under the exact paths used by the final query design. Rules and indexes must be tested with the Firebase Emulator Suite or a non-production project.

## 11. Data lifecycle and backup

- Archive customers instead of deleting by default.
- Define retention with the business owner.
- Provide CSV/JSON export with access control.
- Schedule or perform secure backups according to an agreed cadence.
- Store backups separately from the live database and restrict access.
- Test restoration periodically.
- Document who owns the Firebase project and who can access exports.

## 12. Open technical decisions

- Exact garment types and measurement field definitions.
- Duplicate mobile-number policy.
- Prefix-only search versus advanced search.
- Whether offline entry is required.
- Whether the app will have one owner login or staff roles.
- Backup cadence and retention policy.
