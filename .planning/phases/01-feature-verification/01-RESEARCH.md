# Phase 1: Feature Verification - Research

**Researched:** 2026-02-07
**Domain:** Manual QA / Mobile feature verification on iOS device (Expo SDK 54, React Native 0.81)
**Confidence:** HIGH

## Summary

This phase is about testing and fixing 4 code-complete features on a physical iOS device: workout logging UX, progress photos, push notifications, and messaging. All server-side code and migrations are done and verified via curl. The mobile screens, hooks, and components exist but have never been tested on a real device.

After thorough code review, I identified several categories of potential issues: (1) a critical blocker for push notifications (Expo Go no longer supports push in SDK 53+, requiring a development build), (2) likely runtime bugs from untested code paths (e.g., ConversationListScreen client redirect, API hardcoded IP, notification tap navigation), (3) missing app.json configuration for notifications, and (4) general patterns where the code "looks right" but needs device validation.

**Primary recommendation:** Start with features that work in Expo Go (workout logging, progress photos, messaging UI) to fix any runtime bugs, then create a development build for push notification testing. Each feature should be tested with both trainer and client accounts.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| expo | ~54.0.33 | Framework | Installed |
| react-native | 0.81.5 | Mobile framework | Installed |
| expo-notifications | ~0.32.16 | Push notifications | Installed |
| expo-image-picker | ~17.0.10 | Photo selection | Installed |
| expo-device | ~8.0.10 | Physical device check | Installed |
| expo-constants | ~18.0.13 | Get projectId | Installed |
| expo-av | ~16.0.8 | Audio playback (rest timer) | Installed |
| @tanstack/react-query | ^5.90.20 | Data fetching/caching | Installed |
| @react-navigation/native | ^7.1.28 | Navigation | Installed |

### Supporting (May Need)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| expo-dev-client | Development builds | Required for push notification testing |
| eas-cli | Build tooling | Required to create development build |

**Installation (if needed for push testing):**
```bash
cd mobile && npx expo install expo-dev-client
npm install -g eas-cli
```

## Architecture Patterns

### Testing Order (by dependency/difficulty)

The features should be tested in this order based on what can run in Expo Go vs. requiring a development build:

```
Phase 1 Testing Order:
1. Workout Logging UX     -- Works in Expo Go, no native deps
2. Progress Photos         -- Works in Expo Go (image picker works in Expo Go)
3. Messaging               -- Works in Expo Go, no native deps
4. Push Notifications      -- REQUIRES development build (won't work in Expo Go)
```

### Test Matrix Pattern

Each feature must be tested from both roles:

```
Feature Test Matrix:
├── As Trainer (password: test123)
│   ├── Feature-specific actions (create, edit, delete)
│   ├── Data persists after app restart
│   └── Cross-role interaction verified
└── As Client (access codes: SAR101, MAR102, etc.)
    ├── Feature-specific actions (view, interact)
    ├── Data persists after app restart
    └── Receives appropriate data from trainer actions
```

### Server Startup Pattern

```bash
# Terminal 1: Start server
cd server && TRAINER_PASSWORD=test123 JWT_SECRET=dev-secret-change-me npx tsx src/index.ts

# Terminal 2: Start mobile
cd mobile && npx expo start
```

### Fix-Test-Fix Loop Pattern

For each feature:
1. Run the feature flow manually on device
2. When a bug is found, fix it in code
3. Expo hot-reload picks up the change
4. Re-test the same flow
5. Move to next flow only when current passes

## Identified Issues (Pre-Testing Code Review)

These are bugs and concerns found by reading the code. They should be validated and fixed during testing.

### CRITICAL: Push Notifications Require Development Build

**Confidence:** HIGH (verified via Expo official docs and multiple sources)
**What:** Expo Go does NOT support push notifications starting from SDK 53. The project uses SDK 54.
**Impact:** The entire push notification feature (Phase 1 plan 01-03) cannot be tested in Expo Go.
**Fix required:**
1. Run `npx expo install expo-dev-client`
2. Create a development build using either:
   - `npx expo run:ios --device` (requires Mac + Xcode + free Apple ID at minimum)
   - `eas build --platform ios --profile development` (requires Apple Developer account OR free provisioning via Xcode)
