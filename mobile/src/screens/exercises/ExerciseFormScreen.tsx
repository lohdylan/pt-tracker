import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  useExercise,
  useCreateExercise,
  useUpdateExercise,
  useUploadExerciseVideo,
} from "../../hooks/useExercises";
import { colors, spacing, fontSize } from "../../theme";
import FormField from "../../components/FormField";

type StackParams = {
  ExerciseForm: { exerciseId?: number };
};

type Nav = NativeStackNavigationProp<StackParams>;
type Route = RouteProp<StackParams, "ExerciseForm">;

export default function ExerciseFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const exerciseId = route.params?.exerciseId;
  const isEditing = !!exerciseId;

  const { data: existing, isLoading: loadingExisting } = useExercise(exerciseId || 0);
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const uploadVideo = useUploadExerciseVideo();

  const [exerciseName, setExerciseName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!exerciseName.trim()) errs.exerciseName = "Exercise name is required";
    if (videoUrl.trim() && !/^https?:\/\/.+/.test(videoUrl.trim())) {
      errs.videoUrl = "Must be a valid URL starting with http:// or https://";
    }
    return errs;
  }, [exerciseName, videoUrl]);

  const errors = validate();
  const showError = (field: string) => (touched[field] || submitted) ? errors[field] : undefined;
  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  useEffect(() => {
    if (isEditing && existing) {
      setExerciseName(existing.exercise_name);
      setDescription(existing.description || "");
      setVideoUrl(existing.video_url || "");
    }
  }, [isEditing, existing]);

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSubmitted(true);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        exercise_name: exerciseName.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
      };

      let id: number;
      if (isEditing) {
        const result = await updateExercise.mutateAsync({ id: exerciseId!, ...payload });
        id = result.id;
      } else {
        const result = await createExercise.mutateAsync(payload);
        id = result.id;
      }

      if (videoUri) {
        await uploadVideo.mutateAsync({ id, uri: videoUri });
      }

      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    exerciseName, description, videoUrl, videoUri, isEditing,
    exerciseId, createExercise, updateExercise, uploadVideo, navigation, validate,
  ]);

  if (isEditing && loadingExisting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormField
        label="Exercise Name"
        required
        value={exerciseName}
        onChangeText={setExerciseName}
        onBlur={() => handleBlur("exerciseName")}
        error={showError("exerciseName")}
        placeholder="e.g. Bench Press"
      />

      <FormField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="How to perform this exercise..."
        multiline
        numberOfLines={4}
        style={styles.textArea}
        textAlignVertical="top"
      />

      <FormField
        label="Video URL (YouTube/Vimeo)"
        value={videoUrl}
        onChangeText={setVideoUrl}
        onBlur={() => handleBlur("videoUrl")}
        error={showError("videoUrl")}
        placeholder="https://youtube.com/watch?v=..."
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={styles.uploadLabel}>Upload Video</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
        <Text style={styles.uploadButtonText}>
          {videoUri ? "Video selected" : "Choose Video File"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? "Update Exercise" : "Create Exercise"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  uploadLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm + 2,
  },
  uploadButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.surface, fontSize: fontSize.lg, fontWeight: "600" },
});
