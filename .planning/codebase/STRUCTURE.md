# Codebase Structure

**Analysis Date:** 2026-02-07

## Directory Layout

```
my-app/                         # Monorepo root
├── server/                     # Backend Express API
│   └── src/
│       ├── routes/             # API endpoint handlers (11 files)
│       ├── middleware/         # Authentication middleware
│       ├── migrations/         # SQL schema migrations (001-012)
│       ├── services/           # Background services (push, scheduler)
│       ├── index.ts            # Server entry point
│       ├── db.ts               # PostgreSQL connection pool
│       ├── migrate.ts          # Migration runner
│       └── seed.ts             # Development data seeding
├── mobile/                     # React Native Expo app
│   ├── src/
│   │   ├── screens/            # UI screens (27 files, 9 subdirs)
│   │   │   ├── auth/           # LoginScreen
│   │   │   ├── clients/        # Trainer client management (9 screens)
│   │   │   ├── calendar/       # Session scheduling (3 screens)
│   │   │   ├── workouts/       # Workout templates and logging (3 screens)
│   │   │   ├── exercises/      # Exercise library (3 screens)
│   │   │   ├── portal/         # Client portal views (5 screens)
│   │   │   ├── messages/       # Messaging (3 screens)
│   │   │   ├── settings/       # NotificationSettingsScreen
│   │   │   └── dashboard/      # DashboardScreen
│   │   ├── components/         # Reusable UI components (6 files)
│   │   ├── hooks/              # React Query data hooks (10 files)
│   │   ├── services/           # Notification service
│   │   ├── utils/              # Helper functions (2 files)
│   │   ├── api.ts              # HTTP client wrapper
│   │   ├── AuthContext.tsx     # Authentication context provider
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── theme.ts            # Colors, spacing, font sizes
│   ├── assets/                 # Images and static files
│   └── App.tsx                 # Mobile app entry point
├── .planning/                  # GSD planning documents
│   └── codebase/               # Codebase analysis documents
├── package.json                # Workspace configuration
└── tsconfig.json               # Shared TypeScript config
```

## Directory Purposes

**`/server/src/routes`:**
- Purpose: API endpoint handlers grouped by resource
- Contains: 11 Express Router files, one per domain
- Key files:
  - `auth.ts`: Trainer/client login
  - `clients.ts`: Client CRUD, photo upload, access code regeneration
  - `sessions.ts`: Session scheduling and status updates
  - `workoutLogs.ts`: Workout logging with batch operations and reordering
  - `templates.ts`: Workout template CRUD
  - `measurements.ts`: Body measurement tracking
  - `exercises.ts`: Exercise library with video upload and search
  - `progressPhotos.ts`: Progress photo upload and retrieval
  - `notifications.ts`: Push token registration and preferences
  - `messages.ts`: Trainer-client messaging with read receipts
  - `analytics.ts`: Dashboard statistics and trends

**`/server/src/middleware`:**
- Purpose: Express middleware for cross-cutting concerns
- Contains: Authentication middleware only
- Key files: `auth.ts` with `requireAuth`, `requireTrainer`, `requireOwnClient`

**`/server/src/migrations`:**
- Purpose: Database schema evolution
- Contains: 12 SQL migration files (001-012)
- Key files:
  - `001_clients.sql`: Core client table
  - `002_sessions.sql`: Session scheduling
  - `003_workout_templates.sql`: Reusable workout plans
  - `004_workout_logs.sql`: Exercise tracking per session
  - `005_measurements.sql`: Body measurements
  - `006_auth_access_codes.sql`: Client access codes
  - `007_exercise_library.sql`: Exercise database with videos
  - `008_workout_logs_enhancements.sql`: JSONB sets detail, exercise IDs
  - `009_progress_photos.sql`: Photo progress tracking
  - `010_push_tokens.sql`: Expo push notification tokens
  - `011_notification_preferences.sql`: Per-client notification settings
  - `012_messages.sql`: Trainer-client messaging

**`/server/src/services`:**
- Purpose: Background services and shared business logic
- Contains: Push notification service, session reminder scheduler
- Key files:
  - `pushService.ts`: Expo Push API integration
  - `scheduler.ts`: 5-minute interval for session reminders

