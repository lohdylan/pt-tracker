# Roadmap: PT Tracker

## Overview

PT Tracker is a fully built personal training app that needs to go from working-in-development to live-on-the-App-Store. The journey is: verify the 4 new features actually work on device, polish the UI to professional quality, deploy the backend to production, prepare all App Store assets, and submit. Every phase produces a verifiable, shippable improvement over the last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Feature Verification** - Test all 4 new features on iOS and fix what is broken
- [ ] **Phase 2: UI Polish & UX Hardening** - Make every screen look professional and handle all edge cases
- [ ] **Phase 3: Production Infrastructure** - Deploy server, database, and monitoring to production
- [ ] **Phase 4: App Store Preparation** - Name, icon, splash, privacy policy, EAS config, and listing
- [ ] **Phase 5: App Store Submission** - Submit the app and get approved

## Phase Details

### Phase 1: Feature Verification
**Goal**: All 4 new features (workout logging UX, progress photos, push notifications, messaging) work correctly on a real iOS device
**Depends on**: Nothing (first phase)
**Requirements**: QA-01
**Success Criteria** (what must be TRUE):
  1. Trainer can create workout logs with exercise selection, set details (weight/reps), and notes -- and they persist after app restart
  2. Trainer and client can upload progress photos, view them in a timeline, and use the side-by-side comparison screen
  3. Client receives a push notification when a session is scheduled or a measurement is recorded, and tapping the notification opens the relevant screen
  4. Trainer and client can exchange messages in real time, unread badges update correctly, and conversation history persists
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md -- Fix DEV_HOST IP and verify workout logging UX on device ✓ 2026-02-07
- [ ] 01-02-PLAN.md -- Fix photo comparison edge case and verify progress photos on device
- [ ] 01-03-PLAN.md -- Fix messaging bugs and verify bidirectional messaging on device
- [ ] 01-04-PLAN.md -- Configure EAS/push, add session notification, verify push notifications via dev build

### Phase 2: UI Polish & UX Hardening
**Goal**: Every screen in the app looks professionally designed and handles loading, empty, and error states gracefully
**Depends on**: Phase 1
**Requirements**: QA-02, QA-03, QA-04, QA-05
**Success Criteria** (what must be TRUE):
  1. All screens share a consistent color palette, font sizes, spacing, and component styling -- no screen looks like it belongs to a different app
  2. Every data-fetching screen shows a spinner or skeleton while loading and a helpful message when there is no data yet
  3. Disconnecting from the network and performing any action shows a clear error message (not a crash or silent failure)
  4. A new client logging in for the first time sees an onboarding flow that explains what the app does and how to navigate it
  5. Form inputs validate inline (e.g., empty fields, invalid formats) and display errors before submission
**Plans**: TBD

Plans:
- [ ] 02-01: Design system and consistent styling pass across all screens
- [ ] 02-02: Loading states, empty states, and error handling across all screens
- [ ] 02-03: Client onboarding flow

### Phase 3: Production Infrastructure
**Goal**: The API and database are running in production with HTTPS, proper secrets, and basic monitoring
**Depends on**: Phase 1
**Requirements**: INF-01, INF-02, INF-03, INF-04
**Success Criteria** (what must be TRUE):
  1. The mobile app can connect to the production API URL over HTTPS and perform all operations (auth, CRUD, file uploads)
  2. Production database has all 12 migrations applied and contains seed data for the trainer account
  3. Environment variables (JWT_SECRET, database URL) are set via the hosting provider's secret management -- not hardcoded
  4. Server errors are captured by a monitoring service and the trainer can be alerted when something breaks
**Plans**: TBD

Plans:
- [ ] 03-01: Deploy server and database to production hosting
- [ ] 03-02: Production environment config, HTTPS, and secrets
- [ ] 03-03: Error tracking and monitoring setup

### Phase 4: App Store Preparation
**Goal**: The app has a name, professional branding, privacy policy, production build config, and a complete App Store listing ready to submit
**Depends on**: Phase 2, Phase 3
**Requirements**: APP-01, APP-02, APP-03, APP-04, APP-05
**Success Criteria** (what must be TRUE):
  1. The app has a decided name that appears in the splash screen, app icon, and App Store listing
  2. App icon renders correctly on the iOS home screen at all required sizes, and the splash screen displays on launch
  3. A privacy policy URL is accessible from within the app (e.g., settings screen) and covers data collection practices
  4. Running `eas build --platform ios` produces a signed .ipa file that installs and runs on a physical device via TestFlight
  5. App Store Connect has a complete listing with screenshots (at minimum iPhone 15 Pro size), description, keywords, and category
**Plans**: TBD

Plans:
- [ ] 04-01: App naming, icon, and splash screen
- [ ] 04-02: Privacy policy and legal
- [ ] 04-03: EAS Build configuration for iOS production
- [ ] 04-04: App Store listing (screenshots, description, metadata)

### Phase 5: App Store Submission
**Goal**: The app is submitted to Apple and passes review
**Depends on**: Phase 4
**Requirements**: APP-06
**Success Criteria** (what must be TRUE):
  1. App is submitted through App Store Connect with all required metadata, screenshots, and build
  2. App passes Apple's review and is approved for sale (or free download) on the App Store
  3. A real client can download the app from the App Store, log in with their access code, and see their sessions
**Plans**: TBD

Plans:
- [ ] 05-01: Final pre-submission checklist and TestFlight validation
- [ ] 05-02: App Store submission and review response

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
(Phases 2 and 3 can run in parallel after Phase 1 completes)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Feature Verification | 1/4 | In progress | - |
| 2. UI Polish & UX Hardening | 0/3 | Not started | - |
| 3. Production Infrastructure | 0/3 | Not started | - |
| 4. App Store Preparation | 0/4 | Not started | - |
| 5. App Store Submission | 0/2 | Not started | - |
