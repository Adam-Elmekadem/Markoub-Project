# MARKOUB Frontend (Vite React) Deployment Guide

The frontend is a static SPA built with Vite. You can deploy it to any static host (Vercel, Netlify, Nginx, GitHub Pages). Just point it at your live API.

## 1) Configure API base URL
Set your production API URL as an environment variable:

- Local dev: `.env.development.local`
  ```
  VITE_API_BASE_URL=http://localhost:8000/api/v1
  ```
- Production: set in your hosting dashboard (Vercel/Netlify) or create `.env.production` before build:
  ```
  VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
  ```

## 2) Build
```bash
npm ci
npm run build
# Output in dist/
```

## 3) Deploy options

### Vercel (easy)
- New Project -> Import this folder
- Framework: Vite
- Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`
- Deploy

### Netlify
- New site from Git -> Build command: `npm run build`, Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL`
- Set _Redirects for SPA (so client routes work):
  - Create `public/_redirects` with:
    ```
    /* /index.html 200
    ```

### Nginx (static hosting)
- Copy `dist/` to server, e.g. `/var/www/markoub-frontend`
- Nginx server block:
  ```nginx
  server {
    listen 80;
    server_name your-frontend-domain.com;
    root /var/www/markoub-frontend;
    index index.html;

    location / {
      try_files $uri /index.html;
    }
  }
  ```
- Add HTTPS via certbot

## 4) CORS and HTTPS
- The backend must allow your frontend origin in CORS (`FRONTEND_URL` in backend .env)
- Prefer HTTPS on both frontend and backend domains

## 5) Post-deploy check
- Open https://your-frontend-domain.com
- Confirm API calls succeed (e.g., Blogs, Rides)
- If requests fail with CORS, ensure backend `FRONTEND_URL` and config/cors.php include your domain
