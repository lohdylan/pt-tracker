import React, { useCallback } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useSendTestNotification,
} from "../../hooks/useNotifications";
import { colors, spacing, fontSize, borderRadius } from "../../theme";
import ErrorState from "../../components/ErrorState";

const REMINDER_OPTIONS = [15, 30, 60, 120];

export default function NotificationSettingsScreen() {
  const { data: prefs, isLoading, isError, error, refetch } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const testNotif = useSendTestNotification();

  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      updatePrefs.mutate({ [key]: value });
    },
    [updatePrefs]
  );

  const handleReminderChange = useCallback(
    (minutes: number) => {
      updatePrefs.mutate({ reminder_minutes_before: minutes });
    },
    [updatePrefs]
  );

  const handleTestNotification = useCallback(() => {
    testNotif.mutate(undefined, {
      onSuccess: () => Alert.alert("Sent", "Test notification sent!"),
      onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to send"),
    });
  }, [testNotif]);

  if (isLoading || (!prefs && !isError)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !prefs) {
    return <ErrorState message="Failed to load notification settings" detail={(error as Error)?.message} onRetry={refetch} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Notification Settings</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Session Reminders</Text>
            <Text style={styles.rowSubtitle}>Get reminded before upcoming sessions</Text>
          </View>
          <Switch
            value={prefs.session_reminders}
            onValueChange={(v) => handleToggle("session_reminders", v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {prefs.session_reminders && (
          <View style={styles.reminderOptions}>
            <Text style={styles.reminderLabel}>Remind me</Text>
            <View style={styles.reminderRow}>
              {REMINDER_OPTIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.reminderChip,
                    prefs.reminder_minutes_before === min && styles.reminderChipActive,
                  ]}
                  onPress={() => handleReminderChange(min)}
                >
                  <Text
                    style={[
                      styles.reminderChipText,
                      prefs.reminder_minutes_before === min && styles.reminderChipTextActive,
                    ]}
                  >
                    {min >= 60 ? `${min / 60}h` : `${min}m`} before
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Workout Logged</Text>
            <Text style={styles.rowSubtitle}>When a workout is logged for your session</Text>
          </View>
          <Switch
            value={prefs.workout_logged}
            onValueChange={(v) => handleToggle("workout_logged", v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Measurement Recorded</Text>
            <Text style={styles.rowSubtitle}>When new measurements are recorded</Text>
          </View>
          <Switch
            value={prefs.measurement_recorded}
            onValueChange={(v) => handleToggle("measurement_recorded", v)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  heading: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, marginRight: spacing.md },
  rowTitle: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  rowSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  reminderOptions: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  reminderLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  reminderRow: { flexDirection: "row", gap: spacing.xs },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  reminderChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  reminderChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  reminderChipTextActive: { color: "#fff" },
  testButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  testButtonText: { fontSize: fontSize.md, fontWeight: "600", color: colors.primary },
});
