# Architecture

**Analysis Date:** 2026-02-07

## Pattern Overview

**Overall:** Three-tier Client-Server Architecture with Role-Based Access Control

**Key Characteristics:**
- Monorepo with independent server and mobile workspaces
- REST API with JWT-based authentication
- PostgreSQL database with migration-based schema evolution
- React Query for client-side state management and caching
- Dual-role system (trainer and client) with shared and role-specific features

## Layers

**Presentation Layer:**
- Purpose: Mobile UI for trainers and clients
- Location: `/mobile/src`
- Contains: React Native screens, navigation, components, hooks
- Depends on: API layer (`/mobile/src/api.ts`), React Query, AsyncStorage
- Used by: End users (trainers and clients via Expo app)

**API Layer:**
- Purpose: HTTP REST interface for all business operations
- Location: `/server/src/routes`
- Contains: Express routers (11 route files), authentication middleware, file upload handlers
- Depends on: Database layer, services layer, JWT for auth
- Used by: Mobile app via fetch requests

**Business Logic Layer:**
- Purpose: Core business operations and background processes
- Location: `/server/src/services`
- Contains: Push notification service (`pushService.ts`), session reminder scheduler (`scheduler.ts`)
- Depends on: Database layer, external APIs (Expo Push API)
- Used by: API routes, scheduler (5-minute interval)

**Data Layer:**
- Purpose: PostgreSQL database access and schema management
- Location: `/server/src/db.ts`, `/server/src/migrations`
- Contains: Connection pool, 12 SQL migrations (001-012)
- Depends on: PostgreSQL database (`pt_tracker`)
- Used by: API routes, services

## Data Flow

**Trainer Logs Workout for Client:**

1. Trainer navigates to `WorkoutLogScreen` (via `SessionDetailScreen`)
2. Screen uses `useBatchCreateWorkoutLogs` hook from `/mobile/src/hooks/useWorkoutLogs.ts`
3. Hook calls `api.post('/sessions/:sessionId/logs/batch', data)` from `/mobile/src/api.ts`
4. Request hits `/server/src/routes/workoutLogs.ts` POST batch endpoint
5. Route validates JWT via `requireAuth` middleware in `/server/src/middleware/auth.ts`
6. Route inserts records into `workout_logs` table via `/server/src/db.ts` connection pool
7. Response returns to mobile, React Query invalidates cache, UI updates

**Client Receives Session Reminder:**

1. Scheduler in `/server/src/services/scheduler.ts` runs every 5 minutes (started in `/server/src/index.ts`)
2. Queries `sessions` table for upcoming sessions within reminder window
3. Calls `sendPushNotifications` from `/server/src/services/pushService.ts`
4. Push service POSTs to Expo Push API (`https://exp.host/--/api/v2/push/send`)
5. Notification delivered to client's device via Expo infrastructure
6. Mobile app's notification listener in `/mobile/App.tsx` handles tap, navigates to Messages tab

**State Management:**
- Server: Stateless HTTP handlers, no in-memory state except scheduler interval
- Mobile: React Query cache for server data, AsyncStorage for JWT token and user object, AuthContext for authentication state

## Key Abstractions

**AuthPayload:**
- Purpose: Represents authenticated user in JWT and request context
- Examples: Used in `/server/src/middleware/auth.ts`, attached to `req.user`
- Pattern: TypeScript interface with `role` ("trainer" | "client") and optional `clientId`

**Client/Session/WorkoutLog Domain Models:**
- Purpose: Represent core business entities
- Examples: `/mobile/src/types.ts` defines TypeScript interfaces, mirrored in database tables
- Pattern: TypeScript interfaces with snake_case fields (matching DB column names)

**React Query Hooks:**
- Purpose: Encapsulate data fetching, mutations, and cache invalidation
- Examples: `/mobile/src/hooks/useClients.ts`, `/mobile/src/hooks/useSessions.ts`, 9 total hook files
- Pattern: `useQuery` for reads, `useMutation` for writes with `onSuccess` invalidation

