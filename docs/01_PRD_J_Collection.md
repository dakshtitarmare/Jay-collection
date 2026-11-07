# J Collection — Product Requirements Document (PRD)

**Version:** 1.1  
**Status:** Draft for client confirmation  
**Business:** J Collection, Nagpur  
**Product:** Private customer and garment-measurement management application

## 1. Product overview

J Collection needs a simple, private application for the business owner to maintain customer contact details and garment measurements. The owner should be able to find a returning customer quickly, review their latest measurements, update measurements when fit or body size changes, and inspect previous measurement records.

The product is primarily mobile-first. It should also work in a desktop browser using the same account and cloud data.

## 2. Problem statement

Customer details and measurements may currently be recorded in notebooks, paper slips, or scattered files. This makes it difficult to:
- Find a customer's previous measurements quickly.
- Know which measurements are current.
- Compare older and newer measurements.
- Recover records when a notebook or device is lost.
- Access the same information from another device.

## 3. Goals

1. Maintain one searchable customer directory.
2. Store contact details and configurable garment measurements.
3. Make adding and editing a customer straightforward on a phone.
4. Preserve a dated snapshot whenever measurements are updated.
5. Allow the owner to access the same records from mobile and desktop.
6. Protect customer data with authentication, authorization, and backups.

## 4. Non-goals for the first release

- Billing, invoicing, inventory, point-of-sale, or payment collection.
- Customer-facing accounts or customer self-service.
- WhatsApp/SMS campaigns or automated marketing.
- Multi-branch stock or staff attendance.
- AI-based size recommendations.
- Automatic body-measurement capture.

These can be considered later only if the client requests them.

## 5. Users and permissions

### Primary user: J Collection owner
- Signs in securely.
- Creates, views, searches, edits, and archives customer records.
- Updates measurements and records a reason/note.
- Views measurement history.
- Exports or requests a backup.

### Optional future user: authorized staff
Not part of MVP. If added, access must be explicitly granted and auditable. Do not share the owner's login among staff.

## 6. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Owner login/logout | Must |
| FR-02 | Dashboard with customer count and quick actions | Should |
| FR-03 | Add a customer with name and mobile number | Must |
| FR-04 | Store optional age and notes | Should |
| FR-05 | Store garment measurements with a unit | Must |
| FR-06 | List customers with pagination or bounded loading | Must |
| FR-07 | Search by customer name and mobile number | Must |
| FR-08 | Open a customer profile | Must |
| FR-09 | Edit customer contact details | Must |
| FR-10 | Update current measurements | Must |
| FR-11 | Create an immutable measurement-history snapshot on each measurement update | Must |
| FR-12 | Show previous measurements and update dates | Must |
| FR-13 | Add a note/reason for a measurement update | Should |
| FR-14 | Archive a customer instead of immediate permanent deletion | Should |
| FR-15 | Export customer data in CSV/JSON | Should |
| FR-16 | Show loading, empty, validation, and error states | Must |

## 7. Customer data fields

### Customer profile
- `customerId`: server-generated unique identifier.
- `name`: required, trimmed.
- `mobile`: required; normalize and validate format. Confirm whether international numbers are needed.
- `age`: optional integer; consider storing date of birth only if the client genuinely needs it.
- `notes`: optional free-text business note. Avoid sensitive or unnecessary personal details.
- `createdAt`: server-generated timestamp; immutable.
- `updatedAt`: server-generated timestamp.
- `archivedAt`: nullable timestamp.

### Measurement fields

Proposed initial shirt measurement set; the client must confirm names and exact definitions before implementation:

| Field | Meaning to confirm | Suggested unit |
|---|---|---|
| chest | Chest circumference | inches |
| waist | Waist circumference | inches |
| shoulder | Shoulder width | inches |
| shirtLength | Shirt length | inches |
| sleeveLength | Sleeve length | inches |
| elbow | Elbow measurement | inches |
| cuff | Cuff measurement | inches |
| neck | Neck/collar measurement | inches |
| armhole | Armhole measurement | inches |
| notes | Fit preference / special instruction | text |

Store the unit with each measurement snapshot. Do not assume every future garment uses the same set of measurements. The data model should allow garment types and measurement fields to expand later.

## 8. Core business rules

1. A customer must have a name and a usable mobile number.
2. Mobile-number uniqueness is a client decision. Before enforcing it, confirm whether family members may share one number.
3. A customer can exist before measurements are entered, if the owner needs contact-only records.
4. A measurement update must create a history record and update the current measurement view as one logical operation.
5. A failed history write must not leave current measurements updated without a history snapshot.
6. `createdAt` never changes after customer creation.
7. `updatedAt` is assigned by the server, not trusted from the device.
8. Store timestamps in UTC; display them in `Asia/Kolkata`.
9. Never silently overwrite history. Corrections should create a new history event.
10. Archive by default; permanent deletion should be a deliberate, protected operation.

## 9. UX requirements

- Mobile-first responsive layout; usable at 360px width.
- Large tap targets and clear labels.
- Numeric input with decimal support for measurements.
- Show the unit beside every measurement.
- Use a clear “Save measurements” action.
- Confirm before archive/delete.
- Search should be available from the customer list.
- Display “Last updated” with a readable date.
- Provide clear feedback after save or failure.
- Do not rely on color alone to communicate status.

## 10. Non-functional requirements

### Security and privacy
- Authentication required for every private route and API.
- Backend verifies Firebase ID tokens.
- Firebase Admin credentials stay only in Vercel server-side environment variables.
- Client must not receive service-account credentials.
- Database rules deny direct unauthenticated access. If the server uses Admin SDK, Admin SDK access is governed by IAM/service credentials, not client database rules.
- Use HTTPS.
- Avoid logging names, phone numbers, or measurement payloads.
- Provide a way for the business owner to export data and request deletion.

### Reliability
- Handle network failures without losing unsaved form input.
- Prevent duplicate submissions where practical.
- Use atomic/transactional writes for current measurement + history.
- Keep a documented backup/export process.
- Test restore, not only backup creation.

### Performance
- Load a bounded customer page rather than the entire database.
- Search by indexed fields / a deliberate search strategy.
- Avoid downloading all measurement history in the customer list.
- Target responsive interactions on ordinary Android phones and desktop browsers.

## 11. MVP acceptance criteria

- Owner can sign in and sign out.
- Unauthenticated users cannot read or modify customer data.
- Owner can add a customer with validated required fields.
- Owner can find a customer by name or mobile number.
- Owner can open and edit a customer.
- Measurement update creates a timestamped history snapshot.
- Customer profile shows latest measurements and previous snapshots.
- Same account sees consistent data on mobile and desktop.
- Errors are shown clearly and do not falsely report a successful save.
- Backup/export can be generated and a restore procedure is documented.

## 12. Assumptions requiring client confirmation

1. Exact list and meaning of shirt measurements.
2. Whether the shop measures trousers, suits, or other garments too.
3. Whether measurements are recorded in inches only or inches and centimetres.
4. Whether age is necessary, or date of birth is preferred.
5. Whether multiple customers can share one mobile number.
6. Whether the owner is the only user in version 1.
7. Whether records should be archived or permanently deleted.
8. Whether the owner needs offline entry when internet is unavailable.

## 13. Suggested release plan

- **Release 1:** Authentication, customer CRUD, search, current measurements, history, responsive UI.
- **Release 1.1:** Export, archive, backup/restore runbook, usability improvements.
- **Release 2:** Optional staff roles, multiple garment templates, offline support, reminders—only after client validation.
