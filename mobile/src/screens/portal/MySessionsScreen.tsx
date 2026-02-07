import React, { useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSessions } from "../../hooks/useSessions";
import { useAuth } from "../../AuthContext";
import { colors, spacing, fontSize, borderRadius } from "../../theme";
import ErrorState from "../../components/ErrorState";
import type { Session } from "../../types";

type StackParams = {
  MySessions: undefined;
  ClientSessionDetail: { sessionId: number };
};

type Nav = NativeStackNavigationProp<StackParams, "MySessions">;

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MySessionsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { data: sessions, isLoading, isError, refetch, isRefetching } = useSessions({
    client_id: user?.clientId,
  });

  const sections = useMemo(() => {
    if (!sessions) return [];
    const now = new Date();
    const upcoming: Session[] = [];
    const past: Session[] = [];

    for (const s of sessions) {
      if (new Date(s.scheduled_at) > now && s.status === "scheduled") {
        upcoming.push(s);
      } else {
        past.push(s);
      }
    }

    // Upcoming sorted ascending, past sorted descending
    upcoming.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
    past.sort(
      (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );

    const result: { title: string; data: Session[] }[] = [];
    if (upcoming.length > 0) result.push({ title: "Upcoming", data: upcoming });
    if (past.length > 0) result.push({ title: "Past", data: past });
    return result;
  }, [sessions]);

  const renderItem = ({ item }: { item: Session }) => {
    const statusColor = STATUS_COLORS[item.status] || colors.secondary;
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("ClientSessionDetail", { sessionId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemDate}>{formatDate(item.scheduled_at)}</Text>
          <Text style={styles.itemDuration}>{item.duration_min} min</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        message="Failed to load sessions"
        detail={(sessions as any)?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Your trainer will schedule sessions for you.
          </Text>
        </View>
      }
      contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyContainer: { flexGrow: 1 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center" },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLeft: { flex: 1 },
  itemDate: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  itemDuration: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  statusText: { fontSize: 11, fontWeight: "600", color: colors.surface },
});
