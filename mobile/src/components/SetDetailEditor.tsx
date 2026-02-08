import React, { useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, fontSize } from "../theme";
import type { SetDetail } from "../types";

interface Props {
  sets: SetDetail[];
  onChange: (sets: SetDetail[]) => void;
}

export default function SetDetailEditor({ sets, onChange }: Props) {
  const updateSet = useCallback(
    (index: number, field: keyof SetDetail, value: string | boolean) => {
      const updated = [...sets];
      if (field === "completed") {
        updated[index] = { ...updated[index], completed: value as boolean };
      } else if (field === "reps") {
        updated[index] = { ...updated[index], reps: value ? parseInt(value as string, 10) || null : null };
      } else if (field === "weight") {
        updated[index] = { ...updated[index], weight: value ? parseFloat(value as string) || null : null };
      }
      onChange(updated);
    },
    [sets, onChange]
  );

  const addSet = useCallback(() => {
    onChange([
      ...sets,
      { set_number: sets.length + 1, reps: null, weight: null, completed: false },
    ]);
  }, [sets, onChange]);

  const removeSet = useCallback(
    (index: number) => {
      if (sets.length <= 1) return;
      const updated = sets
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, set_number: i + 1 }));
      onChange(updated);
    },
    [sets, onChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, styles.setCol]}>Set</Text>
        <Text style={[styles.headerText, styles.inputCol]}>Reps</Text>
        <Text style={[styles.headerText, styles.inputCol]}>Weight</Text>
        <Text style={[styles.headerText, styles.checkCol]}>Done</Text>
        <View style={styles.removeCol} />
      </View>
      {sets.map((set, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.setText, styles.setCol]}>{set.set_number}</Text>
          <TextInput
            style={[styles.input, styles.inputCol]}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.disabled}
            value={set.reps != null ? String(set.reps) : ""}
            onChangeText={(v) => updateSet(index, "reps", v)}
          />
          <TextInput
            style={[styles.input, styles.inputCol]}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.disabled}
            value={set.weight != null ? String(set.weight) : ""}
            onChangeText={(v) => updateSet(index, "weight", v)}
          />
          <TouchableOpacity
            style={[styles.checkBox, styles.checkCol, set.completed && styles.checkBoxChecked]}
            onPress={() => updateSet(index, "completed", !set.completed)}
          >
            {set.completed && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeCol}
            onPress={() => removeSet(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addSet}>
        <Text style={styles.addButtonText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  headerText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, textAlign: "center" },
  setCol: { width: 30 },
  inputCol: { flex: 1, marginHorizontal: 4 },
  checkCol: { width: 36, alignItems: "center" },
  removeCol: { width: 24, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  setText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 6,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: "center",
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  checkBoxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  removeText: { fontSize: 18, color: colors.danger, fontWeight: "700" },
  addButton: { marginTop: 4, alignItems: "center", padding: 6 },
  addButtonText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },
});
