# Codebase Concerns

**Analysis Date:** 2026-02-07

## Tech Debt

**Express 5 Migration Workarounds:**
- Issue: Express 5 merged params requires `as unknown as P` type assertions throughout all routes
- Files: `server/src/routes/measurements.ts` (lines 11, 21, 60, 94), `server/src/routes/progressPhotos.ts` (lines 35, 50, 64), `server/src/routes/workoutLogs.ts` (lines 11, 33, 45, 96, 128, 142)
- Impact: Type safety degraded, potential runtime errors if param types change
- Fix approach: Wait for Express 5 stable release with proper TypeScript support, or create typed middleware wrapper for param extraction

**React Native FormData Type Mismatches:**
- Issue: File uploads require `as unknown as Blob` casts because React Native's FormData doesn't match web API
- Files: `mobile/src/api.ts` (lines 51, 63, 75)
- Impact: Type system can't validate file upload payloads
- Fix approach: Create typed wrapper functions for file uploads or use platform-specific types

**Loose Type Assertions in Form Submissions:**
- Issue: Form payloads cast to `any` during mutations
- Files: `mobile/src/screens/calendar/SessionFormScreen.tsx` (lines 101, 108), `mobile/src/screens/workouts/TemplateFormScreen.tsx` (lines 144-145)
- Impact: No compile-time validation of API contracts
- Fix approach: Define explicit payload types matching API schemas and remove `any` casts

**Hardcoded Dev Secret as Fallback:**
- Issue: JWT_SECRET defaults to "dev-secret-change-me" if env var not set
- Files: `server/src/middleware/auth.ts` (line 4), `server/src/routes/auth.ts` (line 7)
- Impact: Production deployment without proper JWT_SECRET would use known value
- Fix approach: Throw error on startup if JWT_SECRET not provided, document requirement clearly

**Hardcoded IP Address in Mobile API Client:**
- Issue: LAN IP hardcoded in api.ts for development
- Files: `mobile/src/api.ts` (line 4: `const DEV_HOST = "192.168.1.68"`)
- Impact: Breaks for other developers, requires code change per environment
- Fix approach: Move to environment variable or config file

**No Migration Rollback Support:**
- Issue: Migration system only supports forward migrations, no down/rollback
- Files: `server/src/migrate.ts`
- Impact: Cannot undo migrations in case of issues, requires manual SQL intervention
- Fix approach: Add down migrations and rollback command

## Known Bugs

**Console Logging in Production Code:**
- Symptoms: console.log/console.error throughout server code
- Files: `server/src/index.ts`, `server/src/migrate.ts`, `server/src/seed.ts`, `server/src/services/scheduler.ts`, `server/src/services/pushService.ts`
- Trigger: All server operations log to console
- Workaround: None - logs are basic operational info
- Fix: Implement structured logging library (winston/pino) with log levels

**Unhandled Database Query Rejections:**
- Symptoms: Most routes lack try/catch blocks around database queries
- Files: Most routes in `server/src/routes/*.ts` (only 2 try/catch blocks found in workoutLogs.ts batch operations)
- Trigger: Database connection failures or query errors will crash server
- Workaround: None
- Fix: Add global error handler middleware and wrap route handlers

**Promise.all Without Error Isolation in Analytics:**
- Symptoms: Dashboard query uses Promise.all with 6 queries - if one fails, all fail
- Files: `server/src/routes/analytics.ts` (lines 27-83)
- Trigger: Any single query error prevents entire dashboard from loading
- Workaround: None
- Fix: Use Promise.allSettled or individual error handling per query

**Client Conversation Query Returns Empty Array for New Clients:**
- Symptoms: Client with no messages gets empty result from conversation query
- Files: `server/src/routes/messages.ts` (lines 26-33)
- Trigger: New client opening messaging tab
- Workaround: Client code may handle gracefully, needs testing
- Fix: Add fallback to return client info even if no messages exist

## Security Considerations

**Missing Environment File Protection:**
- Risk: No .env file exists but also not in .gitignore - could be committed
- Files: `.gitignore` lacks `.env`, `.env.*` entries
- Current mitigation: No .env files currently exist (secrets passed via command line)
- Recommendations: Add `.env*` to .gitignore, create .env.example template

**No Rate Limiting:**
- Risk: Auth endpoints vulnerable to brute force attacks
- Files: `server/src/routes/auth.ts`
- Current mitigation: None
- Recommendations: Add express-rate-limit middleware to auth routes

**SELECT * Queries Expose Internal Schema:**
- Risk: 13 routes use `SELECT *`, potentially exposing internal columns to API consumers
- Files: All routes in `server/src/routes/*.ts`
- Current mitigation: None - but API is trainer/client authenticated
- Recommendations: Specify column names explicitly, especially for sensitive tables like clients

