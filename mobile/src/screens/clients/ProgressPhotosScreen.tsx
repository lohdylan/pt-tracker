import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useProgressPhotos, useUploadProgressPhoto, useDeleteProgressPhoto } from "../../hooks/useProgressPhotos";
import { UPLOADS_BASE } from "../../api";
import { colors, spacing, fontSize } from "../../theme";
import type { ProgressPhoto } from "../../types";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - spacing.md * 3) / 2;
const CATEGORIES = ["all", "front", "side", "back", "other"] as const;

export default function ProgressPhotosScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { clientId } = route.params;
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const category = activeCategory === "all" ? undefined : activeCategory;
  const { data: photos, isLoading } = useProgressPhotos(clientId, category);
  const uploadPhoto = useUploadProgressPhoto(clientId);
  const deletePhoto = useDeleteProgressPhoto(clientId);

  const handleUpload = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;
    const uri = result.assets[0].uri;

    Alert.alert("Category", "Select photo category", [
      { text: "Front", onPress: () => uploadPhoto.mutate({ uri, category: "front" }) },
      { text: "Side", onPress: () => uploadPhoto.mutate({ uri, category: "side" }) },
      { text: "Back", onPress: () => uploadPhoto.mutate({ uri, category: "back" }) },
      { text: "Other", onPress: () => uploadPhoto.mutate({ uri, category: "other" }) },
    ]);
  }, [uploadPhoto]);

  const handleDelete = useCallback(
    (photo: ProgressPhoto) => {
      Alert.alert("Delete Photo", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deletePhoto.mutate(photo.id) },
      ]);
    },
    [deletePhoto]
  );

  const handleCompare = useCallback(() => {
    navigation.navigate("PhotoComparison", { clientId });
  }, [navigation, clientId]);

  const renderPhoto = ({ item }: { item: ProgressPhoto }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: `${UPLOADS_BASE}${item.photo_url}` }}
        style={styles.photo}
      />
      <View style={styles.photoInfo}>
        <Text style={styles.categoryBadge}>{item.category}</Text>
        <Text style={styles.dateText}>
          {new Date(item.taken_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.compareButton} onPress={handleCompare}>
          <Text style={styles.compareText}>Compare</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : !photos || photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No progress photos yet</Text>
          <Text style={styles.emptySubtext}>Tap + to upload a photo</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPhoto}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleUpload} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: "row", justifyContent: "flex-end", padding: spacing.md, paddingBottom: 0 },
  compareButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: 8 },
  compareText: { color: "#fff", fontSize: fontSize.sm, fontWeight: "600" },
  filterRow: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary },
  filterTextActive: { color: "#fff" },
  list: { padding: spacing.md },
  row: { gap: spacing.md },
  photoCard: { width: PHOTO_SIZE, marginBottom: spacing.md, borderRadius: 12, overflow: "hidden", backgroundColor: colors.surface },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  photoInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xs + 2 },
  categoryBadge: { fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: "capitalize" },
  dateText: { fontSize: 11, color: colors.textSecondary },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
  emptySubtext: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "400", lineHeight: 30 },
});
