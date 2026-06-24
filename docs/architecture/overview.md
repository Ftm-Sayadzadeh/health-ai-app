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
- Auth endpoints: `POST /api/auth/request-otp/`, `POST /api/auth/verify-otp/`, `GET /api/auth/me/`

The backend reads database, Redis, and Celery settings from environment variables. Local defaults are suitable only for development.

## Auth Phase

The backend now includes phone OTP authentication with a custom user model and JWT tokens.

- The custom user model uses normalized Iranian mobile numbers as the login identifier.
- User roles are limited to auth-level values: `normal`, `coach`, and `admin`.
- OTP codes are stored hashed, expire after 5 minutes, are limited to 5 verification attempts, and are consumed after successful verification.
- A 60-second resend throttle applies per phone number.
- In debug mode, OTP codes may be returned for local testing. Outside debug mode, OTP codes are never returned and delivery goes through an SMS provider adapter.
- Django Admin UI remains intentionally disabled.

## Frontend

The web app uses Next.js App Router with TypeScript and Tailwind CSS.

The UI starts Persian-first and RTL-first:

- The root layout sets `lang="fa"` and `dir="rtl"`.
- The landing page introduces the product direction without implementing product features.
- The dashboard route is a placeholder only.

## Future Product Boundaries

Future AI features must be designed with explicit user confirmation before persisting health-critical data.

Future coach-student features must enforce student permissions before coaches can view or modify student information.

Future partner/accountability features must be privacy-controlled so users decide what a partner can see.

Future doctor diet plan import must preserve the doctor's plan and help users follow it without silently changing medical guidance.
