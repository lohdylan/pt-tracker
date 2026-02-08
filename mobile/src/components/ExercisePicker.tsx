import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useExerciseSearch } from "../hooks/useExercises";
import { colors, spacing, fontSize } from "../theme";
import type { Exercise } from "../types";

interface Props {
  value: string;
  exerciseId: number | null;
  onSelect: (name: string, exerciseId: number | null) => void;
}

export default function ExercisePicker({ value, exerciseId, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [showResults, setShowResults] = useState(false);
  const { data: results } = useExerciseSearch(query);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowResults(true);
    // Update parent with free text (no exercise_id yet)
    onSelect(text, null);
  }, [onSelect]);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    setQuery(exercise.exercise_name);
    setShowResults(false);
    onSelect(exercise.exercise_name, exercise.id);
  }, [onSelect]);

  const handleBlur = useCallback(() => {
    // Small delay to allow tap on result
    setTimeout(() => setShowResults(false), 200);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search exercise or type name..."
        placeholderTextColor={colors.disabled}
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onBlur={handleBlur}
      />
      {exerciseId && (
        <View style={styles.linkedBadge}>
          <Text style={styles.linkedText}>Linked</Text>
        </View>
      )}
      {showResults && results && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.resultItem}
              onPress={() => handleSelectExercise(exercise)}
            >
              <Text style={styles.resultText}>{exercise.exercise_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", zIndex: 10 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  linkedBadge: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  linkedText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginTop: 2,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  resultItem: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: { fontSize: fontSize.md, color: colors.text },
});
