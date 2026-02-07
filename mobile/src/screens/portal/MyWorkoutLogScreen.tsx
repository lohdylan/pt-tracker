import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSessions } from "../../hooks/useSessions";
import { useWorkoutLogs } from "../../hooks/useWorkoutLogs";
import { useAuth } from "../../AuthContext";
import { colors, spacing, fontSize, borderRadius } from "../../theme";
import ErrorState from "../../components/ErrorState";
import type { Session, WorkoutLog } from "../../types";

type StackParams = {
  MyWorkoutLog: undefined;
  ClientSessionDetail: { sessionId: number };
};

type Nav = NativeStackNavigationProp<StackParams, "MyWorkoutLog">;

function SessionLogCard({ session }: { session: Session }) {
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState(false);
  const { data: logs, isLoading } = useWorkoutLogs(session.id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardDate}>{formatDate(session.scheduled_at)}</Text>
          <Text style={styles.cardDuration}>{session.duration_min} min</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? "−" : "+"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : !logs || logs.length === 0 ? (
            <Text style={styles.noLogsText}>No exercises logged</Text>
          ) : (
            logs.map((log: WorkoutLog) => (
              <View key={log.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{log.exercise_name}</Text>
                <Text style={styles.exerciseDetail}>
                  {log.sets} x {log.reps}
                  {log.weight != null ? ` @ ${log.weight} lbs` : ""}
                </Text>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate("ClientSessionDetail", { sessionId: session.id })}
          >
            <Text style={styles.viewDetailsText}>View Session Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function MyWorkoutLogScreen() {
  const { user } = useAuth();
  const { data: sessions, isLoading, isError, refetch, isRefetching } = useSessions({
    client_id: user?.clientId,
  });

  const completedSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => s.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );
  }, [sessions]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load workout logs"
        detail={(sessions as any)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={completedSessions}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <SessionLogCard session={item} />}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No completed workouts</Text>
          <Text style={styles.emptySubtitle}>
            Completed sessions with logged exercises will appear here.
          </Text>
        </View>
      }
      contentContainerStyle={completedSessions.length === 0 ? styles.emptyContainer : { padding: spacing.md }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyContainer: { flexGrow: 1 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  cardHeaderLeft: { flex: 1 },
  cardDate: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  cardDuration: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  expandIcon: { fontSize: fontSize.xl, color: colors.textSecondary, fontWeight: "300" },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  noLogsText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.sm },
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
  viewDetailsButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  viewDetailsText: { fontSize: fontSize.md, color: colors.primary, fontWeight: "600" },
});
