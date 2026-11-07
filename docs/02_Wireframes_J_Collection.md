# J Collection — Wireframes

**Version:** 1.1  
**Purpose:** Low-fidelity, layout-focused wireframes for mobile-first development.

These are structural wireframes, not final visual designs. Labels, measurement fields, and brand styling must be confirmed with the client.

## 1. Navigation model

Mobile: bottom navigation or a simple top app bar with menu. Keep the primary actions reachable with one hand.

Desktop: left navigation rail/sidebar and a wider content area.

Primary destinations:
- Dashboard
- Customers
- Add customer
- Settings / account

Customer-specific destinations:
- Profile
- Edit details
- Update measurements
- Measurement history

## 2. Sign-in screen

```text
+--------------------------------+
|          J COLLECTION          |
|   Customer & Measurement Book  |
|                                |
|  Mobile / Email                |
|  [________________________]    |
|                                |
|  Password                      |
|  [________________________]    |
|                                |
|  [          SIGN IN          ]  |
|                                |
|  Forgot password?              |
+--------------------------------+
```

Notes:
- Use Firebase Authentication through the app's chosen auth flow.
- Do not implement a homemade password store.
- Show a generic sign-in error; do not reveal whether an account exists.

## 3. Dashboard

```text
+--------------------------------+
| J COLLECTION          [Account]|
|                                |
| Good morning                   |
|                                |
| +----------------------------+ |
| | Total customers       248  | |
| +----------------------------+ |
|                                |
| [ + Add customer ]             |
|                                |
| [ Search customers...       ]  |
|                                |
| Recent customers               |
| +----------------------------+ |
| | Rahul Sharma      98xxxxxx | |
| | Updated 04 Nov 2026        | |
| +----------------------------+ |
| | Amit Verma        97xxxxxx | |
| | Updated 28 Oct 2026        | |
| +----------------------------+ |
|                                |
| [Home] [Customers] [Settings]  |
+--------------------------------+
```

Notes:
- Dashboard statistics are optional; do not block MVP on analytics.
- Recent customer list should be bounded.
- Search should lead to the customer directory.

## 4. Customer directory and search

```text
+--------------------------------+
| Customers             [ + Add ]|
|                                |
| [ Search name / mobile...   ]  |
|                                |
| Sort: [Recently updated v]     |
|                                |
| +----------------------------+ |
| | Rahul Sharma               | |
| | 98xxxxxx                   | |
| | Last updated: 04 Nov 2026  | |
| |                         >  | |
| +----------------------------+ |
| | Amit Verma                 | |
| | 97xxxxxx                   | |
| | Last updated: 28 Oct 2026  | |
| |                         >  | |
| +----------------------------+ |
|                                |
| [Home] [Customers] [Settings]  |
+--------------------------------+
```

States to design:
- Empty customer list with “Add first customer”.
- No search results with “No matching customers”.
- Loading skeleton.
- Network/API error with retry.
- Archived customers hidden by default, with an optional filter.

## 5. Add customer

```text
+--------------------------------+
| < Back        Add customer     |
|                                |
| Customer details               |
| Name *                         |
| [________________________]     |
| Mobile number *                |
| [________________________]     |
| Age (optional)                 |
| [________________________]     |
| Notes (optional)               |
| [________________________]     |
|                                |
| Measurements (optional?)       |
| Unit: (•) Inches ( ) CM        |
| Chest        [________]        |
| Waist        [________]        |
| Shoulder     [________]        |
| Shirt length [________]        |
| Sleeve       [________]        |
| Elbow        [________]        |
| Cuff         [________]        |
| Neck         [________]        |
| Armhole      [________]        |
|                                |
| [       SAVE CUSTOMER       ]  |
+--------------------------------+
```

Notes:
- Confirm whether measurements are mandatory at customer creation.
- Validate positive numeric values and sensible configured ranges.
- Keep optional fields clearly marked.
- Do not hard-code measurement fields in a way that prevents future garment templates.

## 6. Customer profile

```text
+--------------------------------+
| < Customers       [Edit] [More]|
|                                |
| Rahul Sharma                   |
| 98xxxxxx  | Age: 32            |
| Customer since: 12 Jan 2025   |
|                                |
| CURRENT MEASUREMENTS           |
| Unit: Inches                   |
| Chest             40           |
| Waist             34           |
| Shoulder          18           |
| Shirt length      29           |
| Sleeve length     24           |
| Elbow             12           |
| Cuff               9           |
| Neck              16           |
| Armhole           18           |
|                                |
| Last updated: 04 Nov 2026      |
| [ Update measurements ]       |
| [ View measurement history ]  |
|                                |
| Notes                          |
| Prefers a slightly loose fit   |
+--------------------------------+
```

## 7. Update measurements

```text
+--------------------------------+
| < Rahul Sharma                 |
| Update measurements           |
|                                |
| Unit: Inches                   |
| Chest        [ 40.5 ]          |
| Waist        [ 35   ]          |
| Shoulder     [ 18   ]          |
| Shirt length [ 29   ]          |
| Sleeve       [ 24   ]          |
| Elbow        [ 12   ]          |
| Cuff         [ 9    ]          |
| Neck         [ 16   ]          |
| Armhole      [ 18   ]          |
|                                |
| Reason / note                  |
| [Weight change / fit update]   |
|                                |
| [ Save updated measurements ] |
+--------------------------------+
```

The date should be generated by the server. Do not ask the user to type the update timestamp. Show a confirmation after the backend confirms the write.

## 8. Measurement history

```text
+--------------------------------+
| < Rahul Sharma                 |
| Measurement history            |
|                                |
| 04 Nov 2026                    |
| Latest measurements            |
| Chest 40.5 | Waist 35          |
| Note: Weight change            |
|                                |
| 12 Apr 2026                    |
| Previous measurements          |
| Chest 40 | Waist 34            |
| Note: Fit adjustment           |
|                                |
| 12 Jan 2025                    |
| Original measurements          |
| Chest 39 | Waist 33            |
|                                |
+--------------------------------+
```

History records should be read-only in the normal interface. If a mistake is found, create a corrective update rather than editing an old snapshot.

## 9. Settings

```text
+--------------------------------+
| Settings                       |
|                                |
| Account                        |
| Signed in as: owner            |
| [ Change password / sign out ] |
|                                |
| Data                           |
| [ Export customers ]           |
| [ Backup instructions ]        |
|                                |
| Preferences                    |
| Default unit: [ Inches v ]     |
|                                |
| About                          |
| J Collection app               |
| Version                        |
+--------------------------------+
```

## 10. Responsive behavior

### Mobile
- Single-column forms.
- Full-width primary action buttons.
- Bottom navigation where useful.
- Customer cards rather than wide tables.
- Numeric keypad for measurement inputs.

### Desktop
- Sidebar navigation.
- Customer list can use a table with name, mobile, last updated, and action.
- Profile and measurement history can use two columns.
- Forms should not stretch excessively wide.

## 11. Accessibility and usability checklist

- Labels remain visible when fields contain values.
- All controls have keyboard focus states.
- Inputs have accessible labels.
- Validation errors explain how to fix the problem.
- Touch targets are comfortably sized.
- Text has sufficient contrast.
- Confirmation dialogs identify the record being archived/deleted.
