# Phase 2: UI Polish & UX Hardening - Research

**Researched:** 2026-02-07
**Domain:** React Native UI consistency, state handling, form validation, onboarding
**Confidence:** HIGH

## Summary

This phase transforms 27 screens (26 + login) from functional but inconsistently styled code into a polished, professional-feeling app. After auditing every screen file, the codebase is already in good shape: it uses a centralized theme.ts, the color palette is consistent, and most screens handle loading/error/empty states. The work is primarily about (1) extracting duplicated UI patterns into reusable components, (2) filling the gaps where screens lack retry buttons, error detail, or empty states, (3) adding network-aware error handling, (4) building a client onboarding flow, and (5) adding inline form validation.

The codebase uses NO external UI library (no NativeBase, no React Native Paper, no Gluestack). All styling is done with React Native's built-in StyleSheet and the app's custom `theme.ts`. This is the correct approach for this project size. Adding a full UI library at this stage would create more disruption than value.

**Primary recommendation:** Create reusable wrapper components (ScreenContainer, EmptyState, ErrorState, FormField) that standardize the repeated patterns found across all 27 screens, then systematically apply them. Add `@react-native-community/netinfo` for network detection and build a simple 3-screen onboarding flow using a FlatList-based swiper (no external library needed for this simple case).

## Codebase Audit: Current State

### What Already Exists (Good Foundation)

**Theme system (`mobile/src/theme.ts`):**
- `colors`: 12 named colors (primary, primaryDark, secondary, success, warning, danger, background, surface, text, textSecondary, border, disabled)
- `spacing`: 5 sizes (xs:4, sm:8, md:16, lg:24, xl:32)
- `fontSize`: 5 sizes (sm:13, md:15, lg:18, xl:22, xxl:28)
- Every screen imports and uses these consistently

**Loading states (already present on most screens):**
- DashboardScreen: ActivityIndicator centered
- ClientListScreen: ActivityIndicator centered
- ClientDetailScreen: ActivityIndicator centered
- CalendarScreen: ActivityIndicator centered
- ExerciseListScreen: ActivityIndicator centered
- MySessionsScreen: ActivityIndicator centered
- MyProgressScreen: ActivityIndicator centered
- MyWorkoutLogScreen: ActivityIndicator centered
- ConversationListScreen: ActivityIndicator centered
- ChatScreen: ActivityIndicator centered
- NotificationSettingsScreen: ActivityIndicator centered
- TemplateListScreen: ActivityIndicator centered
- WorkoutLogScreen: inline ActivityIndicator for saved logs section
- SessionDetailScreen: ActivityIndicator centered
- SessionFormScreen: ActivityIndicator centered (when editing)
- ClientFormScreen: ActivityIndicator centered (when editing)
- ExerciseFormScreen: ActivityIndicator centered (when editing)

**Empty states (partial coverage):**
- ClientListScreen: "No clients yet" + "Add your first client" button (GOOD)
- ClientListScreen: "No results" for search (GOOD)
- ExerciseListScreen: "No exercises yet" + role-aware message (GOOD)
- MySessionsScreen: "No sessions yet" + helpful message (GOOD)
- MyProgressScreen: "No measurements yet" + helpful message (GOOD)
- MyWorkoutLogScreen: "No completed workouts" + helpful message (GOOD)
- TemplateListScreen: "No templates yet" + "Create Template" button (GOOD)
- ConversationListScreen: "No conversations yet" (MINIMAL - no CTA)
- ChatScreen: "Start a conversation" (MINIMAL - no guidance)
- DashboardScreen: "No sessions scheduled today" / "No recent activity" (GOOD inline)

**Error states (inconsistent):**
- DashboardScreen: error text + error detail + retry button (BEST pattern)
- ClientListScreen: error text + retry button (GOOD)
- TemplateListScreen: error text + retry button (GOOD)
- ClientDetailScreen: error text only, NO retry button (GAP)
- CalendarScreen: error text only, NO retry button (GAP)
- ExerciseListScreen: error text only, NO retry button (GAP)
- MySessionsScreen: error text only, NO retry button (GAP)
- MyProgressScreen: error text only, NO retry button (GAP)
- MyWorkoutLogScreen: error text only, NO retry button (GAP)
- SessionDetailScreen: error text only, NO retry button (GAP)
- ConversationListScreen: NO error handling at all (GAP)
- ChatScreen: NO error handling at all (GAP)
- NotificationSettingsScreen: NO error handling (GAP)

