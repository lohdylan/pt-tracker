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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../api';
import { useCreateTemplate, useUpdateTemplate } from '../../hooks/useTemplates';
import { colors, spacing, fontSize } from '../../theme';
import type { TemplateExercise } from '../../types';

type RouteParams = {
  TemplateForm: { templateId?: number };
};

type ExerciseRow = {
  key: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
};

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyRow(): ExerciseRow {
  return {
    key: generateKey(),
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
  };
}

function TemplateFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RouteParams>>();
  const route = useRoute<NativeStackScreenProps<RouteParams, 'TemplateForm'>['route']>();
  const templateId = route.params?.templateId;
  const isEditing = templateId != null;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseRow[]>([createEmptyRow()]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    setIsFetching(true);
    setFetchError(null);

    api
      .get(`/templates/${templateId}`)
      .then((template: any) => {
        if (cancelled) return;
        setName(template.name ?? '');
        if (template.exercises && template.exercises.length > 0) {
          setExercises(
            template.exercises.map((ex: TemplateExercise) => ({
              key: generateKey(),
              exercise_name: ex.exercise_name ?? '',
              sets: ex.sets != null ? String(ex.sets) : '',
              reps: ex.reps != null ? String(ex.reps) : '',
              weight: ex.weight != null ? String(ex.weight) : '',
            })),
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load template');
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, templateId]);

  const updateExercise = useCallback((key: string, field: keyof ExerciseRow, value: string) => {
    setExercises((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }, []);

  const removeExercise = useCallback((key: string) => {
    setExercises((prev) => {
      if (prev.length <= 1) {
        Alert.alert('Cannot Remove', 'You need at least one exercise row.');
        return prev;
      }
      return prev.filter((row) => row.key !== key);
    });
  }, []);

  const addExercise = useCallback(() => {
    setExercises((prev) => [...prev, createEmptyRow()]);
  }, []);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Template name is required.');
      return;
    }

    const validExercises = exercises.filter((ex) => ex.exercise_name.trim().length > 0);
    if (validExercises.length === 0) {
      Alert.alert('Validation Error', 'At least one exercise with a name is required.');
      return;
    }

    const payload = {
      name: trimmedName,
      exercises: validExercises.map((ex) => ({
        exercise_name: ex.exercise_name.trim(),
        sets: ex.sets ? parseInt(ex.sets, 10) || undefined : undefined,
        reps: ex.reps ? parseInt(ex.reps, 10) || undefined : undefined,
        weight: ex.weight ? parseFloat(ex.weight) || undefined : undefined,
      })),
    };

    const mutation = isEditing
      ? updateTemplate.mutateAsync({ id: templateId!, ...payload } as any)
      : createTemplate.mutateAsync(payload as any);

    mutation
      .then(() => {
        navigation.goBack();
      })
      .catch((err) => {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save template.');
      });
  }, [name, exercises, isEditing, templateId, createTemplate, updateTemplate, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? 'Edit Template' : 'New Template',
    });
  }, [navigation, isEditing]);

  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.label}>Template Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Upper Body Push"
          placeholderTextColor={colors.disabled}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Exercises</Text>

        {exercises.map((exercise, index) => (
          <View key={exercise.key} style={styles.exerciseRow}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseIndex}>#{index + 1}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeExercise(exercise.key)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.exerciseNameInput}
              placeholder="Exercise name"
              placeholderTextColor={colors.disabled}
              value={exercise.exercise_name}
              onChangeText={(val) => updateExercise(exercise.key, 'exercise_name', val)}
            />

            <View style={styles.numericRow}>
              <View style={styles.numericField}>
                <Text style={styles.numericLabel}>Sets</Text>
                <TextInput
                  style={styles.numericInput}
                  placeholder="0"
                  placeholderTextColor={colors.disabled}
                  keyboardType="numeric"
                  value={exercise.sets}
                  onChangeText={(val) => updateExercise(exercise.key, 'sets', val)}
                />
              </View>
              <View style={styles.numericField}>
                <Text style={styles.numericLabel}>Reps</Text>
                <TextInput
                  style={styles.numericInput}
                  placeholder="0"
                  placeholderTextColor={colors.disabled}
                  keyboardType="numeric"
                  value={exercise.reps}
                  onChangeText={(val) => updateExercise(exercise.key, 'reps', val)}
                />
              </View>
              <View style={styles.numericField}>
                <Text style={styles.numericLabel}>Weight</Text>
                <TextInput
                  style={styles.numericInput}
                  placeholder="0"
                  placeholderTextColor={colors.disabled}
                  keyboardType="decimal-pad"
                  value={exercise.weight}
                  onChangeText={(val) => updateExercise(exercise.key, 'weight', val)}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addExercise}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Template' : 'Save Template'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default TemplateFormScreen;