**File Uploads Lack Validation:**
- Risk: Photo/video uploads accept any file without content-type validation beyond extension
- Files: `server/src/routes/clients.ts` (multer config line 19), `server/src/routes/exercises.ts`, `server/src/routes/progressPhotos.ts`
- Current mitigation: 5MB file size limit
- Recommendations: Add MIME type validation, file signature checks, antivirus scanning for production

**Push Notifications Contain Client Data:**
- Risk: Expo push notifications include client names in body, stored on Expo servers
- Files: `server/src/services/scheduler.ts` (line 44), `server/src/routes/messages.ts` (line 92)
- Current mitigation: No PHI/sensitive data in notifications beyond names
- Recommendations: Use generic messages, require app open to view details

**No HTTPS Enforcement:**
- Risk: Server runs on HTTP, credentials and tokens transmitted in clear text
- Files: `server/src/index.ts`
- Current mitigation: Development only currently
- Recommendations: Add HTTPS termination (nginx/cloudflare) or enforce TLS in Express for production

**CORS Wide Open:**
- Risk: `cors()` with no options allows any origin
- Files: `server/src/index.ts` (line 23)
- Current mitigation: Bearer token authentication required
- Recommendations: Restrict origins to known mobile app or web domain

## Performance Bottlenecks

**N+1 Query in Client List with Messages:**
- Problem: Conversation list query for trainer uses lateral join but could be slow with many clients
- Files: `server/src/routes/messages.ts` (lines 10-20)
- Cause: Subquery per client for unread count
- Improvement path: Add indexes on messages(client_id, read_at, sender_role), or materialize unread counts

**Large Screen Components:**
- Problem: Multiple screens exceed 400 lines, complex rendering logic
- Files: `mobile/src/screens/clients/ClientDetailScreen.tsx` (581 lines), `mobile/src/screens/workouts/WorkoutLogScreen.tsx` (567 lines), `mobile/src/screens/workouts/TemplateFormScreen.tsx` (430 lines), `mobile/src/screens/clients/ClientFormScreen.tsx` (424 lines)
- Cause: Co-located state management, inline handlers, multiple tabs/sections per screen
- Improvement path: Extract custom hooks for business logic, split into sub-components

**Dashboard Polling Every Minute:**
- Problem: Dashboard uses `refetchInterval: 60_000` to poll analytics
- Files: `mobile/src/hooks/useDashboard.ts` (line 9)
- Cause: No websocket/real-time update mechanism
- Improvement path: Increase interval or add push-based updates for critical changes only

**No Database Indexes Documented:**
- Problem: 12 migrations but no explicit index creation noted in concerns analysis
- Files: All migrations in `server/src/migrations/*.sql` (need individual review)
- Cause: May rely on primary keys only
- Improvement path: Audit query patterns and add indexes on foreign keys, date filters (scheduled_at), status columns

**Uploads Directory Grows Unbounded:**
- Problem: Uploaded files never deleted, directory grows indefinitely
- Files: `server/uploads/` directory, `server/src/routes/clients.ts`, `server/src/routes/exercises.ts`, `server/src/routes/progressPhotos.ts`
- Cause: No cleanup logic for replaced photos or deleted records
- Improvement path: Add cascade delete cleanup, or move to cloud storage with TTL

## Fragile Areas

**Workout Log Batch Insert Transaction:**
- Files: `server/src/routes/workoutLogs.ts` (lines 44-90)
- Why fragile: Manual transaction with loop, rollback throws error that might not be caught
- Safe modification: Test with empty logs array, invalid exercise IDs, duplicate sort_order
- Test coverage: Unknown - no test files found in codebase

**Session Reminder Scheduler:**
- Files: `server/src/services/scheduler.ts`
- Why fragile: Runs every 5 minutes on single interval, no distributed lock, will send duplicates if multiple server instances
- Safe modification: Add distributed lock (Redis), idempotency check before sending
- Test coverage: None apparent

**Mobile Auth Token Storage:**
- Files: `mobile/src/AuthContext.tsx`, `mobile/src/api.ts`
- Why fragile: Token stored in AsyncStorage, set in module-level closure, no refresh mechanism
- Safe modification: Always check AsyncStorage before api calls, handle token expiration gracefully
- Test coverage: No error boundary if AsyncStorage fails or returns corrupted data

**Navigation with Deep Linking:**
- Files: `mobile/App.tsx` (412 lines)
- Why fragile: 26 screens, 11 navigators, complex tab/stack nesting, notification tap handling
- Safe modification: Test all navigation paths, especially cross-tab navigation and back button
- Test coverage: No automated navigation tests

