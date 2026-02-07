import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { useDashboard } from "../../hooks/useDashboard";
import { colors, spacing, fontSize } from "../../theme";
import type { DashboardTodaySession, DashboardRecentActivity } from "../../types";

const SCREEN_WIDTH = Dimensions.get("window").width;

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.warning,
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();
  const navigation = useNavigation<any>();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
        <Text style={styles.errorDetail}>{(error as Error).message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = data!.stats;
  const chartData = {
    labels: DAY_LABELS,
    datasets: [{ data: data!.weekly_trend.map((d) => d.count) }],
  };
  // Ensure chart has at least a small range so bars render correctly
  const maxCount = Math.max(...chartData.datasets[0].data, 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Active Clients" value={stats.active_clients} color={colors.primary} />
        <StatCard label="Today" value={stats.today_sessions} color={colors.success} />
        <StatCard label="This Week" value={stats.week_sessions} color={colors.warning} />
        <StatCard label="Completion" value={`${stats.completion_rate}%`} color={colors.primaryDark} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("SessionForm")}
        >
          <Text style={styles.quickBtnText}>+ New Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.success }]}
          onPress={() => navigation.navigate("ClientForm")}
        >
          <Text style={styles.quickBtnText}>+ New Client</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {data!.today_sessions.length === 0 ? (
          <Text style={styles.emptyText}>No sessions scheduled today</Text>
        ) : (
          data!.today_sessions.map((s) => (
            <TodaySessionRow key={s.id} session={s} onPress={() => navigation.navigate("SessionDetail", { sessionId: s.id })} />
          ))
        )}
      </View>

      {/* Weekly Trend Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - spacing.md * 2}
          height={180}
          fromZero
          yAxisLabel=""
          yAxisSuffix=""
          segments={Math.min(maxCount, 5)}
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => colors.textSecondary,
            barPercentage: 0.6,
            propsForBackgroundLines: { stroke: colors.border },
          }}
          style={styles.chart}
        />
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { marginBottom: spacing.xl }]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {data!.recent_activity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          data!.recent_activity.map((a, i) => <ActivityRow key={i} activity={a} />)
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TodaySessionRow({ session, onPress }: { session: DashboardTodaySession; onPress: () => void }) {
  const time = new Date(session.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <TouchableOpacity style={styles.sessionRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sessionClient}>{session.first_name} {session.last_name}</Text>
        <Text style={styles.sessionTime}>{time} · {session.duration_min} min</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[session.status] || colors.secondary }]}>
        <Text style={styles.statusText}>{session.status.replace("_", " ")}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ActivityRow({ activity }: { activity: DashboardRecentActivity }) {
  const icons: Record<string, string> = {
    session_completed: "✓",
    new_client: "★",
    measurement_recorded: "◉",
  };
  const iconColors: Record<string, string> = {
    session_completed: colors.success,
    new_client: colors.primary,
    measurement_recorded: colors.warning,
  };
  const timeAgo = formatTimeAgo(activity.timestamp);
  return (
    <View style={styles.activityRow}>
      <Text style={[styles.activityIcon, { color: iconColors[activity.type] }]}>
        {icons[activity.type]}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityDesc}>{activity.description}</Text>
        <Text style={styles.activityTime}>{timeAgo}</Text>
      </View>
    </View>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  errorText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.danger, marginBottom: spacing.xs },
  errorDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.md, gap: spacing.sm },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  quickActions: { flexDirection: "row", paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  quickBtnText: { color: "#fff", fontWeight: "600", fontSize: fontSize.md },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, fontStyle: "italic" },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sessionClient: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  sessionTime: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  chart: { borderRadius: 12, alignSelf: "center" },
  activityRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityIcon: { fontSize: 16, marginRight: spacing.sm, marginTop: 2, fontWeight: "700" },
  activityDesc: { fontSize: fontSize.md, color: colors.text },
  activityTime: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
