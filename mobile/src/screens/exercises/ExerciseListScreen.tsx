import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useExercises, useDeleteExercise } from "../../hooks/useExercises";
import { useAuth } from "../../AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, borderRadius, shadows } from "../../theme";
import ErrorState from "../../components/ErrorState";
import type { Exercise } from "../../types";

type StackParams = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: number };
  ExerciseForm: { exerciseId?: number };
};

type Nav = NativeStackNavigationProp<StackParams, "ExerciseList">;

export default function ExerciseListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { data: exercises, isLoading, isError, refetch, isRefetching } = useExercises();
  const deleteExercise = useDeleteExercise();
  const isTrainer = user?.role === "trainer";

  const handleDelete = useCallback(
    (id: number, name: string) => {
      Alert.alert("Delete Exercise", `Delete "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteExercise.mutate(id),
        },
      ]);
    },
    [deleteExercise]
  );

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("ExerciseDetail", { exerciseId: item.id })}
      activeOpacity={0.7}
      onLongPress={isTrainer ? () => handleDelete(item.id, item.exercise_name) : undefined}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.exercise_name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.badges}>
          {item.video_url ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Link</Text>
            </View>
          ) : null}
          {item.video_path ? (
            <View style={[styles.badge, styles.badgeVideo]}>
              <Text style={styles.badgeText}>Video</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load exercises" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptySubtitle}>
              {isTrainer
                ? "Tap + to add your first exercise."
                : "Your trainer hasn't added exercises yet."}
            </Text>
          </View>
        }
        contentContainerStyle={exercises?.length === 0 ? styles.emptyContainer : undefined}
      />
      {isTrainer && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ExerciseForm", {})}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  emptyContainer: { flexGrow: 1 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  itemDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  badgeVideo: { backgroundColor: colors.success },
  badgeText: { fontSize: 11, color: colors.surface, fontWeight: "600" },
  chevron: { marginLeft: spacing.sm },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  fabText: { color: colors.surface, fontSize: 28, fontWeight: "400", lineHeight: 30 },
});
