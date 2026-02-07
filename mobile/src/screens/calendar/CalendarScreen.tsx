import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSessions } from '../../hooks/useSessions';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../theme';
import ErrorState from '../../components/ErrorState';
import type { Session } from '../../types';

type RootStackParamList = {
  Calendar: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  WorkoutLog: { sessionId: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.warning,
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthRange(dateStr: string): { from: string; to: string } {
  const [year, month] = dateStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0);
  return {
    from: `${year}-${String(month).padStart(2, '0')}-01`,
    to: `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`,
  };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${ampm}`;
}

function CalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [visibleMonth, setVisibleMonth] = useState<string>(today);

  const { from, to } = useMemo(() => getMonthRange(visibleMonth), [visibleMonth]);
  const { data: sessions, isLoading, isError, error, refetch } = useSessions({ from, to });

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (sessions) {
      for (const session of sessions) {
        const dateKey = session.scheduled_at?.slice(0, 10);
        if (!dateKey) continue;
        if (!marks[dateKey]) marks[dateKey] = { dots: [], marked: true };
        const statusColor = STATUS_COLORS[session.status] || colors.secondary;
        const alreadyHasColor = marks[dateKey].dots.some((d: any) => d.color === statusColor);
        if (!alreadyHasColor) {
          marks[dateKey].dots.push({ color: statusColor, key: `${session.id}` });
        }
      }
    }
    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: colors.primary };
    } else {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary, dots: [] };
    }
    return marks;
  }, [sessions, selectedDate]);

  const selectedDaySessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => s.scheduled_at?.slice(0, 10) === selectedDate)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [sessions, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => setSelectedDate(day.dateString), []);
  const handleMonthChange = useCallback((month: DateData) => setVisibleMonth(month.dateString), []);

  return (
    <View style={styles.container}>
      <Calendar
        current={visibleMonth}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.surface,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.disabled,
          dotColor: colors.primary,
          selectedDotColor: colors.surface,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textDayFontSize: fontSize.md,
          textMonthFontSize: fontSize.lg,
          textDayHeaderFontSize: fontSize.sm,
        }}
      />

      <View style={styles.agendaHeader}>
        <Text style={styles.agendaTitle}>{selectedDate === today ? 'Today' : selectedDate}</Text>
        <Text style={styles.sessionCount}>
          {selectedDaySessions.length} session{selectedDaySessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : isError ? (
        <ErrorState message="Failed to load sessions" detail={(error as Error)?.message} onRetry={refetch} />
      ) : selectedDaySessions.length === 0 ? (
        <View style={styles.centered}><Text style={styles.emptyText}>No sessions scheduled</Text></View>
      ) : (
        <FlatList
          data={selectedDaySessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] || colors.secondary;
            const clientName = [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Client';
            return (
              <TouchableOpacity
                style={styles.sessionRow}
                onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
              >
                <View style={styles.sessionTime}>
                  <Text style={styles.timeText}>{formatTime(item.scheduled_at)}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
                  <Text style={styles.durationText}>{item.duration_min} min</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SessionForm', { date: selectedDate })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  agendaTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  sessionCount: { fontSize: fontSize.sm, color: colors.textSecondary },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 100 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  sessionTime: { width: 70, marginRight: spacing.sm },
  timeText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  sessionInfo: { flex: 1, marginRight: spacing.sm },
  clientName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 2 },
  durationText: { fontSize: fontSize.sm, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.xl },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.surface, textTransform: 'capitalize' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
  errorText: { fontSize: fontSize.md, color: colors.danger },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
  fabText: { fontSize: 28, fontWeight: '400', color: colors.surface, lineHeight: 30 },
});

export default CalendarScreen;
