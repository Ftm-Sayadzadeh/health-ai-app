# Health AI App

Persian-first foundation for an AI-assisted health, nutrition, fitness, coach-student, and lifestyle management product.

This repository currently contains only the foundation milestone:

- Django REST Framework API skeleton
- Backend phone OTP authentication with JWT
- Next.js + TypeScript + Tailwind CSS web skeleton
- PostgreSQL configuration
- Redis + Celery worker skeleton
- Docker Compose for local development
- Health check endpoint
- Persian RTL landing page and placeholder dashboard
- Architecture and agent guidance docs

## Scope

Implemented in this milestone:

- `GET /api/health/` health check
- Backend-only auth endpoints under `/api/auth/`
- Frontend OTP login page at `/login`
- Persian-first RTL web shell
- Local Docker services for API, web, PostgreSQL, Redis, and Celery worker
- Documentation for the initial architecture

Not implemented yet:

- Production-hardened token storage or user profiles
- AI features
- Nutrition calculation or meal logging
- Diet plans or workout plans
- Coach, student, partner, or doctor-plan import features
- Notifications
- Mobile apps

## Repository Layout

```text
apps/
  api/      Django + Django REST Framework backend
  web/      Next.js + TypeScript + Tailwind frontend
docs/
  architecture/
    overview.md
```

## Local Development With Docker

Copy the example environment file if you want to customize values:

```powershell
Copy-Item .env.example .env
```

Build and start the local stack:

```powershell
docker compose build
docker compose up
```

Default local URLs:

- Web: http://localhost:3000
- API health check: http://localhost:8000/api/health/
- Auth OTP request: http://localhost:8000/api/auth/request-otp/
- Auth OTP verify: http://localhost:8000/api/auth/verify-otp/
- Auth current user: http://localhost:8000/api/auth/me/
- Frontend login: http://localhost:3000/login

Run API tests:

```powershell
docker compose run --rm api python manage.py test
```

## Backend Auth

The backend supports phone-based OTP login for Iranian mobile numbers. Accepted input formats include:

- `09123456789`
- `+989123456789`
- `989123456789`

Phone numbers are normalized to the canonical `+989123456789` format.

Request a local OTP:

```powershell
curl -X POST http://localhost:8000/api/auth/request-otp/ `
  -H "Content-Type: application/json" `
  -d "{\"phone_number\":\"09123456789\"}"
```

When `DJANGO_DEBUG=True`, the OTP is included in the response for local testing. When `DJANGO_DEBUG=False`, the OTP is never returned and the SMS provider adapter is used.

Verify an OTP:

```powershell
curl -X POST http://localhost:8000/api/auth/verify-otp/ `
  -H "Content-Type: application/json" `
  -d "{\"phone_number\":\"09123456789\",\"otp\":\"123456\"}"
```

The verify response returns JWT `access` and `refresh` tokens. Use the access token with:

```powershell
curl http://localhost:8000/api/auth/me/ `
  -H "Authorization: Bearer <access-token>"
```

The auth UI phase adds a Persian OTP login page and guarded dashboard display. Tokens are stored in browser `localStorage` for development and MVP testing only. Production token storage must be hardened before launch.

The auth phase does not include profiles, onboarding, coach features, or product workflows.

Run web lint:

```powershell
npm --prefix apps/web run lint
```

## Local Development Without Docker

Backend:

```powershell
cd apps/api
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python manage.py runserver
```

Frontend:

```powershell
cd apps/web
npm install
npm run dev
```

## Safety Principles For Future Phases

- AI must not directly persist health-critical data without validation and user confirmation.
- Coach actions must respect student permissions.
- Partner visibility must be privacy-controlled.
- Doctor diet plan import must help users follow the doctor's plan, not silently change it.
