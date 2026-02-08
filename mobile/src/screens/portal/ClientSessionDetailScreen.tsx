import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSession } from "../../hooks/useSessions";
import { useWorkoutLogs } from "../../hooks/useWorkoutLogs";
import { colors, spacing, fontSize } from "../../theme";
import type { WorkoutLog } from "../../types";

type ParamList = {
  ClientSessionDetail: { sessionId: number };
};

type Route = RouteProp<ParamList, "ClientSessionDetail">;

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.warning,
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClientSessionDetailScreen() {
  const route = useRoute<Route>();
  const { sessionId } = route.params;
  const { data: session, isLoading, error } = useSession(sessionId);
  const { data: workoutLogs, isLoading: logsLoading } = useWorkoutLogs(sessionId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load session</Text>
      </View>
    );
  }

  const currentStatus = session.status || "scheduled";
  const statusColor = STATUS_COLORS[currentStatus] || colors.secondary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDateTime(session.scheduled_at)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>
            {STATUS_LABELS[currentStatus] || currentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{session.duration_min} minutes</Text>
        </View>
        {session.notes ? (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{session.notes}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Workout Log</Text>
        {logsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : !workoutLogs || workoutLogs.length === 0 ? (
          <Text style={styles.emptyText}>No exercises logged for this session</Text>
        ) : (
          workoutLogs.map((log: WorkoutLog) => (
            <View key={log.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{log.exercise_name}</Text>
              <Text style={styles.exerciseDetail}>
                {log.sets} x {log.reps}
                {log.weight != null ? ` @ ${log.weight} lbs` : ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: fontSize.md, color: colors.danger },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  dateText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: 16 },
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.surface },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { paddingVertical: spacing.sm },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: "500" },
  detailValue: { fontSize: fontSize.md, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.md },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: { fontSize: fontSize.md, fontWeight: "500", color: colors.text, flex: 1 },
  exerciseDetail: { fontSize: fontSize.sm, color: colors.textSecondary },
});
