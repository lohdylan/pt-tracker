# External Integrations

**Analysis Date:** 2026-02-07

## APIs & External Services

**Push Notifications:**
- Expo Push Notification Service - Send push notifications to mobile devices
  - SDK/Client: expo-notifications 0.32.16
  - Endpoint: `https://exp.host/--/api/v2/push/send`
  - Auth: None (uses Expo push tokens)
  - Implementation: `server/src/services/pushService.ts`
  - Scheduler: `server/src/services/scheduler.ts` (5-minute interval)

**Video Embedding:**
- YouTube - Video playback in exercise library
  - SDK/Client: react-native-youtube-iframe 2.4.1
  - Auth: None (public embeds)
  - Usage: Exercise demonstration videos

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` (default: `postgresql://localhost:5432/pt_tracker`)
  - Client: pg 8.13.0 (node-postgres)
  - Pool: `server/src/db.ts`
  - Migrations: 12 SQL files in `server/src/migrations/` (001-012)

**File Storage:**
- Local filesystem
  - Client photos: `server/uploads/` (5MB limit)
  - Progress photos: `server/uploads/progress/` (10MB limit)
  - Exercise videos: `server/uploads/exercises/` (uploaded via multer)
  - Served via Express static middleware at `/uploads`

**Caching:**
- Client-side only via @tanstack/react-query
- No server-side cache (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Custom JWT implementation
  - Implementation: `server/src/middleware/auth.ts`, `server/src/routes/auth.ts`
  - Token signing: jsonwebtoken 9.0.3
  - Secret: `JWT_SECRET` env var (default: "dev-secret-change-me")
  - Expiry: Trainer=7d, Client=30d
  - Storage: AsyncStorage (`@react-native-async-storage/async-storage`)
  - Context: `mobile/src/AuthContext.tsx`

**Trainer Authentication:**
- Password-based via `TRAINER_PASSWORD` env var
- Endpoint: `POST /api/auth/trainer-login`

**Client Authentication:**
- Access code-based (6-char alphanumeric)
- Generated on client creation via crypto.randomBytes
- Endpoint: `POST /api/auth/client-login`

## Monitoring & Observability

**Error Tracking:**
- None (console.error only)

**Logs:**
- Console output only
- Server start message, scheduler logs, push notification errors

## CI/CD & Deployment

**Hosting:**
- Not configured (local development only)

**CI Pipeline:**
- None

## Environment Configuration

**Required env vars:**
- `TRAINER_PASSWORD` - Password for trainer login
- `JWT_SECRET` - JWT signing key

**Optional env vars:**
- `DATABASE_URL` - PostgreSQL connection string (defaults to localhost)
- `PORT` - Server port (defaults to 3000)

**Secrets location:**
- Not committed (set at runtime via shell)
- No .env files in repository

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Expo Push Notification API (`https://exp.host/--/api/v2/push/send`)
  - Triggered by: Session reminders (scheduler), measurement creation, workout logging
  - Payload: Push token, title, body, data object
  - Error handling: Deactivates invalid tokens (DeviceNotRegistered)

## Local Network Configuration

**Development API Access:**
- Android emulator: `http://10.0.2.2:3000/api`
- iOS simulator/physical devices: `http://192.168.1.68:3000/api` (hardcoded LAN IP)
- Configured in: `mobile/src/api.ts`

---

*Integration audit: 2026-02-07*
