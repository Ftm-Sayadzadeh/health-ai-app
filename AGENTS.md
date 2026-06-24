# Agent Guidance

## Product Direction

This is a Persian-first, RTL-first health, nutrition, fitness, coach-student, and lifestyle management product.

The current milestone is foundation only. Keep implementation limited to the monorepo skeleton, API health check, web shell, Docker services, and documentation.

## Hard Scope Boundaries

Do not implement these features until explicitly requested:

- Authentication, OTP, or user profile flows
- AI chat, AI logging, AI planning, or AI persistence
- Nutrition calculation, meal logging, water tracking, diet plans, or workout plans
- Coach-student features
- Partner/accountability features
- Doctor plan image import or OCR
- Notifications, streaks, challenges, or progress tracking
- Mobile apps

## Safety Rules For Future Work

- AI output must never directly persist health-critical data without validation and user confirmation.
- Coach actions must respect student permissions.
- Partner visibility must be privacy-controlled.
- Doctor diet plan imports must preserve the doctor's plan and only help the user track or follow it.

## Engineering Conventions

- Keep the monorepo layout under `apps/api` and `apps/web`.
- Keep the web UI Persian-first and RTL-first.
- Prefer small, focused changes.
- Do not add production secrets. Use `.env.example` placeholders only.
- Add or update tests when behavior changes.
