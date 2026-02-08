---
phase: "03-production-infrastructure"
plan: "01"
subsystem: "server-build-and-monitoring"
tags: ["typescript", "sentry", "production", "ssl", "build-system"]

dependency-graph:
  requires: []
  provides:
    - "Compiled JS build output in server/dist/"
    - "Sentry error tracking via --import instrumentation"
    - "SSL-aware PostgreSQL connection for Railway"
    - "Production start script (npm run start)"
  affects:
    - "03-02 (Railway deployment needs build output)"
    - "03-03 (environment variables include SENTRY_DSN)"

tech-stack:
  added:
    - "@sentry/node ^10.38.0"
  patterns:
    - "ESM modules with type:module in package.json"
    - "Sentry --import instrumentation pattern (loads before all modules)"
    - "Conditional SSL based on NODE_ENV"

key-files:
  created:
    - "server/src/instrument.ts"
  modified:
    - "server/package.json"
    - "server/tsconfig.json"
    - "server/src/index.ts"
    - "server/src/db.ts"

key-decisions:
  - id: "03-01-01"
    decision: "Added type:module to package.json and fixed start script to .js (not .mjs)"
    reason: "Node requires type:module for ESM .js files; tsc outputs .js not .mjs"
    alternatives: "Could have used .mjs extension via tsc config but type:module is simpler"

metrics:
  duration: "2m 37s"
  completed: "2026-02-08"
---

# Phase 03 Plan 01: Production Build, Sentry, and SSL Summary

TypeScript compiles to dist/ with source maps, Sentry instruments via --import before all modules, Express error handler captures unhandled errors, PostgreSQL uses SSL when NODE_ENV=production.

## Performance

| Metric | Value |
|--------|-------|
| Duration | 2m 37s |
| Start | 2026-02-08T00:30:39Z |
| End | 2026-02-08T00:33:16Z |
| Tasks | 2/2 |
| Files created | 1 |
| Files modified | 4 |

## Accomplishments

1. **TypeScript build pipeline** -- `npm run build` compiles src/ to dist/ with source maps, copies 12 migration SQL files to dist/migrations/
2. **Sentry error tracking** -- instrument.ts loaded via `--import` flag before all other modules; setupExpressErrorHandler registered after all routes
3. **SSL-aware database** -- pg.Pool enables SSL with `rejectUnauthorized: false` when NODE_ENV=production (Railway PostgreSQL requires it)
4. **Production start script** -- `npm run start` runs compiled JS with Sentry instrumentation
5. **ESM compatibility** -- Added `"type": "module"` to package.json so Node recognizes .js files as ESM modules

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Install Sentry, configure tsconfig and build scripts | fbd4210 | @sentry/node, sourceMap, build/start scripts |
| 2 | Create Sentry instrument, error handler, SSL db | c9f4302 | instrument.ts, setupExpressErrorHandler, SSL pool, type:module |

## Files Created

| File | Purpose |
|------|---------|
| server/src/instrument.ts | Sentry.init loaded via --import before all modules |

## Files Modified

| File | Changes |
|------|---------|
| server/package.json | Added @sentry/node, build/start/copy-migrations scripts, type:module |
| server/tsconfig.json | Added sourceMap:true, declaration:false |
| server/src/index.ts | Added Sentry import, setupExpressErrorHandler, fallback error handler |
| server/src/db.ts | Added conditional SSL based on NODE_ENV |

## Decisions Made

### 03-01-01: ESM type:module and .js start script
- **Decision:** Added `"type": "module"` to server/package.json and referenced `./dist/instrument.js` (not `.mjs`) in start script
- **Reason:** TypeScript with `module: ES2022` outputs `.js` files with import/export syntax. Without `"type": "module"`, Node treats `.js` as CommonJS and fails on ESM syntax. The plan originally referenced `.mjs` but tsc does not output `.mjs` files by default.
- **Impact:** All .js files in server/ are now treated as ESM by Node. This is correct since tsc already outputs ESM syntax. Dev workflow via tsx is unaffected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESM module resolution for production Node**
- **Found during:** Task 2 verification
- **Issue:** Plan specified `--import ./dist/instrument.mjs` but tsc outputs `.js` files. Without `"type": "module"` in package.json, `node dist/index.js` would fail with ERR_REQUIRE_ESM since the files contain ESM import/export syntax.
- **Fix:** Added `"type": "module"` to package.json and changed start script from `instrument.mjs` to `instrument.js`
- **Files modified:** server/package.json
- **Commit:** c9f4302

## Issues Encountered

None beyond the ESM deviation above, which was resolved immediately.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` completes without errors | PASS |
| dist/ contains instrument.js and index.js | PASS |
| dist/ contains source maps (.js.map) | PASS |
| dist/migrations/ contains 12 SQL files | PASS |
| Dev server starts via tsx (no regression) | PASS |
| Production server starts via npm run start | PASS |
| Health endpoint responds in both modes | PASS |

## Next Phase Readiness

- **03-02 (Railway deployment):** Server builds to dist/, start script works, SSL enabled for production DB. Ready for Railway configuration.
- **03-03 (Environment/secrets):** SENTRY_DSN env var referenced but optional (Sentry silently disables without it). Will need to be set in Railway environment.
- **Blockers:** None

## Self-Check: PASSED
