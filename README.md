# MingleKE

Dating app for Kenya. Swipe, match, chat.

## Run it

```
npm install
npm run dev
```

Open http://localhost:3000

Press **Log in** to get in (no account needed while inspecting).

## Useful commands

- `npm run build` — build for production
- `npm start` — run the built app

## Optional settings

Copy `.env.example` to `.env` only if you need them:

- `GEMINI_API_KEY` — smarter chat replies
- `LIPANA_API_KEY` — real M-Pesa
- Cloudinary keys — photo uploads (otherwise Firebase Storage)

Without those, everything still works in demo mode.