### Specific Gaps to Fix

**1. Inconsistent error states (12 screens need work):**
- 9 screens show error text but no retry button
- 3 screens have no error handling at all
- Best existing pattern: DashboardScreen (error text + detail + retry)

**2. Missing empty states (3 screens):**
- ConversationListScreen: has empty text but no helpful CTA
- ChatScreen: has empty text but no guidance
- CalendarScreen: says "No sessions scheduled" but no CTA to create one

**3. Inline styling inconsistencies:**
- Shadow values differ: `shadowOpacity: 0.05` (Dashboard stat cards) vs `0.03` (session rows) vs `0.08` (chart cards) vs `0.3` (FABs) vs `0.27` (template FAB)
- Border radius differs: 8, 10, 12 used for cards; should standardize
- FAB shadow differs between CalendarScreen and ClientListScreen
- Some screens use `styles.centered` with `backgroundColor`, others without
- LoginScreen uses hardcoded `fontSize: 32` instead of theme's `xxl: 28`
- Some hardcoded colors: `#DCFCE7`, `#F1F5F9`, `#EFF6FF`, `rgba(...)` values not in theme
- Text character `>` used as chevron (ClientDetailScreen, ExerciseListScreen) -- inconsistent
- Tab icons use emoji strings, which render differently across devices

**4. No network connectivity detection:**
- API errors show generic messages
- No differentiation between "server error" vs "you're offline"
- No global network status banner

**5. No form validation (beyond basic `if (!field.trim())`):**
- ClientFormScreen: only validates first/last name non-empty via Alert
- MeasurementFormScreen: only validates date non-empty via Alert
- SessionFormScreen: validates client selected, date non-empty, duration valid via Alert
- ExerciseFormScreen: validates name non-empty via Alert
- NO inline error messages on any form field
- NO email format validation
- NO date format validation

**6. No client onboarding flow:**
- New client logs in and sees MySessions tab immediately
- No explanation of what tabs do or what to expect

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| react-native | 0.81.5 | UI framework | Installed |
| @tanstack/react-query | ^5.90.20 | Data fetching/caching | Installed |
| @react-navigation/native | ^7.1.28 | Navigation | Installed |
| @react-navigation/bottom-tabs | ^7.12.0 | Tab navigation | Installed |
| @react-navigation/native-stack | ^7.12.0 | Stack navigation | Installed |
| react-native-safe-area-context | ~5.6.0 | Safe area handling | Installed |
| @react-native-async-storage/async-storage | 2.2.0 | Persistent storage | Installed |

### New Dependencies Needed
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @react-native-community/netinfo | ~12.0 | Network connectivity detection | Detect offline state, show appropriate errors |

### NOT Needed (Don't Add)
| Library | Why Not |
|---------|---------|
| react-native-paper / NativeBase / Gluestack | App already has working custom components; adding a UI lib mid-project would require restyling everything |
| react-hook-form / formik / yup | Overkill for 4 simple forms; hand-written validation is sufficient for this scope |
| react-native-onboarding-swiper | Simple 3-slide onboarding can be built with FlatList + pagingEnabled; no dependency needed |
| react-native-toast-message | Alert.alert is already used consistently; a toast library adds complexity without enough benefit for this app |
| react-error-boundary | Useful for web React but less critical in React Native where crashes are handled differently; a simple ErrorBoundary class component is ~15 lines |

**Installation:**
```bash
cd mobile && npx expo install @react-native-community/netinfo
```

## Architecture Patterns

### Recommended Component Structure
```
mobile/src/
  components/
    ScreenContainer.tsx    # NEW: wraps loading/error/content pattern
    EmptyState.tsx         # NEW: reusable empty state with icon + message + optional CTA
    ErrorState.tsx         # NEW: reusable error with message + retry button
    LoadingState.tsx       # NEW: centered ActivityIndicator
    FormField.tsx          # NEW: label + input + error message wrapper
    NetworkBanner.tsx      # NEW: offline banner at top of app
    OnboardingScreen.tsx   # NEW: paginated onboarding swiper
    ExercisePicker.tsx     # EXISTS
    SetDetailEditor.tsx    # EXISTS
    RestTimer.tsx          # EXISTS
    LogoutButton.tsx       # EXISTS
    UnreadBadge.tsx        # EXISTS
    YouTubePlayer.tsx      # EXISTS
  theme.ts                 # EXISTS - extend with shadows, borderRadius, fontWeight constants
```

