import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCreateMeasurement } from '../../hooks/useMeasurements';
import { colors, spacing, fontSize } from '../../theme';

type ParamList = {
  MeasurementForm: { clientId: number; measurementId?: number };
};

type NavigationProp = NativeStackNavigationProp<ParamList, 'MeasurementForm'>;
type MeasurementFormRouteProp = RouteProp<ParamList, 'MeasurementForm'>;

interface FormState {
  recorded_at: string;
  weight_lbs: string;
  body_fat_pct: string;
  chest_in: string;
  waist_in: string;
  hips_in: string;
  arm_in: string;
  thigh_in: string;
}

const initialForm: FormState = {
  recorded_at: new Date().toISOString().split('T')[0],
  weight_lbs: '',
  body_fat_pct: '',
  chest_in: '',
  waist_in: '',
  hips_in: '',
  arm_in: '',
  thigh_in: '',
};

function MeasurementFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MeasurementFormRouteProp>();
  const { clientId } = route.params;

  const createMeasurement = useCreateMeasurement(clientId);

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const parseNum = (val: string): number | undefined => {
    if (!val.trim()) return undefined;
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };

  const handleSave = useCallback(async () => {
    if (!form.recorded_at.trim()) {
      Alert.alert('Validation Error', 'Date is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        recorded_at: form.recorded_at.trim(),
        weight_lbs: parseNum(form.weight_lbs),
        body_fat_pct: parseNum(form.body_fat_pct),
        chest_in: parseNum(form.chest_in),
        waist_in: parseNum(form.waist_in),
        hips_in: parseNum(form.hips_in),
        arm_in: parseNum(form.arm_in),
        thigh_in: parseNum(form.thigh_in),
      };

      await createMeasurement.mutateAsync(payload);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save measurement. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [form, createMeasurement, navigation]);

  const renderNumericField = (
    label: string,
    field: keyof FormState,
    placeholder: string,
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={(v) => updateField(field, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.disabled}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Log Measurement</Text>

        {/* Date Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={form.recorded_at}
            onChangeText={(v) => updateField('recorded_at', v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.disabled}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>Body Weight</Text>

        {renderNumericField('Weight (lbs)', 'weight_lbs', '0.0')}
        {renderNumericField('Body Fat (%)', 'body_fat_pct', '0.0')}

        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>Body Measurements (inches)</Text>

        {renderNumericField('Chest', 'chest_in', '0.0')}
        {renderNumericField('Waist', 'waist_in', '0.0')}
        {renderNumericField('Hips', 'hips_in', '0.0')}
        {renderNumericField('Arm', 'arm_in', '0.0')}
        {renderNumericField('Thigh', 'thigh_in', '0.0')}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>Save Measurement</Text>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
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
});

export default MeasurementFormScreen;
