# Order Submission

Offline-friendly order submission, history and reminder app (React + Vite + Tailwind, Express server,
Firebase Cloud Messaging for push, Google Sheets via Apps Script).

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
npm run lint                 # type-check
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SCRIPT_URL` | client | Apps Script web-app URL (defaults to the built-in one) |
| `VITE_DEFAULT_SPREADSHEET_ID` | client | Sheet used when the user hasn't set one |
| `VITE_SCRIPT_API_KEY` | client | Shared key sent to Apps Script; must equal the `API_KEY` Script Property |
| `ALLOWED_ORIGINS` | server | Comma-separated extra origins allowed by CORS (same-origin needs nothing) |
| `FIRESTORE_DATABASE_ID` | server | Firestore database for push installations and reminders |

## Securing the Apps Script backend

1. Open the Apps Script project > Project Settings > Script properties.
2. Add `API_KEY` (a long random string) and, optionally, `ALLOWED_SPREADSHEET_IDS` (comma-separated).
3. Paste the updated `apps-script.js`, then **Deploy > Manage deployments > Edit > New version**.
4. Set the same value as `VITE_SCRIPT_API_KEY` when building the web app.

The key ships in the client bundle, so it blocks casual access, not a determined attacker. For
per-user security, deploy the script as "Execute as: me, Who has access: Only myself/your domain"
and have the server call it, or verify a Firebase ID token inside the script.

## Hosting

The reminder scheduler and push endpoints run in `server.ts` and need a long-running Node host
(Cloud Run, a VM, etc.). Static/serverless-only hosting such as Vercel will serve the UI but
cannot send scheduled push reminders. Check `GET /api/push/status`: `persistence` must be
`firestore`, otherwise reminders are lost on restart.

## Offline use

After one online visit the app opens without a network (production build only). Orders submitted
or edited offline are queued in the browser and sent when the connection returns (the existing
queue; its size shows in the settings menu).

- `public/firebase-messaging-sw.js` is the **only** service worker. It does push notifications
  *and* caching. Do not add another worker: `src/lib/fcm.ts` unregisters any other one.
- Caching: page navigations are network-first with a cached fallback; `/assets/*`, `/icons/*` and
  the manifest are cached; Google Fonts and the imgur logo are cached at runtime. `/api/*`, Google
  Apps Script and Firebase are never cached.
- After a release, old hashed assets are removed automatically. Change `CACHE_VERSION` in the
  worker to force every device to discard its caches.
- It only runs in `npm run build` output, not in `npm run dev`.
- To test: `npm run build`, serve `dist`, load once, then switch DevTools > Network to Offline
  and reload.

### Self-hosting the app icon (recommended)

The logo and install icon are still hotlinked from `i.imgur.com`. The worker caches the logo
after the first load, but the home-screen install icon and push-notification icon still depend
on imgur. Save the logo as `public/icons/icon-192.png` and `icon-512.png`, then replace
`https://i.imgur.com/49kNDoe.png` with `/icons/icon-192.png` in `index.html`, `public/manifest.json`,
`src/components/Header.tsx` and `DesktopSidebar.tsx`.

## Storage safety

All `localStorage` writes go through `src/lib/safeStorage.ts`, which never throws. If the browser
refuses a write (storage full or blocked), the app keeps working and shows a dismissible warning
(`StorageWarning`). Use `safeSetItem` / `safeRemoveItem` for any new persisted state.

## Tests

`npm test` runs unit tests (Vitest, pinned to Malaysia time) for the delivery-date parsing, the
active-order window and the reminder timing (`src/utils/*.test.ts`). `npm run lint` type-checks.
