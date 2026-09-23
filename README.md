# MingleKE

Mobile-first dating and social discovery for Kenya. Swipe, match, and chat with people nearby.

## What you get

- Email sign-up, login, and password reset
- Guided onboarding (gender, preferences, age 18+, city or GPS, 3 photos, bio, interests)
- Optional M-Pesa KES 100 verification for women (simulated when Lipana is not configured)
- Swipe discovery with age filters, pass/like actions, and mutual-match modal
- Matches list with search
- Real-time chat
- Edit profile, preferences, and safety guidelines
- Installable PWA (Add to Home Screen / desktop install)

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Optional environment (`.env`)

| Key | Purpose |
| --- | --- |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | Photo uploads via Cloudinary |
| `LIPANA_API_KEY` / `LIPANA_PAYMENT_LINK_SLUG` | Real M-Pesa STK push |
| `PORT` | Server port (default 3000) |

Without Cloudinary, photos go to Firebase Storage. Without Lipana, payments auto-confirm in demo mode.

## Build & run production

```bash
npm run build
npm start
```

## Stack

React 19 · Vite 6 · Tailwind 4 · Firebase Auth + Firestore + Storage · Motion · Express · Zustand

## Deploy (Vercel)

This repo is a Vite SPA with a small Express API. Vercel can use:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

If you only need the static client on Vercel (no M-Pesa API), point output at `dist` after `vite build`. For API routes, deploy the Node server (`dist/server.cjs`) or split payments into a separate function.

## Safety

Members must be 18+. Reports are stored for review. Never send money to matches. Full tips live in-app under **Privacy & safety**.
