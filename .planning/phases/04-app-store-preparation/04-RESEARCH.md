# Phase 4: App Store Preparation - Research

**Researched:** 2026-02-08
**Domain:** iOS App Store submission preparation (branding, build config, legal, listing)
**Confidence:** HIGH

## Summary

Phase 4 covers five distinct work areas: app naming/branding, icon and splash screen creation, privacy policy, EAS Build configuration for iOS production, and App Store Connect listing metadata. The codebase is in good shape for this phase: production infrastructure is fully deployed on Railway (Phase 3 complete), the mobile app uses Expo SDK 54 with React Native 0.81.5, and all features are verified working on device.

The current assets (icon.png, splash-icon.png, adaptive-icon.png) are all **Expo default placeholders** (concentric circles on a grid background) and must be replaced with custom branding. No `eas.json` exists yet, `expo-splash-screen` is not installed, and there is no privacy policy or legal content anywhere in the codebase. The app currently uses the name "PT Tracker" in `app.json` and on the login screen.

**Primary recommendation:** Use `npx testflight` for the fastest path from zero to TestFlight. It handles EAS project setup, credential generation, building, and submission in a single interactive command. For the icon/splash, the user must provide or create a 1024x1024 PNG. For the privacy policy, serve a static HTML page from the existing Express server and link to it from a new screen in the app.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eas-cli | latest | Build, submit, and manage iOS/Android builds | Official Expo tool for production builds and App Store submission |
| expo-splash-screen | ~0.29.x (SDK 54) | Config plugin for splash screen customization | Expo's built-in splash screen solution, replaces legacy `splash` field |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-webview | 13.15.0 | Display privacy policy in-app | Already installed in project |
| expo-linking | SDK 54 compatible | Open external URLs (privacy policy fallback) | If WebView approach is not desired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-splash-screen plugin | Legacy app.json splash config | Legacy approach still works but lacks dark mode support and fine-grained control; plugin is the modern path |
| In-app WebView for privacy policy | expo-web-browser to open in Safari | WebView keeps user in-app; Safari opens externally but requires no screen code |
| Static HTML privacy policy on server | Third-party service (Termly, iubenda) | Self-hosted is free and under your control; third-party adds a dependency |
| `eas build` + `eas submit` | `npx testflight` | `npx testflight` bundles both into one interactive command; separate commands give more control |

### Installation

```bash
# In mobile/ directory
npx expo install expo-splash-screen

# Globally (if not already installed)
npm install -g eas-cli
```

## Architecture Patterns

### App Icon and Splash Screen Asset Pipeline

```
assets/
├── icon.png              # 1024x1024, no transparency, no rounded corners
├── splash-icon.png       # 1024x1024, transparent background OK for splash
├── adaptive-icon.png     # 1024x1024 (Android foreground)
└── favicon.png           # 48x48 (web only)
```

**Icon requirements (iOS):**
- Exactly 1024x1024 pixels
- PNG format
- NO transparency / NO alpha channel
- NO rounded corners (iOS applies mask automatically)
- Must fill the entire square with a solid background

**Splash icon requirements:**
- 1024x1024 pixels recommended
- PNG format (only format supported -- other formats cause production build failure)
- Transparent background OK (the `backgroundColor` config covers the rest)

### Pattern 1: expo-splash-screen Config Plugin

**What:** Modern splash screen configuration using the expo-splash-screen plugin in app.json
**When to use:** All new Expo SDK 52+ projects
**Example:**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#2563EB",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200
        }
      ]
    ]
  }
}
```

Source: https://docs.expo.dev/versions/latest/sdk/splash-screen/

### Pattern 2: EAS Build Configuration (eas.json)

**What:** Build profiles for development, preview, and production
**When to use:** Required for any EAS build
**Example:**

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "resourceClass": "large"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
      }
    }
  }
}
```

Source: https://docs.expo.dev/build/eas-json/

### Pattern 3: Privacy Policy as Server-Served Static Page

**What:** Serve a privacy policy HTML page from the Express server, display in-app via WebView
**When to use:** Apps that need a privacy policy accessible both in-app and from a URL (App Store requirement)
**Example route addition in server/src/index.ts:**

```typescript
// Public route -- no auth required
app.get("/privacy", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/privacy.html"));
});
```

In-app display via existing react-native-webview:

```tsx
import { WebView } from 'react-native-webview';

export default function PrivacyPolicyScreen() {
  return (
    <WebView source={{ uri: 'https://pt-tracker-production-353a.up.railway.app/privacy' }} />
  );
}
```

### Pattern 4: App Store Review Demo Account

