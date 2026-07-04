# PathFindr — Mobile

React Native / Expo app for campus navigation at LASUSTECH.

**Stack:** Expo SDK 54 · Expo Router · TypeScript · Zustand · TanStack Query · Supabase

---

## Getting started

```bash
bun install          # or npm install
npx expo start       # starts Metro bundler
```

Open in Expo Go, an Android emulator, or a physical device.

---

## Environment

| File | Used when |
|---|---|
| `.env` | Local dev (`npx expo start`) |
| `.env.development` | EAS `development` profile |
| `.env.production` | EAS `production` profile |

Copy `.env.example` to `.env` for local dev:

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_ENV=development
```

---

## EAS Build (Android APK)

Requires an Expo account linked to the project (`eas.json` already has the project ID).

```bash
eas login
eas build --profile production --platform android
```

This builds a sideloadable APK using the production environment values from `.env.production`.

---

## Project structure

```
mobile/
├── app/            # Expo Router screens (file-based routing)
├── components/     # Shared UI components
├── services/       # API client, auth, Supabase
├── hooks/          # Custom React hooks
├── store/          # Zustand global state
├── utils/          # Geo, routing, clustering helpers
├── constants/      # Theme, campus graph
├── types/          # TypeScript domain types
├── mocks/          # Sample campus data
└── assets/         # Images and fonts
```

---

## Key screens

| Route | Screen |
|---|---|
| `/` | Splash / entry |
| `/onboarding` | Welcome + location permission |
| `/(tabs)/map` | Live campus map |
| `/(tabs)/search` | Place search + category filters |
| `/(tabs)/events` | Campus event feed |
| `/(tabs)/lost-found` | Lost & found board |
| `/building/[id]` | Building detail + directions |
| `/directions` | Turn-by-turn walking route |
| `/scan` | QR code scanner |
| `/ai-assistant` | Campus AI chat |
| `/freshers-tour` | Guided intro tour |
