# Gym Training App — Design Spec
**Date:** 2026-03-29
**Status:** Approved

---

## Overview

A mobile-first gym training web app optimized for iPhone Safari. Users create structured training plans with scheduled days, log workouts live with set/rep/weight tracking, and track progress over time. No framework, no account, no backend — all data persists in localStorage.

---

## Tech Stack

- **HTML/CSS/JavaScript** — vanilla, no framework, no build step
- **ES Modules** — `<script type="module">`, fully supported in Safari
- **Chart.js** (CDN) — progress line charts
- **Google Fonts** — Barlow Condensed (headings), DM Sans (body)
- **ExerciseDB API** — `https://exercisedb-api.vercel.app`
- **localStorage** — all persistence (plans, sessions, settings, exercise cache)

---

## File Structure

```
traning_app/
├── index.html
├── styles.css
└── js/
    ├── app.js                    # Router, state, language, boot
    ├── db.js                     # All localStorage read/write
    ├── api.js                    # ExerciseDB fetch + cache
    ├── views/
    │   ├── home.js               # Dashboard, today's plan, weekly stats
    │   ├── plans.js              # Plan list, create/edit/delete/schedule
    │   ├── exercise-picker.js    # Browse by body part, search, add to plan
    │   ├── workout.js            # Active session, set logging, rest timer
    │   ├── history.js            # Past sessions list + session detail
    │   ├── progress.js           # Per-exercise Chart.js line charts
    │   └── settings.js           # Theme, language, rest timer, units, clear
    └── components/
        ├── rest-timer.js         # Countdown ring, vibrate, beep (Web Audio)
        └── nav.js                # Bottom nav bar, active tab
```

---

## Data Models (localStorage)

### `plans` — Array of plan objects
```json
{
  "id": "uuid",
  "name": "Push/Pull/Legs",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "scheduledDays": [1, 3, 5],
  "exercises": [
    {
      "exerciseId": "abc123",
      "name": "Bench Press",
      "type": "weights",
      "sets": 4,
      "reps": 8,
      "weight": 80,
      "order": 0
    }
  ]
}
```
`scheduledDays`: 0=Sunday, 1=Monday … 6=Saturday

### `sessions` — Array of completed workouts
```json
{
  "id": "uuid",
  "planId": "uuid",
  "planName": "Push/Pull/Legs",
  "date": "2026-04-03T18:30:00Z",
  "durationSeconds": 3600,
  "totalVolumeKg": 4200,
  "exercises": [
    {
      "exerciseId": "abc123",
      "name": "Bench Press",
      "type": "weights",
      "sets": [
        { "reps": 8, "weight": 80, "done": true },
        { "reps": 8, "weight": 82.5, "done": true }
      ]
    }
  ]
}
```

### `settings`
```json
{
  "theme": "dark",
  "language": "en",
  "restTimerSeconds": 90,
  "weightUnit": "kg"
}
```

### `exerciseCache`
```json
{
  "/api/v1/exercises/bodyPart/chest": {
    "data": [...],
    "cachedAt": 1743000000000
  }
}
```
Cache TTL: 7 days. On expiry, refetch and overwrite.

---

## Navigation

**Bottom nav bar** (4 tabs, always visible):
- 🏠 Home
- 💪 Plans
- ▶️ Workout *(active session only — grayed out if no session running)*
- 📊 History

**Top bar**: App title left, gear icon (Settings) right, language toggle (EN/SV) center.

View transitions: CSS slide-in/fade. No page reloads — all views are rendered into a single `#app` container.

---

## Views

### 1. Home / Dashboard
- Greeting with current date (e.g., "Good morning, Sunday 29 March")
- **Today's workout card**: if today matches a plan's scheduledDays and is within start/end date range, show the plan name and a "Start Workout" button
- Weekly summary: workouts completed this week, total volume lifted (kg or lbs)
- Quick-start button for last used plan

### 2. Plans
- List of all plans (cards: name, date range, scheduled days, exercise count)
- FAB (+) to create new plan
- Tap plan → Plan Detail: name, date range, day picker, exercise list
  - Add Exercise button → opens Exercise Picker
  - Reorder exercises (up/down buttons)
  - Delete exercise
  - Edit sets/reps/weight per exercise
- Long-press or swipe → delete plan (with confirmation)

### 3. Exercise Picker
- Opened from Plan Detail
- Header: body part filter chips (Chest, Back, Legs, Shoulders, Arms, Core, Cardio, All)
- Search bar: filters by exercise name (client-side after load)
- Exercise cards: GIF/image, name, target muscle, equipment
- Tap card → Exercise Detail modal: full image, instructions, tips
- "Add to Plan" button on detail → adds exercise to current plan (or to active session if opened mid-workout), closes picker
- Loading skeleton while API fetches
- Falls back to cached data if offline; shows error banner if no cache available

