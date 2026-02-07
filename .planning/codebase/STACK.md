# Technology Stack

**Analysis Date:** 2026-02-07

## Languages

**Primary:**
- TypeScript 5.7.0+ (server) / ~5.9.2 (mobile) - All application code
- SQL - Database migrations and queries

**Secondary:**
- JavaScript - Build artifacts and React Native runtime

## Runtime

**Environment:**
- Node.js v24.13.0
- React Native 0.81.5
- React 19.1.0

**Package Manager:**
- npm 11.6.2
- Workspace-based monorepo (server + mobile)
- Lockfile: Not present (only in nested node_modules, not committed)

## Frameworks

**Core:**
- Express 5.1.0 - REST API server
- Expo SDK ~54.0.33 - Mobile app framework
- React Navigation 7.x - Mobile navigation (native-stack + bottom-tabs)

**Testing:**
- Not detected

**Build/Dev:**
- tsx 4.19.0 - TypeScript execution and watch mode for server
- TypeScript compiler 5.7.0/5.9.2 - Type checking

## Key Dependencies

**Critical:**
- pg 8.13.0 - PostgreSQL client for database access
- jsonwebtoken 9.0.3 - JWT authentication tokens
- @tanstack/react-query 5.90.20 - Server state management and caching
- expo-notifications 0.32.16 - Push notification handling
- multer 1.4.5-lts.2 - File upload handling (photos/videos)

**Infrastructure:**
- cors 2.8.5 - Cross-origin request handling
- @react-native-async-storage/async-storage 2.2.0 - Local storage for tokens
- expo-av 16.0.8 - Audio/video playback
- expo-image-picker 17.0.10 - Camera and photo library access
- expo-device 8.0.10 - Device info for push notifications
- expo-constants 18.0.13 - Expo config access

**UI/Visualization:**
- react-native-calendars 1.1314.0 - Calendar view
- react-native-chart-kit 6.12.0 - Data visualization
- react-native-svg 15.12.1 - SVG rendering
- react-native-youtube-iframe 2.4.1 - YouTube video embeds

## Configuration

**Environment:**
- Server requires: `TRAINER_PASSWORD`, `JWT_SECRET`, `DATABASE_URL` (optional)
- No .env files committed (environment variables set at runtime)
- Default database: `postgresql://localhost:5432/pt_tracker`

**Build:**
- `server/tsconfig.json` - ES2022 target, ES2022 modules, bundler resolution
- `mobile/tsconfig.json` - Extends expo/tsconfig.base, strict mode enabled
- `mobile/app.json` - Expo configuration (orientation, icons, platform settings)

## Platform Requirements

**Development:**
- Node.js 24.x
- PostgreSQL database
- Expo CLI (for mobile development)
- Physical device or emulator for push notifications

**Production:**
- Deployment target: Not configured (development only)
- API server: Any Node.js hosting platform
- Mobile: Expo Go or native build (iOS/Android)

---

*Stack analysis: 2026-02-07*
