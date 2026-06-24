# Health AI App

Persian-first foundation for an AI-assisted health, nutrition, fitness, coach-student, and lifestyle management product.

This repository currently contains only the foundation milestone:

- Django REST Framework API skeleton
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
- Persian-first RTL web shell
- Local Docker services for API, web, PostgreSQL, Redis, and Celery worker
- Documentation for the initial architecture

Not implemented yet:

- Authentication, OTP, or user profiles
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

Run API tests:

```powershell
docker compose run --rm api python manage.py test
```

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