3. Free Apple ID provisioning: Valid for 7 days, max 3 devices, no App Store/TestFlight. Good enough for testing.
4. The `app.json` is MISSING the `extra.eas.projectId` field, which is needed for `getExpoPushTokenAsync()`. This will cause a crash or silent failure.

### CRITICAL: Missing EAS/Notification Config in app.json

**Confidence:** HIGH (verified by reading app.json)
**What:** The `app.json` has no `extra.eas.projectId` configured. The notification service at `mobile/src/services/notifications.ts` line 34-36 reads `Constants.expoConfig?.extra?.eas?.projectId` which will be `undefined`.
**Impact:** `getExpoPushTokenAsync({ projectId: undefined })` will likely throw an error or return an invalid token.
**Fix:** Need to run `eas init` or manually add the EAS project ID to app.json:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### HIGH: ConversationListScreen Infinite Redirect for Clients

**Confidence:** HIGH (verified by reading code)
**What:** In `ConversationListScreen.tsx` lines 41-45, when the user is a client, the component calls `navigation.replace("ClientChat")` during render, then returns null. This runs on every render cycle because the component re-mounts when navigated to.
**Impact:** Likely causes a navigation warning, infinite loop, or screen flash for client users. The client Messages tab navigates through ConversationListScreen before redirecting to ClientChat.
**Analysis:** Actually, looking at App.tsx more carefully, the client Messages tab points directly to `ClientMessagesNavigator` which starts at `ClientChat` screen. So `ConversationListScreen` is only used in the trainer flow. However, the code still has this redirect path which could be triggered if a client somehow reaches it. Low risk but should be verified.

### HIGH: Hardcoded DEV_HOST IP Address

**Confidence:** HIGH (verified by reading code)
**What:** `api.ts` line 4 has `const DEV_HOST = "192.168.1.68"`. This is the developer's LAN IP.
**Impact:** If the developer's IP has changed (DHCP reassignment, different network), the app will fail to connect to the server. This is the most common "nothing works" issue during testing.
**Fix:** Update the IP address to match the current machine's IP before testing. Run `ifconfig | grep "inet "` on Mac.

### MEDIUM: Progress Photo Upload Access Control

**Confidence:** HIGH (verified by reading code)
**What:** The server's `progressPhotos.ts` POST route (line 49) uses `requireTrainer`, meaning only trainers can upload progress photos. The client-side `MyPhotosScreen.tsx` has no upload button (view-only for clients), which is consistent. However, the success criterion says "Trainer AND client can upload progress photos."
**Impact:** If the success criterion literally means both roles should upload, the server needs a code change. If "trainer uploads on behalf of client" is the intended flow, then it works correctly.
**Resolution:** Clarify intent. Current code: trainer uploads, client views. This seems intentional given the overall PT tracker workflow.

### MEDIUM: Notification Tap Navigation is Shallow

**Confidence:** HIGH (verified by reading code)
**What:** In `App.tsx` lines 369-377, notification tap handler only navigates to the "Messages" tab. It doesn't navigate to a specific conversation (the `clientId` in the data payload is read but not used for deep navigation).
**Impact:** For session reminders (data.type === "session_reminder"), there's no handling at all -- tapping does nothing. For message notifications, it goes to the message list but not the specific chat.
**Fix needed:** Handle more notification types and navigate deeper:
- `type: "message"` -> navigate to Chat screen with clientId
- `type: "session_reminder"` -> navigate to SessionDetail with sessionId
- `type: "measurement_recorded"` -> navigate to MyProgress

### MEDIUM: markAsRead useEffect Missing Dependency

**Confidence:** HIGH (verified by reading code)
**What:** In both `ChatScreen.tsx` (line 33) and `ClientChatScreen.tsx` (line 30), `useEffect` depends on `messages?.length` but `markAsRead` is not in the dependency array. React will warn about this.
**Impact:** May cause stale closure issues or React warnings. The `markAsRead.mutate()` reference could become stale.
**Fix:** Wrap in useCallback or restructure to avoid the lint warning.