**What:** Providing test credentials for Apple's review team
**When to use:** Required for all apps with login
**Details:**
- Must provide demo credentials in App Store Connect's "App Review Information" section
- This app has TWO login types: trainer (password) and client (access code)
- Need to provide both in the review notes
- Backend must be live and accessible during review

### Anti-Patterns to Avoid

- **Using transparency in the iOS app icon:** Apple rejects icons with alpha channels. The icon PNG must have no transparency at all.
- **Testing splash screen in Expo Go or dev builds:** Expo Go renders its own splash screen over yours, making testing unreliable. Use a preview or production build to test.
- **Hardcoding the privacy policy URL:** Use `Constants.expoConfig.extra.apiUrl` (already in use) to construct the privacy policy URL dynamically.
- **Submitting without a test account:** Apps with login will be rejected if Apple's review team cannot sign in. Must provide trainer password AND a client access code.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| App icon generation at multiple sizes | Manual creation of each iOS icon size | Expo/EAS build pipeline | EAS automatically generates all required sizes from a single 1024x1024 source |
| Splash screen native configuration | Manual Xcode storyboard editing | expo-splash-screen config plugin | Plugin handles iOS LaunchScreen.storyboard generation automatically |
| iOS code signing | Manual provisioning profiles and certs | EAS managed credentials | EAS generates, stores, and manages distribution certificates and provisioning profiles |
| App Store binary upload | Manual Xcode upload via Transporter | `eas submit` or `npx testflight` | Automated, scriptable, handles API key auth |
| Privacy policy generator | Write HTML from scratch | Template from Termly or similar + customize | Templates cover standard legal language; customize for your specific data types |

**Key insight:** The Expo/EAS toolchain handles nearly all of the platform-specific complexity (icon sizing, code signing, binary uploading). The manual work is in creating the actual assets (icon design, screenshots) and content (privacy policy text, App Store description).

## Common Pitfalls

### Pitfall 1: Icon Rejected for Alpha Channel
**What goes wrong:** App Store Connect rejects the uploaded icon because it contains transparency.
**Why it happens:** Many design tools export PNG with alpha channels by default, even if the icon looks fully opaque.
**How to avoid:** Export the icon as PNG-24 without alpha channel, or flatten it onto a solid background color. Verify with: `file icon.png` should NOT say "alpha" in the output.
**Warning signs:** Icon looks correct visually but has a transparent pixel somewhere.

### Pitfall 2: Splash Screen Cached Between Builds
**What goes wrong:** After changing the splash screen image or config, the old splash screen still appears.
**Why it happens:** iOS caches launch screens aggressively. Development builds compound this.
**How to avoid:** Test splash screen changes with `eas build --profile preview` (not dev builds). If using local builds, run `npx expo run:ios --no-build-cache`.
**Warning signs:** Splash changes work on Android but not iOS.

### Pitfall 3: Bundle Identifier Conflict
**What goes wrong:** EAS build fails or App Store Connect rejects because the bundle identifier is already taken or misconfigured.
**Why it happens:** `com.pttracker.app` (currently in app.json) may already be registered by another developer.
**How to avoid:** Verify the bundle identifier is available by checking in Apple Developer Portal before building. Consider using a more unique identifier like `com.yourname.pttracker`.
**Warning signs:** "Bundle identifier not available" error during `eas build:configure` or App Store Connect app creation.

### Pitfall 4: Missing App Store Review Credentials
**What goes wrong:** Apple rejects the app because they cannot test it without login credentials.
**Why it happens:** Developers forget to add demo account information in App Store Connect.
**How to avoid:** In App Store Connect > App Review Information, provide BOTH the trainer password AND a client access code (e.g., SAR101). Add a note explaining the two login flows.
**Warning signs:** Apple's review feedback says "We were unable to review your app as it crashed on launch" or "We need credentials."

### Pitfall 5: Privacy Policy Not Accessible
**What goes wrong:** Apple requires a working privacy policy URL. If the server is down or the URL returns 404, the submission is rejected.
**Why it happens:** Privacy policy served from the API server which might have issues, or URL is wrong.
**How to avoid:** Test the privacy policy URL independently. Consider also hosting it on a static site (GitHub Pages) as a fallback. Verify it loads in a browser before submission.
**Warning signs:** Privacy policy URL returns non-200 status.

### Pitfall 6: Screenshots Don't Match App
**What goes wrong:** Apple rejects screenshots that don't accurately represent the app or show content that doesn't exist.
**Why it happens:** Using placeholder data in screenshots, or screenshots from an old version.
**How to avoid:** Take screenshots from the production build with realistic (but not real client) data. All screenshots must accurately represent the app experience.
**Warning signs:** Screenshots show features not in the build, or UI looks different from actual app.

