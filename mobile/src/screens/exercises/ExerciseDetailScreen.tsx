import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import { useExercise, useDeleteExercise } from "../../hooks/useExercises";
import { useAuth } from "../../AuthContext";
import { UPLOADS_BASE } from "../../api";
import { colors, spacing, fontSize } from "../../theme";
import { isYouTubeUrl, extractYouTubeVideoId } from "../../utils/youtube";
import YouTubePlayer from "../../components/YouTubePlayer";

type StackParams = {
  ExerciseDetail: { exerciseId: number };
  ExerciseForm: { exerciseId?: number };
};

type Nav = NativeStackNavigationProp<StackParams, "ExerciseDetail">;
type Route = RouteProp<StackParams, "ExerciseDetail">;

export default function ExerciseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { exerciseId } = route.params;
  const { user } = useAuth();
  const { data: exercise, isLoading, isError } = useExercise(exerciseId);
  const deleteExercise = useDeleteExercise();
  const isTrainer = user?.role === "trainer";

  const handleEdit = useCallback(() => {
    navigation.navigate("ExerciseForm", { exerciseId });
  }, [navigation, exerciseId]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Exercise", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteExercise.mutate(exerciseId, {
            onSuccess: () => navigation.goBack(),
          }),
      },
    ]);
  }, [deleteExercise, exerciseId, navigation]);

  const handleOpenUrl = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open URL")
    );
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !exercise) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load exercise.</Text>
      </View>
    );
  }

  const hasUploadedVideo = !!exercise.video_path;
  const hasExternalUrl = !!exercise.video_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{exercise.exercise_name}</Text>

      {exercise.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{exercise.description}</Text>
        </View>
      ) : null}

      {hasUploadedVideo && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Demo Video</Text>
          <Video
            source={{ uri: `${UPLOADS_BASE}${exercise.video_path}` }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={styles.video}
          />
        </View>
      )}

      {hasExternalUrl && isYouTubeUrl(exercise.video_url!) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Demo Video</Text>
          <YouTubePlayer
            videoId={extractYouTubeVideoId(exercise.video_url!)!}
            videoUrl={exercise.video_url!}
          />
        </View>
      )}

      {hasExternalUrl && !isYouTubeUrl(exercise.video_url!) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Video Link</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenUrl(exercise.video_url!)}
          >
            <Text style={styles.linkButtonText}>Open Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {!hasUploadedVideo && !hasExternalUrl && (
        <View style={styles.card}>
          <Text style={styles.noVideoText}>No video available for this exercise.</Text>
        </View>
      )}

      {isTrainer && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: fontSize.md, color: colors.danger },
  name: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  video: { width: "100%", height: 220, borderRadius: 8, backgroundColor: "#000" },
  linkButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    alignItems: "center",
  },
  linkButtonText: { color: colors.surface, fontSize: fontSize.md, fontWeight: "600" },
  noVideoText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  editButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 10, alignItems: "center" },
  editButtonText: { fontSize: fontSize.md, fontWeight: "600", color: colors.surface },
  deleteButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: { fontSize: fontSize.md, fontWeight: "600", color: colors.danger },
});
