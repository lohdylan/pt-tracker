import React, { useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useConversations } from "../../hooks/useMessages";
import { useAuth } from "../../AuthContext";
import { UPLOADS_BASE } from "../../api";
import { colors, spacing, fontSize } from "../../theme";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import type { Conversation } from "../../types";

export default function ConversationListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { data: conversations, isLoading, isError, error, refetch } = useConversations();

  const handlePress = useCallback(
    (clientId: number, name: string) => {
      navigation.navigate("Chat", { clientId, name });
    },
    [navigation]
  );

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // For client, redirect to chat screen via useLayoutEffect (not during render)
  useLayoutEffect(() => {
    if (user?.role === "client") {
      navigation.replace("ClientChat");
    }
  }, [user?.role, navigation]);

  if (user?.role === "client") return null;

  const renderItem = ({ item }: { item: Conversation }) => {
    const name = `${item.first_name} ${item.last_name}`;
    const initial = (item.first_name?.[0] ?? "?").toUpperCase();

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handlePress(item.client_id, name)}
        activeOpacity={0.7}
      >
        {item.photo_url ? (
          <Image source={{ uri: `${UPLOADS_BASE}${item.photo_url}` }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {item.last_message || "No messages yet"}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load conversations" detail={(error as Error)?.message} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.client_id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            subtitle="Messages with your clients will appear here"
          />
        }
      />
    </View>
  );
}

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  list: { paddingVertical: spacing.xs },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, marginRight: spacing.md },
  avatarPlaceholder: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginRight: spacing.md,
  },
  avatarText: { color: "#fff", fontSize: fontSize.lg, fontWeight: "700" },
  content: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text, flex: 1, marginRight: spacing.sm },
  time: { fontSize: 12, color: colors.textSecondary },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  preview: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1, marginRight: spacing.sm },
  badge: {
    backgroundColor: colors.danger, borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
