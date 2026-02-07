import React, { useState, useEffect, useCallback } from 'react';
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
  useCreateWorkoutLog,
  useDeleteWorkoutLog,
} from '../../hooks/useWorkoutLogs';
import { colors, spacing, fontSize } from '../../theme';
import type { WorkoutTemplate, WorkoutLog } from '../../types';

type RouteParams = {
  WorkoutLog: { sessionId: number };
};

type ExerciseLogRow = {
  key: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
};

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyRow(): ExerciseLogRow {
  return {
    key: generateKey(),
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
  };
}

function WorkoutLogScreen() {
  const route = useRoute<NativeStackScreenProps<RouteParams, 'WorkoutLog'>['route']>();
  const { sessionId } = route.params;

  const [rows, setRows] = useState<ExerciseLogRow[]>([createEmptyRow()]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: existingLogs,
    isLoading: logsLoading,
    isError: logsError,
    error: logsErrorObj,
    refetch: refetchLogs,
  } = useWorkoutLogs(sessionId);

  const { data: templates, isLoading: templatesLoading } = useTemplates();

  const createLog = useCreateWorkoutLog(sessionId);
  const deleteLog = useDeleteWorkoutLog(sessionId);

  const updateRow = useCallback((key: string, field: keyof ExerciseLogRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
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

  const applyTemplate = useCallback((template: WorkoutTemplate) => {
    if (!template.exercises || template.exercises.length === 0) {
      Alert.alert('Empty Template', 'This template has no exercises.');
      return;
    }

    const newRows: ExerciseLogRow[] = template.exercises.map((ex) => ({
      key: generateKey(),
      exercise_name: ex.exercise_name ?? '',
      sets: ex.sets != null ? String(ex.sets) : '',
      reps: ex.reps != null ? String(ex.reps) : '',
      weight: ex.weight != null ? String(ex.weight) : '',
    }));

    setRows((prev) => {
      const hasContent = prev.some(
        (r) => r.exercise_name.trim() || r.sets || r.reps || r.weight,
      );
      if (hasContent) {
        return [...prev, ...newRows];
      }
      return newRows;
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
      const promises = validRows.map((row) =>
        createLog.mutateAsync({
          session_id: sessionId,
          exercise_name: row.exercise_name.trim(),
          sets: row.sets ? parseInt(row.sets, 10) || null : null,
          reps: row.reps ? parseInt(row.reps, 10) || null : null,
          weight: row.weight ? parseFloat(row.weight) || null : null,
        }),
      );
      await Promise.all(promises);
      setRows([createEmptyRow()]);
      Alert.alert('Success', 'Workout logs saved.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save workout logs.');
    } finally {
      setIsSaving(false);
    }
  }, [rows, createLog, sessionId]);

  const handleDeleteLog = useCallback(
    (log: WorkoutLog) => {
      Alert.alert('Delete Log', `Delete "${log.exercise_name}" log?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLog.mutate(log.id),
        },
      ]);
    },
    [deleteLog],
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
            {existingLogs.map((log: WorkoutLog) => (
              <View key={log.id} style={styles.savedLogRow}>
                <View style={styles.savedLogContent}>
                  <Text style={styles.savedLogName}>{log.exercise_name}</Text>
                  <Text style={styles.savedLogDetails}>
                    {[
                      log.sets != null ? `${log.sets} sets` : null,
                      log.reps != null ? `${log.reps} reps` : null,
                      log.weight != null ? `${log.weight} lbs` : null,
                    ]
                      .filter(Boolean)
                      .join(' / ')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteLogButton}
                  onPress={() => handleDeleteLog(log)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteLogButtonText}>Delete</Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeRow(row.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.exerciseNameInput}
                placeholder="Exercise name"
                placeholderTextColor={colors.disabled}
                value={row.exercise_name}
                onChangeText={(val) => updateRow(row.key, 'exercise_name', val)}
              />

              <View style={styles.numericRow}>
                <View style={styles.numericField}>
                  <Text style={styles.numericLabel}>Sets</Text>
                  <TextInput
                    style={styles.numericInput}
                    placeholder="0"
                    placeholderTextColor={colors.disabled}
                    keyboardType="numeric"
                    value={row.sets}
                    onChangeText={(val) => updateRow(row.key, 'sets', val)}
                  />
                </View>
                <View style={styles.numericField}>
                  <Text style={styles.numericLabel}>Reps</Text>
                  <TextInput
                    style={styles.numericInput}
                    placeholder="0"
                    placeholderTextColor={colors.disabled}
                    keyboardType="numeric"
                    value={row.reps}
                    onChangeText={(val) => updateRow(row.key, 'reps', val)}
                  />
                </View>
                <View style={styles.numericField}>
                  <Text style={styles.numericLabel}>Weight</Text>
                  <TextInput
                    style={styles.numericInput}
                    placeholder="0"
                    placeholderTextColor={colors.disabled}
                    keyboardType="decimal-pad"
                    value={row.weight}
                    onChangeText={(val) => updateRow(row.key, 'weight', val)}
                  />
                </View>
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  applyTemplateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  applyTemplateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  errorSection: {
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  retryText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  savedLogRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedLogContent: {
    flex: 1,
  },
  savedLogName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  savedLogDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deleteLogButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteLogButtonText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '500',
  },
  exerciseRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseIndex: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  exerciseNameInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  numericRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numericField: {
    flex: 1,
  },
  numericLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  numericInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  saveAllButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveAllButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveAllButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  modalCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalEmptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  modalList: {
    padding: spacing.md,
  },
  templateRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  templateRowTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  templateRowSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default WorkoutLogScreen;
