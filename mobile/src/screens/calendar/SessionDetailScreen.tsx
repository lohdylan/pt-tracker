import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession, useUpdateSession, useDeleteSession } from '../../hooks/useSessions';
import { useWorkoutLogs } from '../../hooks/useWorkoutLogs';
import { colors, spacing, fontSize } from '../../theme';
import type { WorkoutLog, Session } from '../../types';

type RootStackParamList = {
  Calendar: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  WorkoutLog: { sessionId: number };
};

type ScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.warning,
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SessionDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { sessionId } = route.params;

  const { data: session, isLoading, error } = useSession(sessionId);
  const { data: workoutLogs, isLoading: logsLoading } = useWorkoutLogs(sessionId);
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!session) return;
      Alert.alert(
        'Change Status',
        `Mark this session as "${STATUS_LABELS[newStatus] || newStatus}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              updateSession.mutate({
                id: sessionId,
                client_id: session.client_id,
                scheduled_at: session.scheduled_at,
                duration_min: session.duration_min,
                status: newStatus,
                notes: session.notes,
              } as Partial<Session> & { id: number });
            },
          },
        ]
      );
    },
    [sessionId, session, updateSession]
  );

  const handleEdit = useCallback(() => {
    navigation.navigate('SessionForm', { sessionId });
  }, [navigation, sessionId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSession.mutate(sessionId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ]
    );
  }, [sessionId, deleteSession, navigation]);

  const handleLogWorkout = useCallback(() => {
    navigation.navigate('WorkoutLog', { sessionId });
  }, [navigation, sessionId]);

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

  const currentStatus = session.status || 'scheduled';
  const statusColor = STATUS_COLORS[currentStatus] || colors.secondary;
  const clientName = [session.first_name, session.last_name].filter(Boolean).join(' ') || 'Unknown Client';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.clientName}>{clientName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>
            {STATUS_LABELS[currentStatus] || currentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(session.scheduled_at)}
          </Text>
        </View>
        <View style={styles.divider} />
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
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusActions}>
          {currentStatus !== 'completed' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: colors.success }]}
              onPress={() => handleStatusChange('completed')}
            >
              <Text style={styles.statusButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
          {currentStatus !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: colors.danger }]}
              onPress={() => handleStatusChange('cancelled')}
            >
              <Text style={styles.statusButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {currentStatus !== 'no_show' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: colors.warning }]}
              onPress={() => handleStatusChange('no_show')}
            >
              <Text style={styles.statusButtonText}>No Show</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Log</Text>
          <TouchableOpacity onPress={handleLogWorkout}>
            <Text style={styles.linkText}>Log Workout</Text>
          </TouchableOpacity>
        </View>

        {logsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : !workoutLogs || workoutLogs.length === 0 ? (
          <Text style={styles.emptyText}>No exercises logged yet</Text>
        ) : (
          workoutLogs.map((log: WorkoutLog) => (
            <View key={log.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{log.exercise_name}</Text>
              <Text style={styles.exerciseDetail}>
                {log.sets} x {log.reps}
                {log.weight != null ? ` @ ${log.weight} lbs` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { fontSize: fontSize.md, color: colors.danger },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  clientName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: 16 },
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.surface },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  detailRow: { paddingVertical: spacing.sm },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '500' },
  detailValue: { fontSize: fontSize.md, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  linkText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600', marginBottom: spacing.sm },
  statusActions: { flexDirection: 'row', gap: spacing.sm },
  statusButton: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: 8, alignItems: 'center' },
  statusButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.surface },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  exerciseName: { fontSize: fontSize.md, fontWeight: '500', color: colors.text, flex: 1 },
  exerciseDetail: { fontSize: fontSize.sm, color: colors.textSecondary },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  editButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center' },
  editButtonText: { fontSize: fontSize.md, fontWeight: '600', color: colors.surface },
  deleteButton: { backgroundColor: colors.surface, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
  deleteButtonText: { fontSize: fontSize.md, fontWeight: '600', color: colors.danger },
});

export default SessionDetailScreen;