### Pattern 1: ScreenContainer Component
**What:** A wrapper that handles the loading/error/content lifecycle consistently
**When to use:** Every screen that fetches data

```typescript
// mobile/src/components/ScreenContainer.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface ScreenContainerProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function ScreenContainer({
  isLoading,
  isError,
  error,
  onRetry,
  children,
}: ScreenContainerProps) {
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={error?.message} onRetry={onRetry} />;
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
```

### Pattern 2: EmptyState Component
**What:** Standardized empty state with consistent styling
**When to use:** Every list/data screen when data array is empty

```typescript
// mobile/src/components/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

### Pattern 3: FormField with Inline Validation
**What:** A wrapper around TextInput that shows label + inline error
**When to use:** All form screens

```typescript
// mobile/src/components/FormField.tsx
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardType;
  // ... other TextInput props
}
```

The error message renders below the input with `colors.danger` and the input border turns red when `error` is truthy.

### Pattern 4: Network-Aware Error Handling
**What:** Detect offline state and show appropriate messages
**Implementation approach:**

```typescript
// In App.tsx or a new NetworkProvider
import NetInfo from '@react-native-community/netinfo';

// Option A: Global banner that appears when offline
// Option B: QueryClient configured to check network before retrying

// Configure QueryClient to be network-aware:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (error.message.includes('Network request failed')) return false;
        return failureCount < 2;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error logging/reporting
      console.error('Query error:', error);
    },
  }),
});
```

### Pattern 5: Client Onboarding Flow
**What:** A 3-4 screen swipe-through for first-time clients
**When to use:** When a client logs in and has never dismissed the onboarding
**Implementation:**

```typescript
// Track onboarding completion in AsyncStorage
const ONBOARDING_KEY = 'pt_onboarding_complete';

// In the client tab navigator, check AsyncStorage
// If not complete, show OnboardingScreen before tabs
// OnboardingScreen is a FlatList with pagingEnabled + horizontal
// Each page: illustration area + title + subtitle
// Last page has "Get Started" button that sets flag + navigates to tabs
```

Pages:
1. "Welcome to PT Tracker" - explain the app purpose
2. "Your Sessions" - explain how to view upcoming sessions
3. "Track Progress" - explain measurements, photos, workout logs
4. "Stay Connected" - explain messaging and notifications

### Anti-Patterns to Avoid
- **Adding a UI library at this stage:** The app has 27 screens with consistent custom styling. Introducing React Native Paper or similar would require restyling everything.
- **Over-engineering form validation:** These are 4 simple forms. React Hook Form + Yup is overkill. Simple state-based validation with inline error messages is sufficient.
- **Using Alert.alert for validation errors:** The current pattern uses Alert for validation, which interrupts the user. Switch to inline field errors instead.
- **Creating a custom design system package:** This is a single app, not a component library. Keep components in `src/components/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Network connectivity detection | Custom fetch wrapper with timeout | @react-native-community/netinfo | Handles all edge cases: WiFi without internet, cellular data limits, airplane mode transitions |
| Loading spinner | Different ActivityIndicator configs per screen | Shared LoadingState component | Already building this; just standardize |
| Error display with retry | Inline error Text + retry TouchableOpacity per screen | Shared ErrorState component | 12 screens have this same pattern duplicated |
| Empty state display | Custom empty views per screen | Shared EmptyState component | 10+ screens have nearly identical empty states |
| Onboarding swiper | react-native-onboarding-swiper | FlatList with pagingEnabled + horizontal | Only 3-4 pages needed; FlatList already handles pagination natively |

## Common Pitfalls

