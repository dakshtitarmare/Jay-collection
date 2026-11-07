# J Collection — Project Documentation Pack

This folder contains the planning and implementation documents for the J Collection customer and garment-measurement application.

## Documents

1. `01_PRD_J_Collection.md` — Product scope, requirements, business rules, acceptance criteria.
2. `02_Wireframes_J_Collection.md` — Low-fidelity mobile and desktop screen layouts.
3. `03_Screen_Flow_and_DB_Design.md` — Navigation flow, Firebase data structure, API contract, security.
4. `04_Deployment_Integration_Guide.md` — React/Vite + Node/Vercel + Firebase integration and deployment.
5. `05_GitHub_Copilot_Implementation_Prompt.md` — Phased, constraint-driven prompt for GitHub Copilot.

## Recommended first steps

1. Review the PRD with the J Collection owner.
2. Confirm exact garment measurement names and definitions.
3. Confirm units, duplicate mobile-number policy, and whether one owner login is enough.
4. Agree whether offline data entry is required.
5. Create a private GitHub repository.
6. Add these files under `docs/`.
7. Give Copilot the master prompt and ask it to perform Phase 0 only.

## Architecture decision

The documentation assumes a responsive React + Vite web application/PWA, with Node.js API functions deployed on Vercel and Firebase Authentication + Realtime Database. This allows mobile and desktop access through one web app. It is not a React Native native app.

## Important

These documents are a planning baseline, not a deployed product. Verify current Vercel and Firebase pricing, quotas, SDK versions, and deployment conventions before production. The client should own the Firebase project and business data wherever practical.
