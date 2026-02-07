# Coding Conventions

**Analysis Date:** 2026-02-07

## Naming Patterns

**Files:**
- Server routes: lowercase, plural nouns - `clients.ts`, `sessions.ts`, `workoutLogs.ts`, `progressPhotos.ts`
- Middleware: lowercase, singular - `auth.ts`
- Services: camelCase with "Service" suffix - `pushService.ts`, `scheduler.ts`
- React components: PascalCase with Screen/Component suffix - `ClientListScreen.tsx`, `ExercisePicker.tsx`
- Hooks: camelCase with "use" prefix - `useClients.ts`, `useWorkoutLogs.ts`, `useNotifications.ts`
- Types/utilities: lowercase singular - `types.ts`, `theme.ts`, `api.ts`

**Functions:**
- Server route handlers: anonymous async arrow functions
- React hooks: named exports with "use" prefix - `useClients()`, `useCreateClient()`
- React components: default export, PascalCase - `ClientListScreen`, `ExercisePicker`
- Utility functions: camelCase - `generateAccessCode()`, `authHeaders()`, `renderAvatar()`

**Variables:**
- React state: camelCase - `search`, `showResults`, `isLoading`
- Constants: SCREAMING_SNAKE_CASE - `JWT_SECRET`, `TOKEN_KEY`, `AVATAR_SIZE`, `BASE`, `UPLOADS_BASE`
- Database result variables: camelCase - `rows`, `rowCount`
- Props destructuring: snake_case for API fields - `first_name`, `last_name`, `access_code`

**Types:**
- Interfaces: PascalCase - `Client`, `Session`, `WorkoutLog`, `AuthPayload`, `Conversation`
- Type aliases: PascalCase - `NavigationProp`, `P` (route params)
- Generic params: single uppercase letter - `T`, `P`

## Code Style

**Formatting:**
- No formatter configured (no .prettierrc or .eslintrc detected)
- Manual spacing conventions:
  - 2-space indentation (TypeScript standard)
  - Double quotes for strings (observed throughout)
  - Single quotes for React Native JSX strings
  - Semicolons required at statement end
  - Trailing commas in multi-line objects/arrays

**Linting:**
- No ESLint configuration detected
- TypeScript strict mode enabled in both workspaces (`"strict": true`)
- Compiler enforces type safety

**TypeScript Configuration:**
- Server: ES2022 target, ES2022 modules, bundler resolution
- Mobile: extends expo/tsconfig.base with strict enabled
- Both use `skipLibCheck: true`

## Import Organization

**Order:**
1. External framework imports (`express`, `react`, `react-native`)
2. External library imports (`@tanstack/react-query`, `@react-navigation/*`)
3. Node built-ins (`path`, `crypto`, `url`)
4. Internal absolute imports (`../db.js`, `../middleware/auth.js`)
5. Type imports at the end (`import type { ... }`)

**Server-specific:**
```typescript
import { Router } from "express";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";
```

**Mobile-specific:**
```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClients } from '../../hooks/useClients';
import { colors, spacing } from '../../theme';
import type { Client } from '../../types';
```

**Path Aliases:**
- Server: relative paths only (`../db.js`, `./routes/auth.js`)
- Mobile: relative paths only (`../../hooks`, `../api`)
- Server uses `.js` extensions in imports despite TypeScript (ES module requirement)

## Error Handling

**Server Patterns:**
- Early returns for validation errors:
  ```typescript
  if (!access_code) {
    return res.status(400).json({ error: "Access code is required" });
  }
  ```
- Empty catch blocks suppress errors silently:
  ```typescript
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  ```
- 404 responses for missing resources:
  ```typescript
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  ```
- 403 for authorization failures:
  ```typescript
  if (req.user?.role !== "trainer") {
    return res.status(403).json({ error: "Trainer access required" });
  }
  ```
- Transactions with ROLLBACK on error:
  ```typescript
  try {
    await client.query("BEGIN");
    // ... operations
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  ```