### 4. Active Workout Session
- Start from Home (today's plan) or Plans list
- Shows plan name, elapsed timer (hh:mm:ss)
- Exercise list: each exercise shows type-appropriate inputs
  - **Weights**: set rows with reps + weight inputs, checkbox to mark done
  - **Bodyweight**: set rows with reps input, checkbox
  - **Cardio**: duration input (minutes)
- ➕ Add exercise button (opens Exercise Picker mid-session)
- Rest timer: auto-starts when a set is checked done
  - Circular SVG progress ring, countdown display
  - Default from settings, adjustable per-session
  - Vibrates on finish (`navigator.vibrate([200, 100, 200])`)
  - Beep on finish (Web Audio API oscillator)
- **Finish Workout** button → confirms, calculates duration + total volume, saves session, navigates to History
- Session state persisted to localStorage so app can resume if Safari is closed

### 5. History
- Chronological list of sessions (date, plan name, duration, total volume)
- Filter bar: by plan name
- Tap session → Session Detail: full exercise/set/rep/weight breakdown
- Per-exercise progress link → opens Progress view for that exercise

### 6. Progress
- Accessible from History session detail or Settings
- Dropdown to select exercise
- Line chart (Chart.js): X=date, Y=max weight lifted (or total reps for bodyweight)
- Shows personal best annotation
- Date range filter: last 30 days / 90 days / all time

### 7. Settings
- Dark / Light mode toggle (dark default)
- Language toggle EN / SV
- Rest timer default (seconds, number input)
- Weight unit: kg / lbs (converts display only, stores in kg internally)
- Clear all data (red button, requires "Type DELETE to confirm" dialog)

---

## Language Support (EN / SV)

All UI strings go through a `t(key)` translation function in `app.js`. Language stored in `settings.language`. Toggle visible in top bar on every screen.

Key translations included (not exhaustive):
| Key | EN | SV |
|-----|----|----|
| nav.home | Home | Hem |
| nav.plans | Plans | Program |
| nav.workout | Workout | Träning |
| nav.history | History | Historik |
| plans.addExercise | Add Exercise | Lägg till övning |
| workout.start | Start Workout | Starta träning |
| workout.finish | Finish Workout | Avsluta träning |
| workout.restTimer | Rest Timer | Vilotimer |
| workout.sets | Sets | Set |
| workout.reps | Reps | Reps |
| workout.weight | Weight | Vikt |
| workout.duration | Duration | Tid |
| settings.title | Settings | Inställningar |
| history.title | History | Historik |

---

## Design System

- **Theme**: Dark default. CSS custom properties for all colors, toggled via `data-theme` on `<html>`.
- **Accent**: `#0A84FF` (electric blue)
- **Dark bg**: `#0C0C0E` base, `#1C1C1E` card surface
- **Light bg**: `#F2F2F7` base, `#FFFFFF` card surface
- **Fonts**: Barlow Condensed 600/700 for headings, DM Sans 400/500 for body
- **Border radius**: 16px cards, 12px buttons, 50% for circular elements
- **Tap targets**: minimum 44×44px on all interactive elements
- **Safe area**: `padding: env(safe-area-inset-top)` etc. on shell containers
- **Transitions**: 250ms ease slide for view changes, 150ms scale for button press
- **Micro-animations**: set checkbox triggers a green checkmark scale-in; rest timer ring animates with CSS stroke-dashoffset

---

## API Integration

Base URL: `https://exercisedb-api.vercel.app`

| Endpoint | Used for |
|----------|----------|
| `GET /api/v1/exercises/bodyPartList` | Populate body part filter chips |
| `GET /api/v1/exercises/bodyPart/:part` | Load exercises for a filter chip |
| `GET /api/v1/exercises/:id` | Exercise detail modal |

- All responses cached in `exerciseCache` with 7-day TTL
- Loading state: skeleton card placeholders (CSS animated shimmer)
- Offline: serve from cache; if no cache show "No connection — cached data unavailable" banner

---

## Error Handling

- API unreachable + no cache → show error banner in exercise picker, picker still opens but empty
- Session in-progress + Safari closed → restore from `activeSession` localStorage key on next open
- Invalid/missing plan dates → treat plan as always active (show in Today's workout)

---

## Out of Scope

- Push notifications / reminders (not reliably supported on iOS Safari without home screen install)
- User accounts or cloud sync
- Social features
- Video playback (GIF from API only)
