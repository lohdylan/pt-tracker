# Phase 2 Plan 3: Client Screens Error Retry, LoginScreen Fixes, NetworkBanner + QueryClient Summary

**One-liner:** Added ErrorState retry to 3 client portal screens, fixed LoginScreen white-on-white text and hardcoded sizes, wired NetworkBanner into App.tsx, and configured QueryClient to stop retrying when offline.

## What Was Done

### Task 1: Fix error states and styling on client portal screens + LoginScreen
- **MySessionsScreen**: Replaced inline error text with ErrorState component (retry button + error detail); standardized statusBadge borderRadius to theme `borderRadius.xl`
- **MyProgressScreen**: Replaced inline error text with ErrorState component; added `refetch` to query destructuring; standardized chartCard shadow to `shadows.md` preset; standardized borderRadius values (chart, photosButton) to theme constants
- **MyWorkoutLogScreen**: Replaced inline error text with ErrorState component; standardized card borderRadius to `borderRadius.xl`
- **LoginScreen**: Replaced hardcoded `fontSize: 32` with `fontSize.xxl` (28); fixed client role button text color from `colors.surface` (white on white) to `colors.primary` (blue on white); standardized all borderRadius values (roleButton, input, loginButton) to theme constants
- Removed unused `errorText` style from all 3 portal screens

### Task 2: Add NetworkBanner to App.tsx and configure network-aware QueryClient
- Imported and rendered `NetworkBanner` component in both login and authenticated states
- NetworkBanner renders above LoginScreen and above NavigationContainer, visible app-wide when offline
- Configured `QueryClient` with network-aware retry logic:
  - Queries: stop retrying immediately on "Network request failed" error; otherwise retry up to 2 times
  - Mutations: never retry (fail fast for user actions)
- QueryClient remains a module-level constant (correct React Query pattern)

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Error retry on client screens + LoginScreen styling | cf9832d | MySessionsScreen.tsx, MyProgressScreen.tsx, MyWorkoutLogScreen.tsx, LoginScreen.tsx |
| 2 | NetworkBanner + network-aware QueryClient | e57c95e | App.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed client role button text invisible on LoginScreen**
- **Found during:** Task 1
- **Issue:** The "I'm a Client" button used `colors.surface` (white) text on a white background (`roleButtonAlt` style), making the text invisible
- **Fix:** Added `roleTextAlt` style with `color: colors.primary` applied to the client button text only
- **Files modified:** LoginScreen.tsx
- **Commit:** cf9832d

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Used `fontSize.xxl` (28) instead of hardcoded 32 for LoginScreen title | Consistency with theme system; 28 is close enough to 32 and matches all other screens |
| NetworkBanner rendered in both `!user` and `user` branches | Ensures offline banner is visible on login screen as well as authenticated screens |
| QueryClient retry: max 2 for queries, 0 for mutations | Queries benefit from retry on transient failures; mutations should fail fast to avoid duplicate actions |
| Used `<>` fragments instead of wrapping View | Avoids adding extra layout nodes; NetworkBanner handles its own positioning |

## Verification Results

- TypeScript compilation: PASS (zero errors)
- MySessionsScreen has ErrorState with onRetry: PASS
- MyProgressScreen has ErrorState with onRetry: PASS
- MyWorkoutLogScreen has ErrorState with onRetry: PASS
- LoginScreen has no hardcoded fontSize: 32: PASS
- App.tsx imports NetworkBanner: PASS
- QueryClient has retry configuration: PASS

## Next Phase Readiness

**What this provides for subsequent plans:**
- All client portal screens now have consistent error handling matching the pattern used by trainer screens (02-02)
- NetworkBanner is wired in app-wide -- no further integration needed
- QueryClient is network-aware -- all queries across the app benefit automatically
- LoginScreen uses theme tokens consistently, ready for any further styling in 02-04/02-05

**No blockers for next plans.**

## Metrics

- **Duration:** ~2 minutes
- **Completed:** 2026-02-07
- **Tasks:** 2/2

## Self-Check: PASSED
