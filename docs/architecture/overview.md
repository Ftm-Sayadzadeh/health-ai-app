# Architecture Overview

## Foundation

The repository is organized as a monorepo:

- `apps/api`: Django + Django REST Framework backend.
- `apps/web`: Next.js + TypeScript + Tailwind CSS frontend.
- `docs`: Architecture and product engineering documentation.

Local infrastructure is provided by Docker Compose:

- PostgreSQL is the main application database.
- Redis is available for future background jobs.
- Celery is configured as a worker skeleton only. No real tasks are implemented in the foundation milestone.

## Backend

The API is intentionally minimal:

- Django project module: `config`
- Health app: `health`
- Health endpoint: `GET /api/health/`
- Accounts app: `accounts`
- Auth endpoints: `POST /api/auth/request-otp/`, `POST /api/auth/verify-otp/`, `POST /api/auth/token/refresh/`, `GET /api/auth/me/`
- Profiles app: `profiles`
- Health profile endpoint: `GET /api/health-profile/`, `PUT /api/health-profile/`
- Program intake endpoints: `GET /api/program-intakes/status/` and owner-scoped `GET/PUT` nutrition and workout intake endpoints
- Nutrition tracking endpoints: daily owner-scoped food logs, entry operations, reusable custom-food CRUD, and derived recent foods

The backend reads database, Redis, and Celery settings from environment variables. Local defaults are suitable only for development.

## Auth Phase

The backend now includes phone OTP authentication with a custom user model and JWT tokens.

- The custom user model uses normalized Iranian mobile numbers as the login identifier.
- User roles are limited to auth-level values: `normal`, `coach`, and `admin`.
- OTP codes are stored hashed, expire after 5 minutes, are limited to 5 verification attempts, and are consumed after successful verification.
- A 60-second resend throttle applies per phone number.
- In debug mode, OTP codes may be returned for local testing. Outside debug mode, OTP codes are never returned and delivery goes through an SMS provider adapter.
- Access tokens remain short-lived at 15 minutes. Seven-day refresh tokens let the web client renew access once after a `401`; refresh failure clears the browser session and returns the user to login.
- Django Admin UI remains intentionally disabled.

## Frontend

The web app uses Next.js App Router with TypeScript and Tailwind CSS.

The UI starts Persian-first and RTL-first:

- The root layout sets `lang="fa"` and `dir="rtl"`.
- The landing page introduces the product direction and links to login.
- The login page supports OTP authentication against the backend auth API.
- The dashboard route is guarded client-side and shows only authenticated user identity.

Frontend token storage currently uses browser `localStorage` for development and MVP testing. Production auth storage and refresh-token behavior must be hardened in a later phase.

## Health Profile Phase

Each user may own one health profile containing user-confirmed identity, body measurement, goal, activity, and optional food preference or restriction fields. The endpoint is JWT-protected and always scopes reads and writes to the authenticated user.

The auth user payload includes `has_health_profile`. After OTP verification, normal users without a profile are directed to the Persian RTL onboarding page before dashboard access. Coach and admin roles bypass mandatory onboarding. After profile creation, the frontend refetches `/api/auth/me/` before entering the dashboard so routing never depends on stale client state.

Users with a profile can open `/profile` from the dashboard to retrieve and replace their existing profile through the same `GET/PUT /api/health-profile/` contract. Profile values remain client state only; JWT storage is unchanged. The settings page does not introduce profile history or derived health calculations.

The profile foundation does not calculate BMI, calorie targets, nutrition advice, or other health recommendations.

## Program Intake Phase

The `programs` app stores optional, structured nutrition and workout intake answers in separate one-to-one records. Access is limited to authenticated normal users who already have a health profile. Nutrition and workout completion remain independent, and the dashboard only offers an optional entry point.

The frontend hub at `/plans/intake` uses short guided questionnaires and reloads existing answers for editing. A completed submission stores user-confirmed constraints and preferences only. It does not generate a meal plan, workout plan, calorie target, health calculation, or AI recommendation.

## Nutrition Tracking Phase

The `nutrition` app stores manual daily food entries grouped into breakfast, lunch, dinner, snack, and other meals. Calorie totals are derived at request time from user-entered values and are never treated as targets or clinical measurements.

The Persian RTL `/nutrition` workspace supports date navigation and entry creation, editing, and deletion. Custom foods are independent reusable templates: their values are copied into a daily entry so later template edits never rewrite history. Recent foods are derived from the current user's log entries, deduplicated, and used only to prefill the user-confirmed entry form.

Custom and recent foods still rely entirely on calories entered by the user. This phase intentionally excludes macros, external food databases, image or voice logging, AI, automatic calorie calculation, and recommendations.

## Future Product Boundaries

Future AI features must be designed with explicit user confirmation before persisting health-critical data.

Future coach-student features must enforce student permissions before coaches can view or modify student information.

Future partner/accountability features must be privacy-controlled so users decide what a partner can see.

Future doctor diet plan import must preserve the doctor's plan and help users follow it without silently changing medical guidance.
