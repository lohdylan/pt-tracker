# Testing Patterns

**Analysis Date:** 2026-02-07

## Test Framework

**Runner:**
- None configured

**Assertion Library:**
- None configured

**Run Commands:**
```bash
# No test commands available
# package.json scripts do not include test commands
```

## Test File Organization

**Location:**
- No test files detected in codebase
- No `__tests__` directories
- No `.test.ts` or `.spec.ts` files

**Naming:**
- Not applicable (no tests present)

**Structure:**
```
# No test directory structure exists
```

## Test Structure

**Suite Organization:**
```typescript
// No test patterns exist in codebase
```

**Patterns:**
- Setup: Not applicable
- Teardown: Not applicable
- Assertion: Not applicable

## Mocking

**Framework:**
- None configured

**Patterns:**
```typescript
// No mocking patterns exist
```

**What to Mock:**
- Not defined (no tests present)

**What NOT to Mock:**
- Not defined (no tests present)

## Fixtures and Factories

**Test Data:**
```typescript
// No test fixtures exist
// Seed data exists at server/src/seed.ts for development
```

**Location:**
- `server/src/seed.ts` - Development seed script, not test fixtures
- Seed creates 8 clients with access codes (SAR101-DER108)
- No test-specific data factories

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present

## Common Patterns

**Async Testing:**
```typescript
// No async test patterns (no tests exist)
```

**Error Testing:**
```typescript
// No error test patterns (no tests exist)
```

## Manual Testing Approach

**Server Testing:**
- Manual curl commands (documented in MEMORY.md)
- Server-side testing done via direct API calls
- Example from docs:
  ```bash
  # Get trainer token
  curl -X POST http://localhost:3000/api/auth/trainer-login \
    -H "Content-Type: application/json" \
    -d '{"password":"test123"}'

  # Test endpoint with token
  curl http://localhost:3000/api/clients \
    -H "Authorization: Bearer <token>"
  ```

**Mobile Testing:**
- Expo development builds on physical devices and simulators
- Manual UI testing during development
- Hot reload for rapid iteration

**Database Testing:**
- Development database: `postgresql://localhost:5432/pt_tracker`
- Migrations applied via: `npm run migrate` (in server directory)
- Seed data via: `npm run seed` (in server directory)
- 12 migrations currently applied (001-012)

## Quality Assurance Strategy

**Type Safety:**
- TypeScript strict mode in both server and mobile
- Interface definitions in `mobile/src/types.ts` (155 lines)
- Type-safe API client with generics: `api.get<T>()`, `api.post<T>()`
- Request type augmentation for auth: `Express.Request.user`

**Code Review:**
- Not formalized (no CI/CD configuration detected)
- 4-feature implementation tracked in `four-features-progress.md`
- Manual checklist approach for features

**Runtime Validation:**
- Manual checks in route handlers:
  ```typescript
  if (!access_code) {
    return res.status(400).json({ error: "Access code is required" });
  }
  ```
- No validation library (no joi, zod, yup, etc.)
- Database constraints provide data integrity

## Development Workflow

**Server Development:**
```bash
cd server
TRAINER_PASSWORD=test123 JWT_SECRET=dev-secret-change-me npx tsx src/index.ts
# Hot reload via tsx watch: npm run dev
```

**Mobile Development:**
```bash
cd mobile
npx expo start
# Choose platform: iOS simulator, Android emulator, or physical device
```

**Environment:**
- Required server env vars: `TRAINER_PASSWORD`, `JWT_SECRET`
- Optional: `DATABASE_URL`, `PORT`
- Mobile: hardcoded DEV_HOST in `api.ts` (192.168.1.68)

## Testing Gaps

**Server:**
- No unit tests for route handlers (`server/src/routes/*.ts`)
- No integration tests for database operations
- No tests for middleware (`server/src/middleware/auth.ts`)
- No tests for services (`server/src/services/*.ts`)
- No API contract validation
- No error handling verification

**Mobile:**
- No component tests (26 screens untested)
- No hook tests (9 custom hooks untested)
- No navigation flow tests
- No integration tests with backend
- No accessibility tests
- No performance tests

**Critical Untested Areas:**

**Authentication Flow:**
- Files: `server/src/routes/auth.ts`, `server/src/middleware/auth.ts`, `mobile/src/AuthContext.tsx`
- Risk: JWT verification, token expiration, role-based access

**Data Mutations:**
- Files: `server/src/routes/*.ts` (all POST/PUT/DELETE endpoints)
- Risk: Data integrity, validation, authorization checks

**Push Notifications:**
- Files: `server/src/services/pushService.ts`, `server/src/services/scheduler.ts`, `mobile/src/services/notifications.ts`
- Risk: Token invalidation, batch processing, permission handling

**File Uploads:**
- Files: `server/src/routes/clients.ts` (photo upload), `server/src/routes/exercises.ts` (video upload), `server/src/routes/progressPhotos.ts`
- Risk: File size limits, storage path security, malicious uploads

**Messaging System:**
- Files: `server/src/routes/messages.ts`, `mobile/src/screens/messages/*.tsx`
- Risk: Authorization (clients reading other clients' messages), unread count accuracy

**Database Transactions:**
- Files: `server/src/routes/workoutLogs.ts` (batch insert, reorder)
- Risk: Partial failures, deadlocks, race conditions

## Recommendations for Future Testing

**High Priority:**
1. Add authentication/authorization tests (security critical)
2. Add database transaction tests (data integrity critical)
3. Add API integration tests (contract validation)

**Medium Priority:**
4. Add React component smoke tests (rendering verification)
5. Add custom hook tests (business logic verification)
6. Add navigation flow tests (user journey verification)

**Low Priority:**
7. Add snapshot tests for UI components
8. Add performance/load tests for API endpoints
9. Add E2E tests for critical user flows

**Suggested Stack:**
- Server: Jest + Supertest (API testing) + pg-mem (in-memory PostgreSQL)
- Mobile: Jest + React Native Testing Library + MSW (API mocking)
- E2E: Detox (React Native E2E framework)

---

*Testing analysis: 2026-02-07*