**Exercise Search in Large DB:**
- Files: `mobile/src/screens/workouts/WorkoutLogScreen.tsx`, `mobile/src/components/ExercisePicker.tsx`
- Why fragile: Search may return unbounded results, no pagination
- Safe modification: Add limit clause to search query, test with 1000+ exercises
- Test coverage: Unknown

## Scaling Limits

**Single Server Instance:**
- Current capacity: One Express server with in-memory scheduler interval
- Limit: Cannot horizontally scale without duplicate notifications
- Scaling path: Move scheduler to separate service, add Redis for distributed state, use job queue (BullMQ)

**Postgres Connection Pool:**
- Current capacity: Default pg.Pool (10 connections typically)
- Limit: Concurrent request capacity limited by connection pool
- Scaling path: Configure pool size based on load, add connection pooling proxy (PgBouncer)

**File Storage on Disk:**
- Current capacity: Local `uploads/` directory
- Limit: Single server disk space, no CDN for mobile clients
- Scaling path: Migrate to S3/Cloudflare R2, serve via CDN

**Push Notification Batching:**
- Current capacity: Manual chunking of 100 per Expo limit
- Limit: Large trainer with 500+ clients could timeout on broadcasts
- Scaling path: Background job queue for push sends

## Dependencies at Risk

**Express 5 Pre-Release:**
- Risk: Using Express 5.1.0 which may not be stable/LTS
- Impact: Breaking changes possible, limited community support
- Migration plan: Monitor Express release notes, consider staying on 4.x until 5.x is LTS

**Expo SDK 54:**
- Risk: Expo SDK has major versions frequently, breaking changes common
- Impact: Upgrade path may require significant mobile code changes
- Migration plan: Pin versions, test upgrades in separate branch

**React 19:**
- Risk: Very new React version (19.1.0), ecosystem may not have caught up
- Impact: Some libraries may not support React 19 yet
- Migration plan: Monitor for compatibility issues, consider React 18 if blockers found

**No Dependency Lock Files Visible:**
- Risk: Analysis didn't reveal package-lock.json or yarn.lock
- Impact: Non-deterministic installs across environments
- Migration plan: Commit lock files if they exist, verify in repo

## Missing Critical Features

**No Auth Token Refresh:**
- Problem: Tokens expire (7d trainer, 30d client) with no refresh mechanism
- Blocks: Long-term mobile usage requires re-login
- Recommendation: Add refresh token endpoint and auto-refresh logic

**No Error Boundaries in Mobile:**
- Problem: React errors crash entire app
- Blocks: Poor UX on component errors
- Recommendation: Add error boundaries per major screen/tab

**No Health Check for Scheduler:**
- Problem: If scheduler stops, no alerting or recovery
- Blocks: Silent notification failures
- Recommendation: Add liveness endpoint that checks last scheduler run time

**No Logging/Monitoring:**
- Problem: Only console.log for errors, no aggregation or alerting
- Blocks: Debugging production issues
- Recommendation: Add Sentry or similar for error tracking

**No Backup Strategy:**
- Problem: No documented database backup or restore procedure
- Blocks: Data loss scenarios
- Recommendation: Document pg_dump schedule, test restore process

## Test Coverage Gaps

**No Test Files Found:**
- What's not tested: Entire codebase - no .test.ts, .spec.ts, or test directories found
- Files: All `server/src/**/*.ts` and `mobile/src/**/*.tsx` files
- Risk: Refactoring requires manual testing, regressions likely
- Priority: High - start with auth flows and data mutations

**Server Routes:**
- What's not tested: All 11 API route files, auth middleware, error handling
- Files: `server/src/routes/*.ts`, `server/src/middleware/auth.ts`
- Risk: Breaking changes in API contracts go unnoticed
- Priority: High - add integration tests with supertest

**React Query Hooks:**
- What's not tested: All 9 custom hooks for data fetching/mutations
- Files: `mobile/src/hooks/*.ts`
- Risk: Cache invalidation bugs, stale data issues
- Priority: Medium - use React Query testing utilities

**Navigation Flows:**
- What's not tested: Deep linking, notification taps, cross-tab navigation
- Files: `mobile/App.tsx`
- Risk: Broken user flows after navigation changes
- Priority: Medium - add E2E tests with Detox or similar

**Database Migrations:**
- What's not tested: No migration rollback tests, no schema validation
- Files: `server/src/migrations/*.sql`
- Risk: Breaking schema changes in production
- Priority: Medium - test migrations on copy of production data

---

*Concerns audit: 2026-02-07*
