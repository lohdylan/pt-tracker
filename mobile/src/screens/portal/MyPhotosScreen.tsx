import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../AuthContext";
import { useProgressPhotos } from "../../hooks/useProgressPhotos";
import { UPLOADS_BASE } from "../../api";
import { colors, spacing, fontSize } from "../../theme";
import type { ProgressPhoto } from "../../types";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - spacing.md * 3) / 2;
const CATEGORIES = ["all", "front", "side", "back", "other"] as const;

export default function MyPhotosScreen() {
  const { user } = useAuth();
  const clientId = user?.clientId || 0;
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const category = activeCategory === "all" ? undefined : activeCategory;
  const { data: photos, isLoading } = useProgressPhotos(clientId, category);

  const renderPhoto = ({ item }: { item: ProgressPhoto }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: `${UPLOADS_BASE}${item.photo_url}` }} style={styles.photo} />
      <View style={styles.photoInfo}>
        <Text style={styles.categoryBadge}>{item.category}</Text>
        <Text style={styles.dateText}>{new Date(item.taken_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
          <Text style={styles.emptySubtext}>Your trainer will upload photos for you.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
});
