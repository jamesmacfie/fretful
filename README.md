# Fretful

Fretful is a local-first progressive guitar fretboard note trainer built with TanStack Start. It teaches single-note recall across a standard 6-string guitar from fret 0 through fret 24 using small course zones, audio reinforcement, quiz modes, and weak-spot review.

The app has no login, backend, database, or server-side progress sync. Settings and learning progress are stored in the browser with `localStorage`.

## Features

- Progressive course map for beginner, intermediate, and advanced fretboard recall.
- Full 6 string x 25 fret board, with active-zone highlighting for each lesson.
- Quiz modes: Study, Name the Note, Find the Note, Find All, Pace, and Audio Match.
- Web Audio note playback that starts only after an explicit user gesture.
- Local review scheduling with per-note and per-cell accuracy, response time, streaks, lapses, and due dates.
- Review heatmaps for weak strings, frets, and notes.
- Settings for handedness, sharps/flats, labels, fret numbers, timers, sound, spoken prompts, auto-advance, timbre placeholder, and high contrast.
- JSON export/import for progress backup.

## Tech Stack

- TanStack Start and TanStack Router
- React 19
- Vite
- TypeScript
- Zod for persisted progress validation
- Vitest and React Testing Library
- Biome for linting and formatting
- Cloudflare Vite plugin and Wrangler for Cloudflare Workers deployment

## Routes

- `/` - Home and continue panel
- `/course` - Tiered course map
- `/lesson?moduleId=...&mode=...` - Lesson and quiz surface
- `/review` - Weak-spot heatmaps and recommended practice
- `/settings` - Display, audio, progress import/export, and privacy settings

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The app runs at:

```text
http://127.0.0.1:3000
```

## Verification

Run the test suite:

```bash
npm run test
```

Run Biome checks:

```bash
npm run check
```

Build for production:

```bash
npm run build
```

## Cloudflare Deployment

This project is configured for Cloudflare Workers in `wrangler.jsonc`.

Current Worker config:

- Worker name: `fretful`
- Compatibility date: `2026-05-24`
- Entry point: `@tanstack/react-start/server-entry`
- Observability enabled

Authenticate Wrangler:

```bash
npx wrangler login
npx wrangler whoami
```

Deploy:

```bash
npm run deploy
```

The deploy script runs:

```bash
npm run build && wrangler deploy
```

No Cloudflare KV, D1, R2, Durable Objects, or secrets are required for v1 because all learner progress is local to the browser.

## Persistence

Fretful stores one versioned progress object in `localStorage` under:

```text
fretful:v1
```

The stored data includes settings, unlocked course modules, completed checkpoints, per-cell stats, per-note stats, and the review queue. Corrupt or invalid storage falls back to defaults. Private/incognito browsing may clear progress when the private session closes, so the Settings page includes export/import controls for backup.

## Repository Notes

- Generated build output is ignored with `dist`.
- Wrangler local state is ignored with `.wrangler`.
- The app intentionally avoids chords, scales, microphone validation, accounts, and backend sync in v1.