**Mobile Patterns:**
- React Query handles API errors automatically
- Try-catch with silent failure for non-critical operations:
  ```typescript
  try {
    const storedToken = await AsyncStorage.getItem("pt_push_token");
    // ...
  } catch {
    // Non-fatal
  }
  ```
- Conditional rendering for error states:
  ```typescript
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load clients.</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  ```

## Logging

**Framework:** `console` (no logging library)

**Server Patterns:**
- Startup messages: `console.log(\`Server running on http://localhost:${PORT}\`)`
- Error logging in push service: `console.error("Push notification error:", err)`
- No request/response logging
- No structured logging

**Mobile:**
- No logging patterns detected (no console.log calls observed)

## Comments

**When to Comment:**
- Route groupings in server index: `// Public routes`, `// Protected routes`
- Non-obvious business logic: `// 6-char alphanumeric uppercase`
- Important constraints: `// Client can only view own sessions`
- Workarounds/timing issues: `// Small delay to allow tap on result`
- Type context: `// Express 5 merged params need type assertion`

**JSDoc/TSDoc:**
- Not used (no JSDoc comments found in codebase)
- Type information provided via TypeScript instead

## Function Design

**Size:**
- Route handlers: 5-30 lines, single responsibility
- React components: 50-300 lines including styles
- Hooks: 5-15 lines per exported function
- Services: 10-40 lines per function

**Parameters:**
- Server routes: destructure from `req.body` or `req.params`
- React components: single props object, destructured
- Hooks: scalar parameters (numbers, strings)
- Callbacks: useCallback-wrapped for performance

**Return Values:**
- Server routes: `res.json(data)` or `res.status(code).json({ error })`
- Hooks: React Query objects (`{ data, isLoading, isError }`)
- Components: JSX.Element (implicit)
- API client: unwrapped data (no `.data` wrapper)

## Module Design

**Exports:**
- Server routes: `export default router` (default export)
- React components: `export default ComponentName` (default export)
- Hooks: named exports - `export function useClients()`, `export function useCreateClient()`
- Middleware: named exports - `export function requireAuth()`, `export interface AuthPayload`
- Services: named exports - `export async function sendPushNotifications()`

**Barrel Files:**
- Not used (no index.ts re-exports)
- Direct imports from specific files throughout

## React-Specific Conventions

**Component Structure:**
```typescript
// 1. Imports
// 2. Type definitions
// 3. Component function
// 4. Hooks (top of component)
// 5. Event handlers (useCallback)
// 6. Render helpers
// 7. Conditional returns (loading/error)
// 8. Main JSX return
// 9. StyleSheet definition
// 10. Default export
```

**State Management:**
- React Query for server state (all API data)
- React Context for auth (`AuthContext`)
- useState for local UI state
- AsyncStorage for persistence

**Styling:**
- StyleSheet.create at file bottom
- Inline styles for dynamic values
- Theme constants from `theme.ts`: `colors`, `spacing`, `fontSize`
- Absolute positioning for overlays/FABs

## Server-Specific Conventions

**Express 5 Patterns:**
- `Router({ mergeParams: true })` for nested routes
- Type assertion for merged params: `req.params as unknown as P`
- Per-router auth middleware (no wildcards): `app.use("/api/clients", requireAuth, clientsRouter)`

**Database Patterns:**
- Parameterized queries always: `$1`, `$2`, etc.
- Connection pool for single queries: `pool.query()`
- Manual connection for transactions: `pool.connect()` + `client.release()`
- JSON columns handled with `JSON.stringify()` on insert/update

**Authentication:**
- JWT tokens with role-based claims: `{ role: "trainer" | "client", clientId?: number }`
- Bearer token extraction: `header.slice(7)`
- Middleware augments request: `req.user = payload`
- Global namespace declaration for Express.Request extension

---

*Convention analysis: 2026-02-07*