## Code Examples

### eas.json Production Configuration

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID"
      }
    }
  }
}
```

Source: https://docs.expo.dev/build/eas-json/

### Updated app.json with Splash Screen Plugin

```json
{
  "expo": {
    "name": "PT Tracker",
    "slug": "pt-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pttracker.app",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png"
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#2563EB",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200
        }
      ]
    ],
    "extra": {
      "apiUrl": "https://pt-tracker-production-353a.up.railway.app"
    }
  }
}
```

### Privacy Policy Screen

```tsx
import React from "react";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000";

export default function PrivacyPolicyScreen() {
  return (
    <WebView
      source={{ uri: `${API_URL}/privacy` }}
      style={{ flex: 1 }}
    />
  );
}
```

### npx testflight (Single-Command Workflow)

```bash
# From the mobile/ directory
npx testflight
```

This interactive command handles:
1. EAS project setup (creates/detects linked project on expo.dev)
2. Bundle identifier confirmation
3. Apple Developer authentication (Apple ID + 2FA)
4. Distribution certificate and provisioning profile generation
5. Production build (.ipa)
6. App Store Connect API key verification
7. TestFlight upload and internal testing distribution

Source: https://docs.expo.dev/build-reference/npx-testflight/

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `splash` field in app.json | `expo-splash-screen` config plugin | Expo SDK 50+ | Plugin provides dark mode support, imageWidth control, better caching behavior |
| `eas build` + `eas submit` separate steps | `npx testflight` single command | 2025 | Dramatically simplifies first-time TestFlight deployment |
| Upload screenshots for every device size | Upload 6.9" iPhone + 13" iPad only | Late 2024 | Apple auto-scales for smaller devices; only need 1320x2868 iPhone + 2064x2752 iPad |
| App name up to 50 characters | App name up to 30 characters | 2024 | Shorter name requirement enforced in App Store Connect |
| Multiple screenshot sets required | One 6.9" set sufficient for iPhone | Late 2024 | Can submit with just 1320x2868 pixel screenshots and Apple handles the rest |

**Deprecated/outdated:**
- Legacy `splash` field in app.json: Still works but does not support dark mode or fine-grained image sizing. Migrate to expo-splash-screen plugin.
- Manual Xcode signing workflow: Fully replaced by EAS managed credentials for Expo projects.

## Current Codebase State

### What Exists

| Item | Current State | Action Needed |
|------|--------------|---------------|
| App name | "PT Tracker" in app.json and LoginScreen | User must confirm or change |
| Bundle identifier | `com.pttracker.app` in app.json | Verify availability in Apple Developer Portal |
| App icon | Expo default placeholder (1024x1024) | Replace with custom design |
| Splash screen | Expo default placeholder, legacy splash config | Install expo-splash-screen, replace image, update config |
| Adaptive icon | Expo default placeholder | Replace with custom design |
| eas.json | Does not exist | Create with build and submit profiles |
| EAS CLI | Not installed globally | Install with `npm install -g eas-cli` |
| expo-splash-screen | Not installed | Install with `npx expo install expo-splash-screen` |
| Privacy policy | Does not exist | Create HTML page, serve from server, add in-app screen |
| App Store screenshots | Do not exist | Capture from production build |
| App Store description | Does not exist | Write description, keywords, select category |
| react-native-webview | Already installed (13.15.0) | Use for privacy policy display |
| Production server | Running on Railway | Add public `/privacy` route for privacy policy |
| Apple Developer Account | Unknown | User must have $99/year membership |

### Data Collected (for Privacy Policy)

Based on database migrations and route analysis, the app collects:

| Data Type | Apple Category | Details |
|-----------|---------------|---------|
| Name (first, last) | Contact Info | Stored in `clients` table |
| Email | Contact Info | Optional, stored in `clients` table |
| Phone | Contact Info | Optional, stored in `clients` table |
| Body measurements | Health & Fitness | Weight, body fat %, chest, waist, hips, arm, thigh measurements |
| Workout logs | Health & Fitness | Exercise details, sets, reps, weights, notes |
| Progress photos | Photos | Client body progress photos with category labels |
| Push notification tokens | Identifiers | Expo push tokens stored in `push_tokens` table |
| Messages | User Content | Text messages between trainer and clients |
| Session data | App Functionality | Scheduled session dates, times, status, notes |

**Not collected:**
- Location data
- Financial/payment info
- Browsing history
- Third-party advertising data
- Analytics/tracking (beyond Sentry error monitoring on server)

### App Store Privacy Nutrition Label Declaration

Based on the data above, the App Store Connect privacy questionnaire responses should be:

| Category | Data Types | Usage | Linked to Identity |
|----------|-----------|-------|-------------------|
| Contact Info | Name, Email, Phone | App Functionality | Yes |
| Health & Fitness | Body measurements, Exercise data | App Functionality | Yes |
| Photos or Videos | Progress photos | App Functionality | Yes |
| Identifiers | Device ID (push token) | App Functionality | Yes |
| User Content | Messages | App Functionality | Yes |
| Diagnostics | Crash logs (Sentry) | Analytics | No |

**Data NOT used for tracking.** No third-party advertising. No data sold.

## Open Questions

1. **App Name Confirmation**
   - What we know: Currently "PT Tracker" in app.json and LoginScreen
   - What's unclear: Whether the user wants to keep this name or choose something different
   - Recommendation: User decision required. Name must be <= 30 characters for App Store. Check availability on App Store before committing.

2. **Apple Developer Account Status**
   - What we know: Required for EAS builds, App Store submission, and code signing
   - What's unclear: Whether the user has an active $99/year Apple Developer Program membership
   - Recommendation: Must be confirmed before any build work. EAS will prompt for Apple ID login during build.

3. **Bundle Identifier Availability**
   - What we know: Currently set to `com.pttracker.app`
   - What's unclear: Whether this identifier is available in Apple Developer Portal
   - Recommendation: Check during EAS project setup. If taken, change to something unique like `com.USERNAME.pttracker`.

4. **App Icon Design**
   - What we know: Need a 1024x1024 PNG with no transparency
   - What's unclear: Whether the user has a design ready or needs one created
   - Recommendation: This is the main blocker for the phase. Icon must be created or provided by the user. A simple programmatic icon (letter/symbol on branded background) can be generated as a fallback.

5. **App Store Screenshots**
   - What we know: Need at minimum 1320x2868 pixel screenshots (6.9" iPhone size)
   - What's unclear: Whether screenshots should show real data or demo data, and how many screens to showcase
   - Recommendation: Take screenshots from a production build with realistic demo data. Aim for 4-6 screenshots showing: login, dashboard, client detail, workout log, messaging, and progress photos.

6. **Privacy Policy Hosting Redundancy**
   - What we know: Can serve from Railway Express server at `/privacy`
   - What's unclear: What happens if Railway is down during Apple's review
   - Recommendation: Consider also hosting on a static site (GitHub Pages) as backup. For v1, the Railway server is sufficient since it must be up for the app to work anyway.

## Sources

### Primary (HIGH confidence)
- [Expo Splash Screen docs](https://docs.expo.dev/versions/latest/sdk/splash-screen/) - Plugin configuration, API methods, installation
- [Expo App Icon & Splash Screen guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) - Asset requirements, dimensions, format rules
- [EAS Build eas.json configuration](https://docs.expo.dev/build/eas-json/) - Build profiles, iOS options, environment variables
- [EAS Build setup guide](https://docs.expo.dev/build/setup/) - First-time setup steps, prerequisites
- [EAS Submit iOS](https://docs.expo.dev/submit/ios/) - App Store submission process, authentication methods
- [npx testflight command](https://docs.expo.dev/build-reference/npx-testflight/) - Single-command TestFlight deployment
- [Expo iOS production build tutorial](https://docs.expo.dev/tutorial/eas/ios-production-build/) - Step-by-step production build guide

### Secondary (MEDIUM confidence)
- [Apple App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/) - Device sizes, format requirements
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) - Nutrition label data categories
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) - Review requirements including demo accounts
- [Apple App Store submitting guide](https://developer.apple.com/app-store/submitting/) - Submission checklist

### Tertiary (LOW confidence)
- [App Store Screenshot Sizes 2026 guides](https://adapty.io/blog/app-store-screenshot-sizes-dimensions/) - Third-party confirmation of simplified screenshot requirements
- [Termly Privacy Policy Template](https://termly.io/resources/templates/app-privacy-policy/) - Template reference for privacy policy content

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Expo/EAS toolchain is well-documented, verified against official docs
- Architecture: HIGH - Patterns are standard Expo conventions verified against current documentation
- Pitfalls: HIGH - Common issues documented in official Expo guides and Apple developer forums
- Privacy policy content: MEDIUM - Data types identified from codebase analysis, but Apple's exact nutrition label questions may have nuances
- App Store listing: MEDIUM - Screenshot size simplification verified across multiple sources but exact current requirements could vary

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- stable domain, Expo SDK 54 is current)
