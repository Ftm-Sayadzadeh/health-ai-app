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

The backend reads database, Redis, and Celery settings from environment variables. Local defaults are suitable only for development.

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
