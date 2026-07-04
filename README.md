# PathFindr

**A campus navigation app built for LASUSTECH students.**

PathFindr solves a real problem every new and returning student faces on a large university campus: not knowing where anything is. Finding lecture halls, navigating between departments, locating facilities, checking upcoming events, and recovering lost items — all of this used to require asking around or getting lost. PathFindr puts everything in one app with a live interactive map, walking directions, an AI assistant that understands the campus, and a lost & found board.

---

## The Problem

LASUSTECH is a large technical university. Students — especially freshers — regularly waste time wandering to find buildings, miss events because there's no central feed, and lose items with no easy way to report or recover them. There's no dedicated digital tool for campus navigation and information. PathFindr fixes that.

---

## Architecture

```
pathfindr/
├── mobile/       # React Native / Expo app  ← primary product
├── backend/      # Django REST API           ← data + AI layer
└── frontend/     # React / Vite landing page ← web presence
```

### Mobile — Expo (primary focus)

Built with **Expo SDK 54** and **Expo Router** for file-based navigation. The entire app is written in TypeScript and targets Android as the primary platform (APK distributed via EAS Build).

Expo packages used:

| Package | Purpose |
|---|---|
| `expo-router` | File-based screen navigation |
| `expo-location` | Live GPS position on the campus map |
| `expo-camera` | QR code scanning on campus signage |
| `expo-notifications` | Push notifications for events and alerts |
| `expo-image` | Optimised building photos and thumbnails |
| `expo-image-picker` | Photo upload for lost & found reports |
| `expo-secure-store` | Secure token storage for auth |
| `expo-splash-screen` | Branded launch experience |
| `expo-haptics` | Tactile feedback on interactions |
| `expo-blur`, `expo-linear-gradient` | Visual polish throughout the UI |
| `expo-sharing` | Share building info and directions |
| `expo-font` | Custom typography (DM Sans, Poppins) |

State is managed with **Zustand**, server data with **TanStack Query**, and auth tokens are persisted via **Supabase** + `expo-secure-store`.

### Backend — Django

**Django 6** REST API serving buildings, events, lost & found items, user auth, and the AI chat endpoint. Deployed to **Render** with a free-tier PostgreSQL database.

- `djangorestframework` + `SimpleJWT` for authenticated endpoints
- `drf-spectacular` for auto-generated OpenAPI docs
- `django-ratelimit` to protect the AI endpoint from abuse
- Campus graph and Dijkstra routing implemented in Python for walking directions
- `seed_lasustech_data` management command pre-populates the full campus dataset

### AI — Sarvam AI

The AI assistant (`/ai-assistant` screen) is powered by **Sarvam AI** (`sarvam-105b` model) via the `sarvamai` Python SDK. The backend:

1. Builds a live system prompt from the current campus building database (refreshed every 60 seconds)
2. Passes the last 6 messages of conversation history for context
3. Augments user messages with course-to-building hints when a course code is detected
4. Returns structured JSON with intent classification (`navigate` / `info` / `general`), a building ID, and a natural language response
5. If intent is `navigate`, it immediately computes and returns a walking route to the building

The AI knows the full LASUSTECH campus — every building, department, and facility — and can answer questions, give directions, and remember context across a conversation.

### Frontend — React / Vite

Landing page and admin panel built with **React + Vite + TypeScript**. Provides a web presence and is deployed alongside the backend on Render.

---

## Tracks

- **Expo Track** — The entire mobile product is built on Expo SDK 54 with Expo Router, EAS Build, and 14 Expo packages.
- **Sarvam Track** — The campus AI assistant is powered by Sarvam AI (`sarvam-105b`) via the official Python SDK, with campus-aware context injection and structured response parsing.

## Theme

- **🏙️ Infrastructure, Mobility & Smart Systems** — Campus navigation, wayfinding, and information infrastructure for a technical university.
- **🎓 Learning & Knowledge Systems** — Helps students find their way to classes, locate departments, and stay informed about campus life.

---

## GitHub

https://github.com/jayo14/pathfindr

---

## How to use Expo

Expo is the foundation of the entire mobile app, not just a build tool. Expo Router drives all navigation — every screen is a file in the `app/` directory. EAS Build compiles the production APK with `.env.production` values baked in. The app uses 14 Expo SDK packages for location, camera, notifications, secure storage, image handling, and UI polish. No bare React Native config was written manually — all native configuration is managed through Expo's config plugin system in `app.json`.

## How to use Sarvam AI

Sarvam AI powers the `/ai-assistant` screen. The Django backend initialises a `SarvamAI` client using `api_subscription_key` from the environment. On each chat message, it builds a system prompt containing every building on campus (name, code, category, description, coordinates), appends the recent conversation history, and calls `client.chat.completions(model="sarvam-105b", messages=[...])`. The model returns JSON with an intent, an optional building ID, and a response. When the intent is `navigate`, the backend runs a Dijkstra route calculation and returns the full walking path alongside the AI's reply.

---

## Running locally

### Mobile

```bash
cd mobile
bun install
npx expo start
```

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in AI_SUBSCRIPTION_KEY etc.
python manage.py migrate
python manage.py seed_lasustech_data
python manage.py runserver
```

### Build APK

```bash
cd mobile
eas build --profile production --platform android
```

---

## Tags

React Native, Expo, Django, Sarvam AI, TypeScript, PostgreSQL, Campus Navigation, Wayfinding, AI Assistant, Mobile
