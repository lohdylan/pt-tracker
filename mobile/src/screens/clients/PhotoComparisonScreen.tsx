import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useProgressPhotos } from "../../hooks/useProgressPhotos";
import { UPLOADS_BASE } from "../../api";
import { colors, spacing, fontSize } from "../../theme";
import type { ProgressPhoto } from "../../types";

const { width } = Dimensions.get("window");
const PANE_WIDTH = (width - spacing.md * 3) / 2;

export default function PhotoComparisonScreen() {
  const route = useRoute<any>();
  const { clientId } = route.params;
  const { data: photos } = useProgressPhotos(clientId);

  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, (photos?.length ?? 1) - 1));

  const sorted = useMemo(
    () => (photos ? [...photos].sort((a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()) : []),
    [photos]
  );

  if (sorted.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Need at least 2 photos to compare</Text>
      </View>
    );
  }

  const leftPhoto = sorted[leftIndex];
  const rightPhoto = sorted[rightIndex] || sorted[sorted.length - 1];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const renderPane = (photo: ProgressPhoto, index: number, setIndex: (i: number) => void, label: string) => (
    <View style={styles.pane}>
      <Text style={styles.paneLabel}>{label}</Text>
      <Image source={{ uri: `${UPLOADS_BASE}${photo.photo_url}` }} style={styles.image} />
      <Text style={styles.dateLabel}>{formatDate(photo.taken_at)}</Text>
      <Text style={styles.categoryLabel}>{photo.category}</Text>
      <View style={styles.navRow}>
        <TouchableOpacity
          disabled={index <= 0}
          onPress={() => setIndex(index - 1)}
          style={[styles.navButton, index <= 0 && styles.navDisabled]}
        >
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{index + 1}/{sorted.length}</Text>
        <TouchableOpacity
          disabled={index >= sorted.length - 1}
          onPress={() => setIndex(index + 1)}
          style={[styles.navButton, index >= sorted.length - 1 && styles.navDisabled]}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Before & After</Text>
      <View style={styles.panes}>
        {renderPane(leftPhoto, leftIndex, setLeftIndex, "Before")}
        {renderPane(rightPhoto, rightIndex, setRightIndex, "After")}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  heading: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  panes: { flexDirection: "row", gap: spacing.md },
  pane: { width: PANE_WIDTH, alignItems: "center" },
  paneLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary, marginBottom: spacing.xs },
  image: { width: PANE_WIDTH, height: PANE_WIDTH * 1.3, borderRadius: 12, backgroundColor: colors.border },
  dateLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600", marginTop: spacing.xs },
  categoryLabel: { fontSize: 11, color: colors.primary, textTransform: "capitalize" },
  navRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs, gap: spacing.sm },
  navButton: { padding: 6 },
  navDisabled: { opacity: 0.3 },
  navText: { fontSize: 16, color: colors.primary },
  countText: { fontSize: 12, color: colors.textSecondary },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
});
