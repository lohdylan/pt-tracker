# Requirements: PT Tracker

**Defined:** 2026-02-07
**Core Value:** Clients can open the app, see their workout info and exercise videos, and stay connected with their trainer — all in one place.

## v1 Requirements

Requirements for App Store launch. Each maps to roadmap phases.

### Quality & Polish

- [ ] **QA-01**: All 4 new features tested and working on iOS (workout logging UX, progress photos, push notifications, messaging)
- [ ] **QA-02**: UI is polished with consistent styling, typography, and spacing across all screens
- [ ] **QA-03**: All screens have proper loading indicators and empty state messages
- [ ] **QA-04**: Error handling covers network failures, invalid inputs, and edge cases with user-friendly messages
- [ ] **QA-05**: Client onboarding flow guides new users through first login and app orientation

### App Store

- [ ] **APP-01**: App has a professional icon and splash screen
- [ ] **APP-02**: App name is decided and configured
- [ ] **APP-03**: Privacy policy is created and accessible from the app
- [ ] **APP-04**: EAS Build is configured for iOS production builds
- [ ] **APP-05**: App Store listing has screenshots, description, and metadata
- [ ] **APP-06**: App is submitted to and approved by App Store review

### Infrastructure

- [ ] **INF-01**: Server is deployed to a production hosting provider
- [ ] **INF-02**: Production PostgreSQL database is provisioned and migrated
- [ ] **INF-03**: API is served over HTTPS with production JWT secret and environment config
- [ ] **INF-04**: Error tracking / monitoring is set up for server

## v2 Requirements

### Enhancements

- **ENH-01**: Animations and transitions for a premium feel
- **ENH-02**: App Store Optimization (keywords, preview video)
- **ENH-03**: Automated database backups
- **ENH-04**: Android support

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-app payments / billing | Not charging clients through the app yet |
| Multi-trainer support | Solo trainer only, may revisit for future SaaS |
| Android | iOS-only for initial launch, deferred to v2 |
| Web version | Mobile-first approach |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QA-01 | — | Pending |
| QA-02 | — | Pending |
| QA-03 | — | Pending |
| QA-04 | — | Pending |
| QA-05 | — | Pending |
| APP-01 | — | Pending |
| APP-02 | — | Pending |
| APP-03 | — | Pending |
| APP-04 | — | Pending |
| APP-05 | — | Pending |
| APP-06 | — | Pending |
| INF-01 | — | Pending |
| INF-02 | — | Pending |
| INF-03 | — | Pending |
| INF-04 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after initial definition*
