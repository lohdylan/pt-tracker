---
phase: "03"
plan: "02"
subsystem: "storage-infrastructure"
tags: ["s3", "aws-sdk", "file-uploads", "multer", "presigned-urls", "expo-config"]

dependency-graph:
  requires: []
  provides:
    - "S3-compatible file storage with presigned URL proxy"
    - "Conditional upload routes (S3 in production, disk in dev)"
    - "Production-aware mobile API URL via Expo config"
  affects:
    - "03-03 (Railway deployment will set BUCKET_* env vars)"
    - "All upload workflows (client photos, exercise videos, progress photos)"

tech-stack:
  added:
    - "@aws-sdk/client-s3"
    - "@aws-sdk/s3-request-presigner"
  patterns:
    - "Conditional storage: S3 when BUCKET_ENDPOINT set, disk otherwise"
    - "Presigned URL proxy: /api/files/*key redirects to S3 presigned URLs"
    - "Expo Constants.expoConfig.extra for runtime config"

key-files:
  created:
    - "server/src/lib/storage.ts"
  modified:
    - "server/package.json"
    - "server/src/index.ts"
    - "server/src/routes/clients.ts"
    - "server/src/routes/exercises.ts"
    - "server/src/routes/progressPhotos.ts"
    - "mobile/src/api.ts"
    - "mobile/app.json"

key-decisions:
  - decision: "Use *key wildcard syntax for Express 5 route pattern instead of :key(*)"
    reason: "Express 5 uses path-to-regexp v8 which does not support :param(*) syntax; *key is the correct wildcard pattern"
  - decision: "UPLOADS_BASE points to /api/files/ prefix in production, bare host in dev"
    reason: "In production files are served via presigned URL redirect; in dev they are served via express.static at /uploads"
  - decision: "S3 keys use folder prefixes (clients/, videos/, progress/) matching upload types"
    reason: "Organized bucket structure for easy management and debugging"

metrics:
  duration: "~7 min"
  completed: "2026-02-08"
---

# Phase 03 Plan 02: S3 Storage Migration Summary

S3-compatible file uploads with conditional disk fallback, presigned URL proxy endpoint, and Expo config-driven API URL for production mobile builds.

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~7 min |
| Start | 2026-02-08T00:32:34Z |
| End | 2026-02-08T00:39:21Z |
| Tasks | 2/2 |
| Files created | 1 |
| Files modified | 7 |

## Accomplishments

1. **S3 Storage Library** -- Created `server/src/lib/storage.ts` with S3Client initialization (conditional on `BUCKET_ENDPOINT` env var), `uploadFile`, `getSignedFileUrl`, and `deleteFile` helpers. When no S3 env vars are set, all functions throw "S3 not configured" and `isS3Enabled()` returns false.

2. **Files Proxy Endpoint** -- Added `GET /api/files/*key` route to `server/src/index.ts` that requires authentication, generates a presigned S3 URL for the given key, and redirects the client to it. Returns 404 "S3 not configured" in dev.

3. **Three Upload Routes Migrated** -- Updated `clients.ts` (client photos), `exercises.ts` (exercise videos), and `progressPhotos.ts` (progress photos) to conditionally use `multer.memoryStorage()` + S3 upload when `BUCKET_ENDPOINT` is set, preserving the original `multer.diskStorage()` fallback for local development.

4. **Mobile Production API URL** -- Updated `mobile/src/api.ts` to read `Constants.expoConfig?.extra?.apiUrl` for the production API base URL, falling back to the dev LAN IP. `UPLOADS_BASE` points to `/api/files/` prefix in production mode.

5. **App.json Extra Config** -- Added `"extra": { "apiUrl": "" }` to `mobile/app.json` as a placeholder ready to be set to the Railway production URL.

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Install S3 SDK, create storage lib, add files proxy endpoint | cf2c8ab | storage.ts, index.ts proxy, @aws-sdk packages |
| 2 | Migrate 3 upload routes to S3 + update mobile API URL config | 3728323 | clients.ts, exercises.ts, progressPhotos.ts, api.ts, app.json |

## Files Created

| File | Purpose |
|------|---------|
| server/src/lib/storage.ts | S3 client with uploadFile, getSignedFileUrl, deleteFile helpers |

## Files Modified

| File | Changes |
|------|---------|
| server/package.json | Added @aws-sdk/client-s3, @aws-sdk/s3-request-presigner |
| server/src/index.ts | Added storage import, /api/files/*key proxy endpoint |
| server/src/routes/clients.ts | Conditional memoryStorage/diskStorage, S3 upload for client photos |
| server/src/routes/exercises.ts | Conditional memoryStorage/diskStorage, S3 upload for exercise videos |
| server/src/routes/progressPhotos.ts | Conditional memoryStorage/diskStorage, S3 upload for progress photos |
| mobile/src/api.ts | Import Constants, read apiUrl from Expo config, production UPLOADS_BASE |
| mobile/app.json | Added extra.apiUrl placeholder |

## Decisions Made

1. **Express 5 wildcard route syntax** -- Used `*key` instead of `:key(*)` for the files proxy route. Express 5 uses path-to-regexp v8 which has different wildcard syntax. The plan's `:key(*)` pattern caused a `PathError` at startup; `*key` is the correct Express 5 equivalent.

2. **UPLOADS_BASE production behavior** -- In production (when `apiUrl` is set), `UPLOADS_BASE` points to `{apiUrl}/api/files/` so that file references stored as S3 keys (e.g., `clients/1234.jpg`) are resolved through the proxy endpoint. In dev, it stays as the bare host (e.g., `http://192.168.1.68:3000`) so `/uploads/...` paths work with express.static.

3. **S3 key prefixes** -- Used `clients/`, `videos/`, and `progress/` prefixes for different upload types, matching the existing `/uploads/`, `/uploads/videos/`, and `/uploads/progress/` directory structure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Express 5 route pattern incompatibility**

- **Found during:** Task 1
- **Issue:** Plan specified `/api/files/:key(*)` route pattern, but Express 5 (using path-to-regexp v8) throws `PathError: Missing parameter name at index 17` for this syntax
- **Fix:** Changed route to `/api/files/*key` which is the correct Express 5 wildcard syntax
- **Files modified:** server/src/index.ts
- **Commit:** cf2c8ab

## Issues Encountered

- Port 3000 was occupied by stale server processes from earlier test runs, causing initial verification failures. Resolved by killing leftover processes before testing.

## Next Phase Readiness

- S3 storage is ready for production. Railway deployment (03-03) needs to set these env vars: `BUCKET_ENDPOINT`, `BUCKET_REGION`, `BUCKET_ACCESS_KEY_ID`, `BUCKET_SECRET_ACCESS_KEY`, `BUCKET_NAME`
- Mobile `app.json` `extra.apiUrl` needs to be set to the Railway production URL after deployment
- Dev workflow is fully preserved -- no S3 credentials needed for local development

## Self-Check: PASSED