**`/mobile/src/screens`:**
- Purpose: Full-screen UI components organized by feature
- Contains: 27 screen files across 9 subdirectories
- Key subdirectories:
  - `clients/`: Trainer client management (list, detail, form, measurements, progress photos, photo comparison)
  - `portal/`: Client-facing views (sessions, progress, workout logs, photos)
  - `calendar/`: Session scheduling (calendar, detail, form)
  - `workouts/`: Workout templates and logging
  - `exercises/`: Exercise library (list, detail, form)
  - `messages/`: Messaging (conversation list, trainer chat, client chat)
  - `dashboard/`: Trainer dashboard with stats
  - `auth/`: Login screen
  - `settings/`: Notification preferences

**`/mobile/src/components`:**
- Purpose: Reusable UI components used across screens
- Contains: 6 component files
- Key files:
  - `LogoutButton.tsx`: Header logout button
  - `ExercisePicker.tsx`: Searchable exercise selector
  - `SetDetailEditor.tsx`: Per-set rep/weight editor
  - `RestTimer.tsx`: Countdown timer between sets
  - `UnreadBadge.tsx`: Unread message count badge
  - `YouTubePlayer.tsx`: Embedded YouTube video player

**`/mobile/src/hooks`:**
- Purpose: React Query hooks for data fetching and mutations
- Contains: 10 hook files, one per domain
- Key files:
  - `useClients.ts`: Client CRUD operations
  - `useSessions.ts`: Session scheduling
  - `useWorkoutLogs.ts`: Workout logging with batch and reorder
  - `useTemplates.ts`: Workout template management
  - `useMeasurements.ts`: Measurement tracking
  - `useExercises.ts`: Exercise library with search
  - `useProgressPhotos.ts`: Progress photo upload/delete
  - `useNotifications.ts`: Push token registration and preferences
  - `useMessages.ts`: Messaging operations and unread counts
  - `useDashboard.ts`: Dashboard data fetching

**`/mobile/src/services`:**
- Purpose: Platform-specific services (non-HTTP)
- Contains: Notification service only
- Key files: `notifications.ts` with permission request and listener registration

**`/mobile/src/utils`:**
- Purpose: Pure helper functions
- Contains: Chart helpers, YouTube URL parsing
- Key files:
  - `chartHelpers.ts`: Data transformation for react-native-chart-kit
  - `youtube.ts`: Extract YouTube video IDs from URLs

## Key File Locations

**Entry Points:**
- `/server/src/index.ts`: Express server startup
- `/mobile/App.tsx`: React Native app root
- `/server/src/migrate.ts`: Database migration runner
- `/server/src/seed.ts`: Development data seeding

**Configuration:**
- `/package.json`: Workspace definition (npm workspaces)
- `/server/package.json`: Server dependencies (Express 5, pg, jsonwebtoken, multer)
- `/mobile/package.json`: Mobile dependencies (Expo 54, React Navigation 7, React Query 5)
- `/server/tsconfig.json`: Server TypeScript config (ES2022 modules)
- `/mobile/tsconfig.json`: Mobile TypeScript config (inherited from Expo)

**Core Logic:**
- `/server/src/db.ts`: PostgreSQL connection pool
- `/mobile/src/api.ts`: HTTP client with token injection
- `/mobile/src/AuthContext.tsx`: Authentication state provider
- `/mobile/src/types.ts`: Shared TypeScript type definitions

**Testing:**
- No test files present

## Naming Conventions

**Files:**
- Screens: PascalCase with `Screen` suffix (e.g., `ClientListScreen.tsx`)
- Components: PascalCase (e.g., `LogoutButton.tsx`, `ExercisePicker.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useClients.ts`, `useSessions.ts`)
- Routes: camelCase (e.g., `clients.ts`, `workoutLogs.ts`)
- Services: camelCase (e.g., `pushService.ts`, `scheduler.ts`)
- Migrations: Sequential numbers with snake_case descriptors (e.g., `001_clients.sql`, `008_workout_logs_enhancements.sql`)