### LOW: RestTimer Audio URL is External

**Confidence:** HIGH (verified by reading code)
**What:** `RestTimer.tsx` line 25 loads audio from `https://actions.google.com/sounds/v1/alarms/beep_short.ogg`. This requires internet access.
**Impact:** If network is slow, the alarm may not play. Not a blocker -- the catch block handles failure silently. Could be improved by bundling a local sound file.

### LOW: Photo Comparison Edge Case

**Confidence:** MEDIUM
**What:** `PhotoComparisonScreen.tsx` line 33 shows "Need at least 2 photos" message when there are 0 photos, but if there's exactly 1 photo, it still renders with both "before" and "after" pointing to the same photo (rightIndex defaults to 0 when photos.length is 1).
**Impact:** Minor UX issue -- not a crash, just confusing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification testing | Custom push sender | Expo Push Notifications Tool (https://expo.dev/notifications) | Official tool, validates token format |
| Development build | Manual Xcode project | `npx expo run:ios --device` or `eas build` | Handles native config, code signing |
| API connectivity debugging | Guess-and-check IP | `ifconfig \| grep "inet "` + verify with `curl http://<IP>:3000/api/health` | Deterministic, fast |
| File upload debugging | Console.log only | Server-side `multer` error logging + React Native network inspector | Shows actual request/response |

## Common Pitfalls

### Pitfall 1: Wrong LAN IP Address
**What goes wrong:** App shows loading spinner forever, all API calls fail silently
**Why it happens:** `api.ts` has a hardcoded IP that may not match current network
**How to avoid:** Before any testing, run `ifconfig | grep "inet "` on the Mac, update `DEV_HOST` in `api.ts` to match
**Warning signs:** "Network request failed" errors, infinite loading states

### Pitfall 2: Testing Push Notifications in Expo Go
**What goes wrong:** `requestNotificationPermission()` returns null because `Device.isDevice` is true but Expo Go doesn't support push tokens in SDK 53+
**Why it happens:** Expo Go removed push notification support starting SDK 53
**How to avoid:** Build a development build first. Test other features in Expo Go while setting up the dev build.
**Warning signs:** "No push tokens registered" error from test notification endpoint

### Pitfall 3: Missing EAS Project ID
**What goes wrong:** `getExpoPushTokenAsync({ projectId: undefined })` throws or returns invalid token
**Why it happens:** `app.json` has no `extra.eas.projectId` configured
**How to avoid:** Run `eas init` to set up the project, or manually add projectId to app.json
**Warning signs:** Error in console about "projectId" when registering for notifications

### Pitfall 4: FormData Upload Failing on iOS
**What goes wrong:** Progress photo upload returns "Upload failed" with 400 or 500 status
**Why it happens:** React Native FormData handling has platform-specific quirks. The current code uses `{ uri, name, type } as unknown as Blob` pattern which should work on iOS but may need the `Content-Type` header to NOT be set (let the browser set multipart boundary)
**How to avoid:** The current `api.ts` upload methods correctly omit `Content-Type` from headers for FormData uploads (they only set Authorization). This is correct.
**Warning signs:** Network errors during photo upload, 400 responses from multer

### Pitfall 5: Server Not Serving Static Uploads
**What goes wrong:** Photos appear as broken images
**Why it happens:** The server at `index.ts:25` serves `/uploads` from `path.join(__dirname, "../uploads")`. The upload path is relative to the compiled JS location. If `tsx` runner changes the __dirname context, images won't be found.
**How to avoid:** Verify `curl http://localhost:3000/uploads/progress/` returns a directory listing or that a known file is accessible
**Warning signs:** 404 errors on image URLs, broken image placeholders

### Pitfall 6: Client Token Not Carrying clientId
**What goes wrong:** Client-side features fail with "Access denied" or show wrong data
**Why it happens:** The JWT for client login must include `clientId` in the payload. If `AuthContext.tsx` doesn't properly propagate it, all client-scoped queries fail.
**How to avoid:** Verify by logging the decoded token. Check `user.clientId` is populated after client login.
**Warning signs:** 403 errors on client-only endpoints, empty data on client portal screens

## Code Examples

### Verifying LAN IP Before Testing
```bash
# Get current LAN IP (macOS)
ifconfig en0 | grep "inet " | awk '{print $2}'

# Verify server is reachable from device
curl http://<YOUR_IP>:3000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Creating Development Build for Push Notifications
```bash
# Option A: Local build with Xcode (requires Mac + Xcode)
cd mobile
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios --device

# Option B: EAS cloud build (requires account setup)
eas init
eas build --platform ios --profile development
```

### Testing Push Token Registration
```bash
# After app registers token, check it exists in DB:
psql -d pt_tracker -c "SELECT * FROM push_tokens WHERE is_active = true;"
```

### Testing Push Notification via Expo Tool
```bash
# Or via curl directly:
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "Test",
    "body": "Hello from push!"
  }'
