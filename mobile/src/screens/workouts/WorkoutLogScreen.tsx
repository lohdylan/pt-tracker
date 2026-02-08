import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTemplates } from '../../hooks/useTemplates';
import {
  useWorkoutLogs,
  useBatchCreateWorkoutLogs,
  useDeleteWorkoutLog,
  useUpdateWorkoutLog,
  useReorderWorkoutLogs,
} from '../../hooks/useWorkoutLogs';
import ExercisePicker from '../../components/ExercisePicker';
import SetDetailEditor from '../../components/SetDetailEditor';
import RestTimer from '../../components/RestTimer';
import { colors, spacing, fontSize } from '../../theme';
import type { WorkoutTemplate, WorkoutLog, SetDetail } from '../../types';

type RouteParams = {
  WorkoutLog: { sessionId: number };
};

type ExerciseLogRow = {
  key: string;
  exercise_name: string;
  exercise_id: number | null;
  sets_detail: SetDetail[];
  notes: string;
};

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyRow(): ExerciseLogRow {
  return {
    key: generateKey(),
    exercise_name: '',
    exercise_id: null,
    sets_detail: [{ set_number: 1, reps: null, weight: null, completed: false }],
    notes: '',
  };
}

function WorkoutLogScreen() {
  const route = useRoute<NativeStackScreenProps<RouteParams, 'WorkoutLog'>['route']>();
  const { sessionId } = route.params;

  const [rows, setRows] = useState<ExerciseLogRow[]>([createEmptyRow()]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  const {
    data: existingLogs,
    isLoading: logsLoading,
    isError: logsError,
    error: logsErrorObj,
    refetch: refetchLogs,
  } = useWorkoutLogs(sessionId);

  const { data: templates, isLoading: templatesLoading } = useTemplates();

  const batchCreate = useBatchCreateWorkoutLogs(sessionId);
  const deleteLog = useDeleteWorkoutLog(sessionId);
  const updateLog = useUpdateWorkoutLog(sessionId);
  const reorderLogs = useReorderWorkoutLogs(sessionId);

  const updateRow = useCallback((key: string, updates: Partial<ExerciseLogRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...updates } : row)));
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        Alert.alert('Cannot Remove', 'You need at least one exercise row.');
        return prev;
      }
      return prev.filter((row) => row.key !== key);
    });
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const moveRow = useCallback((index: number, direction: 'up' | 'down') => {
    setRows((prev) => {
      const newRows = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newRows.length) return prev;
      [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
      return newRows;
    });
  }, []);

  const applyTemplate = useCallback((template: WorkoutTemplate) => {
    if (!template.exercises || template.exercises.length === 0) {
      Alert.alert('Empty Template', 'This template has no exercises.');
      return;
    }

    const newRows: ExerciseLogRow[] = template.exercises.map((ex) => ({
      key: generateKey(),
      exercise_name: ex.exercise_name ?? '',
      exercise_id: null,
      sets_detail: Array.from({ length: ex.sets || 1 }, (_, i) => ({
        set_number: i + 1,
        reps: ex.reps ?? null,
        weight: ex.weight ?? null,
        completed: false,
      })),
      notes: '',
    }));

    setRows((prev) => {
      const hasContent = prev.some((r) => r.exercise_name.trim());
      return hasContent ? [...prev, ...newRows] : newRows;
    });

    setTemplateModalVisible(false);
  }, []);

  const handleSaveAll = useCallback(async () => {
    const validRows = rows.filter((r) => r.exercise_name.trim().length > 0);
    if (validRows.length === 0) {
      Alert.alert('Validation Error', 'At least one exercise with a name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const logs = validRows.map((row, index) => ({
        exercise_name: row.exercise_name.trim(),
        exercise_id: row.exercise_id ?? undefined,
        sets: row.sets_detail.length,
        reps: row.sets_detail[0]?.reps ?? undefined,
        weight: row.sets_detail[0]?.weight ?? undefined,
        sort_order: index,
        sets_detail: row.sets_detail,
        notes: row.notes || undefined,
      }));
      await batchCreate.mutateAsync(logs);
      setRows([createEmptyRow()]);
      Alert.alert('Success', 'Workout logs saved.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save workout logs.');
    } finally {
      setIsSaving(false);
    }
  }, [rows, batchCreate]);

  const handleDeleteLog = useCallback(
    (log: WorkoutLog) => {
      Alert.alert('Delete Log', `Delete "${log.exercise_name}" log?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLog.mutate(log.id) },
      ]);
    },
    [deleteLog],
  );

  const handleEditLog = useCallback(
    (log: WorkoutLog) => {
      setEditingLogId(log.id);
    },
    [],
  );

  const handleSaveEdit = useCallback(
    async (log: WorkoutLog, exerciseName: string, setsDetail: SetDetail[], notes: string) => {
      try {
        await updateLog.mutateAsync({
          id: log.id,
          exercise_name: exerciseName,
          exercise_id: log.exercise_id,
          sets: setsDetail.length,
          reps: setsDetail[0]?.reps,
          weight: setsDetail[0]?.weight,
          sets_detail: setsDetail,
          notes: notes || null,
        });
        setEditingLogId(null);
      } catch (err) {
        Alert.alert('Error', 'Failed to update log.');
      }
    },
    [updateLog],
  );

  const handleMoveExistingLog = useCallback(
    (logId: number, direction: 'up' | 'down') => {
      if (!existingLogs) return;
      const idx = existingLogs.findIndex((l) => l.id === logId);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= existingLogs.length) return;
      const order = existingLogs.map((l, i) => {
        if (i === idx) return { id: l.id, sort_order: targetIdx };
        if (i === targetIdx) return { id: l.id, sort_order: idx };
        return { id: l.id, sort_order: i };
      });
      reorderLogs.mutate(order);
    },
    [existingLogs, reorderLogs],
  );

  const renderTemplateItem = useCallback(
    ({ item }: { item: WorkoutTemplate }) => {
      const exerciseCount = item.exercises?.length ?? 0;
      return (
        <TouchableOpacity
          style={styles.templateRow}
          onPress={() => applyTemplate(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.templateRowTitle}>{item.name}</Text>
          <Text style={styles.templateRowSubtitle}>
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </Text>
        </TouchableOpacity>
      );
    },
    [applyTemplate],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Apply Template Button */}
        <TouchableOpacity
          style={styles.applyTemplateButton}
          onPress={() => setTemplateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyTemplateButtonText}>Apply Template</Text>
        </TouchableOpacity>

        {/* Existing Saved Logs */}
        {logsLoading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading saved logs...</Text>
          </View>
        )}

        {logsError && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>
              {logsErrorObj instanceof Error ? logsErrorObj.message : 'Failed to load logs'}
            </Text>
            <TouchableOpacity onPress={() => refetchLogs()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {existingLogs && existingLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Logs</Text>
            {existingLogs.map((log: WorkoutLog, idx: number) => (
              <View key={log.id} style={styles.savedLogRow}>
                {editingLogId === log.id ? (
                  <EditableLog
                    log={log}
                    onSave={(name, sets, notes) => handleSaveEdit(log, name, sets, notes)}
                    onCancel={() => setEditingLogId(null)}
                  />
                ) : (
                  <>
                    <View style={styles.savedLogContent}>
                      <Text style={styles.savedLogName}>{log.exercise_name}</Text>
                      <Text style={styles.savedLogDetails}>
                        {log.sets_detail && log.sets_detail.length > 0
                          ? `${log.sets_detail.length} sets`
                          : [
                              log.sets != null ? `${log.sets} sets` : null,
                              log.reps != null ? `${log.reps} reps` : null,
                              log.weight != null ? `${log.weight} lbs` : null,
                            ].filter(Boolean).join(' / ')}
                      </Text>
                      {log.notes ? <Text style={styles.notesText}>{log.notes}</Text> : null}
                    </View>
                    <View style={styles.savedLogActions}>
                      <TouchableOpacity onPress={() => handleMoveExistingLog(log.id, 'up')} disabled={idx === 0}>
                        <Text style={[styles.moveText, idx === 0 && styles.moveDisabled]}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleMoveExistingLog(log.id, 'down')} disabled={idx === existingLogs.length - 1}>
                        <Text style={[styles.moveText, idx === existingLogs.length - 1 && styles.moveDisabled]}>▼</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEditLog(log)}>
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteLog(log)}>
                        <Text style={styles.deleteLogButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {/* New Exercise Log Rows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Exercises</Text>

          {rows.map((row, index) => (
            <View key={row.key} style={styles.exerciseRow}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseIndex}>#{index + 1}</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={() => moveRow(index, 'up')} disabled={index === 0}>
                    <Text style={[styles.moveText, index === 0 && styles.moveDisabled]}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveRow(index, 'down')} disabled={index === rows.length - 1}>
                    <Text style={[styles.moveText, index === rows.length - 1 && styles.moveDisabled]}>▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeRow(row.key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ExercisePicker
                value={row.exercise_name}
                exerciseId={row.exercise_id}
                onSelect={(name, exId) => updateRow(row.key, { exercise_name: name, exercise_id: exId })}
              />

              <SetDetailEditor
                sets={row.sets_detail}
                onChange={(setsDetail) => updateRow(row.key, { sets_detail: setsDetail })}
              />

              <TextInput
                style={styles.notesInput}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.disabled}
                value={row.notes}
                onChangeText={(notes) => updateRow(row.key, { notes })}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addRow}>
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveAllButton, isSaving && styles.saveAllButtonDisabled]}
          onPress={handleSaveAll}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveAllButtonText}>Save All</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Rest Timer */}
      <RestTimer />

      {/* Template Selection Modal */}
      <Modal
        visible={templateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Template</Text>
            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          {templatesLoading ? (
            <View style={styles.modalCentered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !templates || templates.length === 0 ? (
            <View style={styles.modalCentered}>
              <Text style={styles.modalEmptyText}>No templates available.</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderTemplateItem}
              contentContainerStyle={styles.modalList}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Inline edit component for saved logs
function EditableLog({
  log,
  onSave,
  onCancel,
}: {
  log: WorkoutLog;
  onSave: (name: string, sets: SetDetail[], notes: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(log.exercise_name);
  const [setsDetail, setSetsDetail] = useState<SetDetail[]>(
    log.sets_detail && log.sets_detail.length > 0
      ? log.sets_detail
      : [{ set_number: 1, reps: log.reps, weight: log.weight, completed: false }]
  );
  const [notes, setNotes] = useState(log.notes || '');

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={editStyles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Exercise name"
        placeholderTextColor={colors.disabled}
      />
      <SetDetailEditor sets={setsDetail} onChange={setSetsDetail} />
      <TextInput
        style={editStyles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        placeholderTextColor={colors.disabled}
        multiline
      />
      <View style={editStyles.buttonRow}>
        <TouchableOpacity style={editStyles.saveBtn} onPress={() => onSave(name, setsDetail, notes)}>
          <Text style={editStyles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={editStyles.cancelBtn} onPress={onCancel}>
          <Text style={editStyles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const editStyles = StyleSheet.create({
  nameInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: spacing.sm, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.xs,
  },
  notesInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: spacing.sm, fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs,
  },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  saveBtn: { backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: 6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSize.sm },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  cancelBtnText: { color: colors.textSecondary, fontSize: fontSize.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  applyTemplateButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 10, padding: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  applyTemplateButtonText: { fontSize: fontSize.md, fontWeight: '600', color: colors.primary },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  loadingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginBottom: spacing.md },
  loadingText: { fontSize: fontSize.sm, color: colors.textSecondary, marginLeft: spacing.sm },
  errorSection: { alignItems: 'center', padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: fontSize.sm, color: colors.danger, marginBottom: spacing.xs },
  retryText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  savedLogRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-start',
  },
  savedLogContent: { flex: 1 },
  savedLogName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  savedLogDetails: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  notesText: { fontSize: fontSize.sm, color: colors.secondary, marginTop: 2, fontStyle: 'italic' },
  savedLogActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moveText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  moveDisabled: { opacity: 0.3 },
  editText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500' },
  deleteLogButtonText: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '500' },
  exerciseRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  exerciseIndex: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeButton: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.danger,
    justifyContent: 'center', alignItems: 'center',
  },
  removeButtonText: { color: colors.surface, fontSize: fontSize.sm, fontWeight: '700' },
  notesInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 6, padding: spacing.sm, fontSize: fontSize.sm, color: colors.text, marginTop: spacing.sm, minHeight: 40,
  },
  addButton: {
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: 10, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  addButtonText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  saveAllButton: { backgroundColor: colors.success, borderRadius: 10, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  saveAllButtonDisabled: { backgroundColor: colors.disabled },
  saveAllButtonText: { color: colors.surface, fontSize: fontSize.lg, fontWeight: '700' },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  modalCloseText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  modalCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalEmptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  modalList: { padding: spacing.md },
  templateRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm,
  },
  templateRowTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  templateRowSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});

export default WorkoutLogScreen;
