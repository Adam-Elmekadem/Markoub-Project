
# Markoub — Ride-sharing app (Frontend)

This repository contains the frontend for Markoub, a small community ride-sharing application built with React + Vite and Tailwind CSS. The full project is a monorepo with a Laravel backend located in `../backend`.

This README explains how to run the frontend locally, how it talks to the backend API, and quick notes for deploying the app.

## Table of contents
- Project structure
- Quick start (dev)
- Environment variables
- Build & production
- Integration with backend (API)
- Deploy suggestions
- Troubleshooting

## Project structure

- `src/` — React source files (components, pages, contexts, utils)
- `public/` — static assets
- `index.html` — Vite entry
- `package.json` — npm scripts and dependencies
- `vite.config.js` — Vite configuration

The Laravel backend lives under `../backend` in the monorepo and provides the API used by the frontend.

## Quick start (development)

These commands assume you are on Windows PowerShell and the repo root is:

`C:\Users\DELL\Downloads\MARKOUB PROJECT\MARKOUB`

1) Install dependencies for frontend

```powershell
cd 'C:\Users\DELL\Downloads\MARKOUB PROJECT\MARKOUB\markoub-project'
npm ci
```

2) Run the dev server (hot reload)

```powershell
npm run dev
```

Open the browser at the printed Vite URL (usually `http://localhost:5173`).

3) Backend (for local API)

Make sure the Laravel backend is running and reachable. From the `backend` folder:

```powershell
cd '..\backend'
composer install
copy .env.example .env
# Edit .env to set DB and APP_URL and other keys
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

By default the frontend expects the API base URL to be set via a Vite env var (see below).

## Environment variables

Frontend (Vite) uses env vars prefixed with `VITE_`.

- `VITE_API_URL` — full URL of the backend API (e.g. `http://localhost:8000/api` or production API URL).

Create a file `.env.local` in `markoub-project` (do not commit secrets) containing:

```
VITE_API_URL=http://localhost:8000/api
```

Backend (Laravel) environment variables live under `backend/.env`. Important keys include `APP_URL`, `DB_*`, `APP_KEY`, and any mail/S3/JWT keys your app uses.

## Build & production

To build the frontend for production:

```powershell
cd 'C:\Users\DELL\Downloads\MARKOUB PROJECT\MARKOUB\markoub-project'
npm run build
```

The production-ready files will be in `dist/` and can be deployed to Vercel, Netlify, or any static hosting.

When deploying the frontend, set `VITE_API_URL` in the host UI to point to your deployed backend API.

## How frontend talks to API

- The frontend uses `src/utils/api.js` which reads `import.meta.env.VITE_API_URL` to build requests. Ensure `VITE_API_URL` points at your Laravel API.
- Typical production flow: frontend (Vercel) → backend API (Render/Railway/Heroku) → managed DB.

## Deploy suggestions

Recommended minimal setup for a small production deployment:

- Frontend: Vercel or Netlify
	- Point the project root to `markoub-project` if you deploy from the monorepo.
	- Build command: `npm ci && npm run build`
	- Output directory: `dist`
	- Set environment variable `VITE_API_URL` to your backend URL.

- Backend: Render, Railway, Heroku, or a Docker host
	- Connect the `backend/` folder in the repo to the service.
	- Use a managed database (Postgres/MySQL).
	- Set all Laravel env variables in the host: `APP_KEY`, `APP_URL`, `DB_*`, `JWT_SECRET`, `MAIL_*`, `AWS_*` (if used).
	- Run migrations on the host: `php artisan migrate --force`.

Quick pairing: Render (backend) + Vercel (frontend) is simple and integrates with GitHub for auto-deploy on push.

## Troubleshooting

- 401 / authentication issues: ensure `APP_KEY`/JWT secret matches and the frontend uses the correct API base URL.
- CORS errors: update `backend/config/cors.php` to allow the frontend origin.
- Uploads disappearing: use persistent object storage (S3 or Render/Cloud provider storage) instead of local disk in production.

## Useful commands summary (PowerShell)

```powershell
# Frontend
cd 'markoub-project'
npm ci
npm run dev          # dev server
npm run build        # production build -> dist/

# Backend
cd 'backend'
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

## Contributing & support

- Keep secrets out of Git. Use `.env` and host secret managers.
- Open issues or pull requests for bugs and improvements.