### Pitfall 1: Forgetting to Handle the "isRefetching" State
**What goes wrong:** When pull-to-refresh fires, the screen shows full-page loading spinner instead of just the RefreshControl
**Why it happens:** Using `isLoading` for both initial load and refetch
**How to avoid:** ScreenContainer only shows full-page loading on initial `isLoading` (which is `true` only when there's no cached data). `isRefetching` is handled by RefreshControl independently.
**Warning signs:** Screen flashes to loading state when pulling to refresh

### Pitfall 2: Inline Validation Running on Mount
**What goes wrong:** Error messages appear before the user has typed anything
**Why it happens:** Running validation on every render instead of on blur/submit
**How to avoid:** Track "touched" state per field. Only show errors for fields that have been touched (onBlur) or after first submit attempt.
**Warning signs:** Red error borders visible on empty form on first render

### Pitfall 3: Network Banner Flickering
**What goes wrong:** Network status banner briefly appears during normal network transitions
**Why it happens:** NetInfo fires events during network transitions (e.g., switching from WiFi to cellular)
**How to avoid:** Debounce the network status change by 1-2 seconds before showing the banner. Only show if offline for more than 1 second.
**Warning signs:** Brief red banner flashes when switching networks

### Pitfall 4: Hardcoded Colors Not in Theme
**What goes wrong:** Inconsistent colors that don't update when theme changes
**Why it happens:** Using hex values directly in styles instead of theme constants
**How to avoid:** Audit for all hardcoded color values: `#DCFCE7`, `#F1F5F9`, `#EFF6FF`, `rgba(...)` in styles. Add them to theme.ts as named colors (e.g., `successLight`, `backgroundAlt`, `primaryLight`).
**Warning signs:** grep for `#` and `rgba` in style objects

### Pitfall 5: Shadow Inconsistency Across Platforms
**What goes wrong:** Shadows look different on Android vs iOS
**Why it happens:** iOS uses `shadow*` properties, Android uses `elevation`. Values aren't standardized.
**How to avoid:** Create shadow presets in theme.ts: `shadows.sm`, `shadows.md`, `shadows.lg` that include both iOS and Android values.
**Warning signs:** Cards look flat on Android but have shadows on iOS, or vice versa

### Pitfall 6: Onboarding Shown to Existing Users After Update
**What goes wrong:** Users who have been using the app see onboarding after an update
**Why it happens:** AsyncStorage key doesn't exist for existing users
**How to avoid:** Only show onboarding to users whose account creation date is AFTER the onboarding feature was deployed, OR check if user has any existing data (sessions, etc.).
**Warning signs:** Existing clients complain about being asked to onboard again

## Code Examples

### Extended Theme with Shadows and Additional Colors
```typescript
// mobile/src/theme.ts
export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#EFF6FF",     // NEW: for selected states
  secondary: "#64748B",
  success: "#16A34A",
  successLight: "#DCFCE7",     // NEW: for active status chips
  warning: "#F59E0B",
  danger: "#DC2626",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  disabled: "#CBD5E1",
  backgroundAlt: "#F1F5F9",   // NEW: for inactive status chips
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
};
```

### ErrorState Component
```typescript
// mobile/src/components/ErrorState.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface ErrorStateProps {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, detail, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message || 'Something went wrong'}</Text>
      {detail && <Text style={styles.detail}>{detail}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  detail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});
```

### FormField with Inline Validation
```typescript
// mobile/src/components/FormField.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.disabled}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
```

### Network Status Hook
```typescript
// mobile/src/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Debounce to avoid flickering during network transitions
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, isOffline: isConnected === false };
}
```

### Simple Onboarding with FlatList
```typescript
// mobile/src/components/OnboardingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize } from '../theme';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'pt_onboarding_complete';

const pages = [
  { title: 'Welcome to PT Tracker', subtitle: 'Your personal training companion. Track sessions, monitor progress, and stay connected with your trainer.' },
  { title: 'Your Sessions', subtitle: 'View upcoming and past sessions. Get reminders before each session so you never miss one.' },
  { title: 'Track Progress', subtitle: 'See your measurements, workout logs, and progress photos all in one place.' },
  { title: 'Stay Connected', subtitle: 'Message your trainer directly and receive notifications about new sessions and measurements.' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  // ... render FlatList with pagingEnabled, horizontal, onMomentumScrollEnd
}
```

## Screen-by-Screen Audit Results

### Screens That Need Work (Plan 02-01: Design System)

| Screen | Issues |
|--------|--------|
| LoginScreen | `fontSize: 32` hardcoded (should use `xxl`); client role button text color is `colors.surface` even on white background variant |
| ClientListScreen | `#DCFCE7` and `#F1F5F9` hardcoded; inconsistent with theme |
| ClientDetailScreen | Uses `>` text character as chevron |
| CalendarScreen | FAB shadow values differ from other FABs |
| SessionFormScreen | Label style uses `textTransform: 'uppercase'` + `letterSpacing` -- unique among all forms |
| ExerciseFormScreen | Label color is `textSecondary` while ClientForm uses `text` -- inconsistent |
| All FABs | 4 different shadow configurations across screens |
| All cards | Mix of borderRadius 8, 10, 12 |
| Tab icons | Emoji strings render inconsistently across devices |

### Screens That Need Work (Plan 02-02: Loading/Error/Empty States)

| Screen | Missing |
|--------|---------|
| ClientDetailScreen | Error state has no retry button |
| CalendarScreen | Error state has no retry button |
| ExerciseListScreen | Error state has no retry button |
| MySessionsScreen | Error state has no retry button |
| MyProgressScreen | Error state has no retry button |
| MyWorkoutLogScreen | Error state has no retry button |
| SessionDetailScreen | Error state has no retry button |
| ConversationListScreen | No error handling at all |
| ChatScreen | No error handling at all |
| NotificationSettingsScreen | No error handling |
| All screens | No network-aware error messages |
| ConversationListScreen | Empty state has no helpful CTA |
| ChatScreen | Empty state has no guidance |

### Screens That Need Work (Plan 02-02: Form Validation)

| Screen | Current Validation | Needs |
|--------|-------------------|-------|
| ClientFormScreen | Alert for empty first/last name | Inline errors on all fields; email format validation |
| MeasurementFormScreen | Alert for empty date | Inline errors; date format validation; numeric validation |
| SessionFormScreen | Alert for missing client, empty date, invalid duration | Inline errors on all fields |
| ExerciseFormScreen | Alert for empty name | Inline errors; URL format validation for video URL |
| LoginScreen | Returns early if empty, shows error text | Already has inline error display -- good pattern to replicate |

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Alert.alert for form errors | Inline field-level error messages | Better UX, user can see which field has the problem |
| Per-screen error/loading UI | Shared components (ErrorState, LoadingState) | Consistency + less code duplication |
| No network detection | NetInfo + offline banner | Users understand why things fail |
| Full-page loading every refetch | isLoading for initial, RefreshControl for refetch | No UI flash on pull-to-refresh |

## Open Questions

1. **Tab icons: Emoji vs custom icon component?**
   - What we know: Current app uses emoji strings for tab icons, which render differently across devices/OS versions
   - What's unclear: Whether to use @expo/vector-icons (already available in Expo) or keep emoji
   - Recommendation: Use @expo/vector-icons (Ionicons) since it's already bundled with Expo SDK 54 and renders consistently. No new dependency needed.

2. **Onboarding: show to existing users after app update?**
   - What we know: App is pre-release, so all current users are testers
   - Recommendation: Check AsyncStorage for onboarding flag. If flag exists, skip. If not, show onboarding for client role only. Since app is pre-release, this is fine. No need for complex date-based logic.

3. **Form validation scope: how deep?**
   - What we know: 4 form screens with simple fields
   - Recommendation: Validate required fields (non-empty), email format (basic regex), date format (YYYY-MM-DD), and numeric fields (valid numbers). Do NOT add complex validation like phone number formatting -- keep it simple.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all 27 screen files, theme.ts, api.ts, AuthContext.tsx, App.tsx
- All style values and patterns verified by reading actual source code

### Secondary (MEDIUM confidence)
- [@react-native-community/netinfo NPM](https://www.npmjs.com/package/@react-native-community/netinfo) - Network detection library
- [TkDodo's React Query Error Handling](https://tkdodo.eu/blog/react-query-error-handling) - QueryCache error patterns
- [react-native-onboarding-swiper](https://www.npmjs.com/package/react-native-onboarding-swiper) - Evaluated and decided against (FlatList sufficient)

### Tertiary (LOW confidence)
- [UI best practices for loading, error, and empty states](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - General patterns
- [React Native email validation guide 2026](https://mailtrap.io/blog/react-native-email-validation/) - Email regex patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified by reading package.json and all source files
- Architecture patterns: HIGH - patterns derived from actual codebase analysis
- Pitfalls: HIGH - identified from actual inconsistencies found in code audit
- Codebase gaps: HIGH - every screen file was read and audited

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, patterns won't change)