**Express Routers:**
- Purpose: Group related API endpoints by domain
- Examples: `/server/src/routes/clients.ts`, `/server/src/routes/sessions.ts`, 11 total route files
- Pattern: One router per resource, mounted in `/server/src/index.ts` with path and middleware

**Tab-Based Navigation:**
- Purpose: Separate trainer and client app experiences
- Examples: `TrainerTabs` (6 tabs) and `ClientTabs` (5 tabs) in `/mobile/App.tsx`
- Pattern: React Navigation bottom tabs with nested stack navigators per tab

## Entry Points

**Server:**
- Location: `/server/src/index.ts`
- Triggers: Started via `npx tsx src/index.ts` or `npm run dev` (with watch)
- Responsibilities: Initialize Express app, register middleware (cors, json, static uploads), mount 11 routers, start scheduler, listen on port 3000

**Mobile:**
- Location: `/mobile/App.tsx`
- Triggers: Started via `npx expo start`, runs on iOS/Android/web
- Responsibilities: Setup QueryClient, AuthProvider, NavigationContainer, register push notifications, render tabs based on user role

**Database Migrations:**
- Location: `/server/src/migrate.ts`
- Triggers: Run manually via `npm run migrate`
- Responsibilities: Execute sequential SQL migrations (001-012), track applied migrations in `schema_migrations` table

**Database Seeding:**
- Location: `/server/src/seed.ts`
- Triggers: Run manually via `npm run seed`
- Responsibilities: Populate 8 clients, 30 sessions, 200+ workout logs, 5 exercises, 15 measurements for development

## Error Handling

**Strategy:** HTTP status codes with JSON error payloads, client-side React Query error states

**Patterns:**
- Authentication errors: 401 from `requireAuth` middleware if token missing/invalid
- Authorization errors: 403 from `requireTrainer` or `requireOwnClient` if role mismatch
- Validation errors: 400 from routes if required fields missing (e.g., no file uploaded)
- Not found errors: 404 from routes if database query returns no rows
- Server errors: Uncaught exceptions crash server (no global error handler), queries throw if DB fails
- Mobile errors: React Query `isError` state, `Alert.alert` for user-facing errors

## Cross-Cutting Concerns

**Logging:** `console.log` and `console.error` in server (scheduler, push service), no structured logging

**Validation:** Minimal server-side validation (presence checks only), no schema validation library, client-side validation in UI forms

**Authentication:**
- JWT tokens signed with `JWT_SECRET` env var
- Trainer tokens: 7-day expiry, password-based login (`TRAINER_PASSWORD` env var)
- Client tokens: 30-day expiry, access-code-based login (6-char alphanumeric codes)
- Token stored in AsyncStorage, attached to all API requests via `Authorization: Bearer` header
- Middleware: `requireAuth` (any authenticated user), `requireTrainer` (trainer only), `requireOwnClient` (trainer or owning client)

**File Uploads:**
- Multer middleware for multipart/form-data
- Client photos: `/server/uploads/` directory, served via `/uploads` static route
- Exercise videos: `/server/uploads/videos/` directory
- Progress photos: `/server/uploads/progress/` directory
- 5MB file size limit enforced by multer

**Push Notifications:**
- Expo Push Notification service (cloud-based, no local APNs/FCM)
- Token registration: Mobile app registers Expo push token on auth, stored in `push_tokens` table
- Token unregistration: Removed on logout via `/api/notifications/unregister`
- Delivery: Server POSTs to Expo API, handles `DeviceNotRegistered` errors by deactivating tokens
- Preferences: `notification_preferences` table controls per-client notification types (session reminders, workout logged, measurement recorded)

**Scheduling:**
- Single background process: session reminders
- Interval: 5 minutes (started in `index.ts`, implemented in `scheduler.ts`)
- Logic: Query sessions within reminder window, send push notifications, mark `reminder_sent = true`

---

*Architecture analysis: 2026-02-07*