```

### Sending a Test Message via curl (to verify server)
```bash
# Get trainer token
TOKEN=$(curl -s http://localhost:3000/api/auth/trainer-login \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Send message to client 1
curl -X POST http://localhost:3000/api/messages/conversations/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from trainer!"}'
```

## Feature-by-Feature Test Checklists

### Feature 1: Workout Logging UX
**Test as trainer:**
1. Navigate to Clients > select client > Sessions > select session > Log Workout
2. Verify ExercisePicker shows search results when typing 2+ chars
3. Add multiple exercises with set details (weight/reps)
4. Mark sets as completed via checkbox
5. Add notes to an exercise
6. Tap "Save All" and verify success alert
7. Close and reopen the screen -- saved logs appear under "Saved Logs"
8. Edit a saved log (name, sets, notes) and save
9. Delete a saved log
10. Reorder saved logs with up/down arrows
11. Apply a template (if templates exist)
12. Use the Rest Timer (expand, set time, start, verify alarm plays)
13. Force-close app and reopen -- data persists

### Feature 2: Progress Photos
**Test as trainer:**
1. Navigate to Clients > select client > Photos tab > View All Photos
2. Tap + FAB to upload a photo from gallery
3. Select category (front/side/back/other)
4. Verify photo appears in grid with correct category badge and date
5. Filter by category using filter chips
6. Tap "Compare" to open comparison screen
7. Navigate through photos with left/right arrows in comparison
8. Long-press a photo to delete it
9. Verify deletion removes photo from list

**Test as client:**
1. Login with access code (e.g., SAR101)
2. Navigate to Progress > View Progress Photos
3. Verify photos uploaded by trainer are visible
4. Filter by category
5. Note: Client is view-only (no upload FAB, no delete)

### Feature 3: Push Notifications (REQUIRES DEV BUILD)
**Test as client (primary recipient):**
1. Verify permission prompt appears on first launch
2. Check push token registered in DB (`push_tokens` table)
3. Go to notification settings, verify preferences load
4. Toggle preferences on/off and verify they save
5. Send test notification from settings screen
6. As trainer (second device or session): record a measurement for this client
7. Verify client receives "New Measurement" push notification
8. As trainer: send a message to this client
9. Verify client receives "New Message" push notification
10. Tap the notification -- verify it opens the app (to Messages tab at minimum)
11. Schedule a session for 15-60 min from now and wait for reminder
12. Verify session reminder notification arrives

**Test as trainer:**
1. As client: send a message
2. Verify trainer receives "New Message" push notification
3. Verify session reminder notification arrives for upcoming sessions

### Feature 4: Messaging
**Test as trainer:**
1. Navigate to Messages tab
2. Verify conversation list shows all active clients
3. Tap a client to open chat
4. Send a message -- verify it appears as "mine" (right-aligned, blue)
5. Verify message appears with timestamp
6. Close and reopen chat -- messages persist
7. Send multiple messages -- verify scroll to bottom

**Test as client:**
1. Login as client (SAR101)
2. Navigate to Messages tab -- should go directly to chat (no conversation list)
3. Send a message to trainer
4. Verify it appears as "mine"
5. Switch to trainer -- verify message appears as "theirs" (left-aligned)
6. As trainer, reply -- switch back to client view
7. Verify trainer's reply appears within ~10 seconds (refetchInterval)
8. Verify unread badge on Messages tab updates
9. Open chat -- verify unread badge clears (markAsRead fires)
10. Force-close and reopen -- conversation history persists

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Push in Expo Go | Push requires dev build | SDK 53 (2025) | Must build native binary for push testing |
| Manual APN config | Expo Push Service handles it | Ongoing | No need for APNs certificates for development |
| Expo Go for all testing | Dev builds for native features | SDK 53+ | Split testing approach needed |

## Open Questions

1. **Does the user have a Mac with Xcode installed?**
   - What we know: Push notification testing requires either a development build (needs Xcode for local iOS build) or EAS cloud build
   - What's unclear: User's development environment setup
   - Recommendation: Assume Mac with Xcode is available (common for iOS dev). If not, use EAS cloud build.

2. **Is the user's current LAN IP still 192.168.1.68?**
   - What we know: This IP is hardcoded in `api.ts`
   - What's unclear: Whether it's current
   - Recommendation: First step in every plan should be "verify and update DEV_HOST IP"

3. **Should clients be able to upload progress photos?**
   - What we know: Server requires trainer role for photo upload. Client screen is view-only. Success criteria says "Trainer AND client can upload."
   - What's unclear: Whether "upload" in the criteria means trainer uploads on behalf of client, or client self-uploads
   - Recommendation: Treat current behavior (trainer uploads, client views) as correct since it matches the PT workflow. If client upload is needed, it's a small server change (change `requireTrainer` to `requireOwnClient`).

4. **Is there existing data in the database for testing?**
   - What we know: 8 test clients with access codes exist. Unknown whether sessions, exercises, or other test data exists.
   - What's unclear: Whether the DB has enough data to test all flows
   - Recommendation: Plans should include "seed test data" steps where needed (create a session, create an exercise, etc.)

5. **Does the session creation trigger a push notification to the client?**
   - What we know: Success criteria says "Client receives a push notification when a session is scheduled." But the sessions route (`sessions.ts`) does NOT call `notifyClient` on POST. Only measurements route sends push on create.
   - What's unclear: Whether this was intentionally deferred or an omission
   - Recommendation: This is likely a bug/omission. The session scheduler sends reminders before sessions, but there's no notification when a session is initially scheduled. A fix would be adding `notifyClient` to the session creation route.

## Sources

### Primary (HIGH confidence)
- Codebase review of all 4 features (screens, hooks, components, server routes, services)
- [Expo Push Notifications Setup Docs](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo Notifications SDK Reference](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications FAQ](https://docs.expo.dev/push-notifications/faq/)

### Secondary (MEDIUM confidence)
- [Expo Go vs Development Builds](https://expo.dev/blog/expo-go-vs-development-builds)
- [Create Development Build Docs](https://docs.expo.dev/develop/development-builds/create-a-build/)
- [Free iOS Provisioning via Xcode](https://yvainee.com/blog/create-development-builds-without-an-Apple-Developer-Program)
- [Expo Image Picker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

### Tertiary (LOW confidence)
- [FormData upload issues on Android (GitHub issue)](https://github.com/expo/expo/issues/25577) -- iOS focus, but good awareness

## Metadata

**Confidence breakdown:**
- Feature code review: HIGH - Direct codebase analysis, all files read
- Identified bugs: HIGH - Found by reading code, high probability of being real issues
- Push notification requirements: HIGH - Verified via Expo official docs, multiple sources confirm
- Testing patterns: HIGH - Based on actual code structure and API contracts
- Open questions: MEDIUM - Some require user input to resolve definitively

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- no major dependency changes expected)
