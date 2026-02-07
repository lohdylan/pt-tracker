# PT Tracker

## What This Is

A personal training app for a solo trainer to manage clients, schedule sessions, log workouts, track measurements, share exercise demo videos, and communicate with clients. Clients log in with access codes to see their own sessions, progress, exercises, and message their trainer. The app is built with React Native (Expo) and an Express/PostgreSQL backend.

## Core Value

Clients can open the app, see their workout info and exercise videos, and stay connected with their trainer — all in one place.

## Requirements

### Validated

- ✓ Trainer can manage clients (CRUD, photos, access codes) — existing
- ✓ Trainer can schedule and manage sessions with calendar view — existing
- ✓ Trainer can log workouts with exercises, sets, and notes — existing
- ✓ Trainer can record client measurements and view progress charts — existing
- ✓ Trainer can create exercise library with uploaded videos and YouTube links — existing
- ✓ YouTube videos embed inline in exercise detail screen — existing
- ✓ Clients log in with access codes and see their sessions, progress, exercises, and logs — existing
- ✓ Push notifications for session reminders and workout updates — existing
- ✓ In-app messaging between trainer and clients — existing
- ✓ Progress photo uploads and comparison — existing
- ✓ JWT authentication with role-based access (trainer/client) — existing

### Active

- [ ] Polish UI for professional, App Store-quality look and feel
- [ ] Fix bugs and test all 4 new features on mobile (workout UX, photos, notifications, messaging)
- [ ] Deploy server to production hosting (simplest/cheapest option)
- [ ] Configure Expo for production iOS build (EAS Build)
- [ ] Create app icon, splash screen, and App Store assets
- [ ] Publish to the Apple App Store
- [ ] Choose an app name

### Out of Scope

- In-app payments / billing — not charging clients through the app yet
- Multi-trainer support — solo trainer only for now, may revisit later
- Android — iOS only for initial launch
- Web version — mobile-first

## Context

- Existing codebase with 12 migrations, 11 API routes, 26 screens, fully functional in development
- 4 new features (workout logging UX, photo progress, push notifications, messaging) are code-complete but untested on mobile
- Currently runs on localhost; no production deployment exists
- Trainer has ~3 clients, 1 actively using the service
- No Apple Developer account yet ($99/year required)
- No test suite exists — manual testing only
- Codebase mapped in `.planning/codebase/`

## Constraints

- **Platform**: iOS only (App Store) — Expo/React Native
- **Hosting**: Cheapest/simplest production server option (likely Railway, Render, or Fly.io)
- **Database**: PostgreSQL (already in use)
- **Budget**: Minimize costs — small client base, solo trainer
- **Apple**: Must pass App Store review guidelines

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo + React Native | Already built with it, works well for iOS | ✓ Good |
| Express 5 + PostgreSQL | Already built, simple and sufficient | ✓ Good |
| iOS-only launch | Small user base, simplifies App Store process | — Pending |
| App name | Needs to be decided before App Store submission | — Pending |
| Hosting provider | Need to evaluate cheapest option (Railway/Render/Fly) | — Pending |

---
*Last updated: 2026-02-07 after initialization*
