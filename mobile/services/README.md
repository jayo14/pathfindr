# mobile/services — Backend Map

## Authoritative backend for the current build: **Django REST API**

All data that appears in the demo app is served by the Django backend
(`EXPO_PUBLIC_API_URL`). The table below lists every service module and the
backend it talks to.

| Module | Backend | Features served |
|---|---|---|
| `api-client.ts` | Django (HTTP) | Base `fetch` wrapper, JWT attach, token refresh |
| `auth-service.ts` | Django `/auth/*` | Login, register, logout, password reset, stored-token helpers |
| `campus-service.ts` | Django `/buildings/`, `/events/`, `/lost-items/`, `/surveys/`, `/profile/` | Buildings list + detail, events, lost & found, onboarding survey, profile update |
| `ai-service.ts` | Django `/ai/chat/` | AI campus assistant |
| `tokenStorage.ts` | expo-secure-store (native) / AsyncStorage (web) | Secure token persistence — not a backend client |
| `supabase.ts` | **Not active** — see note below | — |

---

## Supabase status: reserved, not active

`supabase.ts` is **not imported by any screen, hook, or service** in the current
build. It is kept in the repository as a placeholder for a possible future
feature (e.g. Supabase Storage for profile-image uploads) and is safe to ignore
during the demo.

Rules that must stay true while this file exists:

1. **Do not use `supabase.auth`** — authentication is handled exclusively by
   Django JWT via `auth-service.ts`.
2. **Do not read campus data from Supabase** — buildings, events, and lost items
   are served by Django.
3. If Supabase Storage is eventually adopted, wire it through a dedicated
   `storage-service.ts` module; do not expand the responsibilities of
   `supabase.ts` in place.

---

## Data-source map by screen

| Screen | Data source |
|---|---|
| Map (`/map`) | Django — buildings via `useCampusData` |
| Search (`/search`) | Django — buildings via `useCampusData` |
| Building detail (`/building/[id]`) | Django — `getBuildingById` |
| Events (`/events`) | Django — events via `useCampusData` |
| Lost & Found (`/lost-found`) | Django — lost items via `useCampusData`; submit via `submitLostAndFoundReport` |
| AI Assistant (`/ai-assistant`) | Django — `sendChatMessage` |
| Auth (`/auth`) | Django — `login` / `register` |
| Onboarding (`/onboarding`) | Django — `updateProfile`, `submitSurvey` |
| Settings (`/settings`) | Local store (`useAppStore`) + Django profile |
| Directions (`/directions`) | Django routing API via `useDirections` |