**Directories:**
- Lowercase for server (`routes`, `middleware`, `migrations`, `services`)
- Lowercase for mobile (`screens`, `components`, `hooks`, `utils`)
- Subdirectories under `screens` match feature areas (`clients`, `portal`, `calendar`, `workouts`, `exercises`, `messages`, `auth`, `settings`, `dashboard`)

**Variables:**
- snake_case for database columns and API request/response fields (e.g., `first_name`, `client_id`, `scheduled_at`)
- camelCase for TypeScript/JavaScript variables (e.g., `clientId`, `sessionId`, `workoutLogs`)
- PascalCase for React components and TypeScript types (e.g., `Client`, `Session`, `WorkoutLog`)

**Functions:**
- camelCase for all functions (e.g., `requireAuth`, `sendPushNotifications`, `handleDelete`)
- React hooks: `use` prefix (e.g., `useClients`, `useAuth`, `useNavigation`)
- Event handlers: `handle` prefix (e.g., `handleEdit`, `handleSubmit`, `handleSessionPress`)

## Where to Add New Code

**New API Endpoint:**
- Primary code: Create new router file in `/server/src/routes/{resource}.ts` or add to existing router
- Mount router: Register in `/server/src/index.ts` with `app.use('/api/{path}', requireAuth, {resource}Router)`
- Types: Add response types to `/mobile/src/types.ts` if not already present

**New Mobile Screen:**
- Implementation: Create screen file in `/mobile/src/screens/{feature}/{ScreenName}Screen.tsx`
- Navigation: Add to appropriate stack navigator in `/mobile/App.tsx`
- Route types: Add to stack param list in `/mobile/App.tsx`

**New Data Hook:**
- Implementation: Create hook file in `/mobile/src/hooks/use{Resource}.ts`
- Pattern: Export `use{Resource}` for list query, `use{Resource}ById` for detail query, `useCreate{Resource}`, `useUpdate{Resource}`, `useDelete{Resource}` for mutations
- Import: Import `api` from `/mobile/src/api.ts` and `useMutation`/`useQuery` from `@tanstack/react-query`

**New Database Table:**
- Migration: Create next sequential migration in `/server/src/migrations/{NNN}_{table_name}.sql`
- Run migration: Execute `cd server && npm run migrate`
- Types: Add TypeScript interface to `/mobile/src/types.ts` (snake_case fields matching DB columns)

**New Reusable Component:**
- Implementation: Create component file in `/mobile/src/components/{ComponentName}.tsx`
- Import: Import and use in screen files as needed

**New Background Job:**
- Implementation: Add logic to `/server/src/services/scheduler.ts` or create new service file
- Trigger: Call from scheduler interval or add new interval in `/server/src/index.ts`

**New Feature (Full Stack):**
1. Database: Add migration in `/server/src/migrations/`
2. API: Add router in `/server/src/routes/`
3. Types: Add TypeScript interfaces in `/mobile/src/types.ts`
4. Hook: Add React Query hook in `/mobile/src/hooks/`
5. Screen: Add screen in `/mobile/src/screens/{feature}/`
6. Navigation: Wire up in `/mobile/App.tsx`

## Special Directories

**`/server/uploads`:**
- Purpose: File upload storage
- Generated: Yes (created at runtime by multer)
- Committed: No (in .gitignore)
- Subdirectories: `/uploads/videos` (exercise videos), `/uploads/progress` (progress photos), root (client profile photos)

**`/mobile/.expo`:**
- Purpose: Expo build cache and metadata
- Generated: Yes (created by Expo CLI)
- Committed: No (in .gitignore)

**`/node_modules`:**
- Purpose: npm dependencies (workspace root and each package)
- Generated: Yes (created by npm install)
- Committed: No (in .gitignore)

**`/.planning`:**
- Purpose: GSD command planning documents
- Generated: Yes (created by /gsd commands)
- Committed: Yes (tracked in git)

**`/.git`:**
- Purpose: Git version control
- Generated: Yes (initialized git repository)
- Committed: N/A (metadata directory)

---

*Structure analysis: 2026-02-07*
