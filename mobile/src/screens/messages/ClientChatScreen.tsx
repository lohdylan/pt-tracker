import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useMessages, useSendMessage, useMarkAsRead } from "../../hooks/useMessages";
import { useAuth } from "../../AuthContext";
import { colors, spacing, fontSize } from "../../theme";
import type { Message } from "../../types";

export default function ClientChatScreen() {
  const { user } = useAuth();
  const clientId = user?.clientId || 0;
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading } = useMessages(clientId);
  const sendMessage = useSendMessage(clientId);
  const markAsRead = useMarkAsRead(clientId);

  const markAsReadMutate = markAsRead.mutate;
  useEffect(() => {
    markAsReadMutate();
  }, [messages?.length, markAsReadMutate]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    setText("");
    sendMessage.mutate(content);
  }, [text, sendMessage]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.sender_role === "client";
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
          {item.content}
        </Text>
        <Text style={[styles.timeText, mine ? styles.timeMine : styles.timeTheirs]}>
          {formatTime(item.created_at)}
          {mine && item.read_at && " ✓"}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Send a message to your trainer</Text>
          </View>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.disabled}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  messageList: { padding: spacing.md, paddingBottom: spacing.sm },
  bubble: {
    maxWidth: "75%",
    padding: spacing.sm + 2,
    borderRadius: 16,
    marginBottom: spacing.xs + 2,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: fontSize.md, lineHeight: 20 },
  textMine: { color: "#fff" },
  textTheirs: { color: colors.text },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  timeMine: { color: "rgba(255,255,255,0.7)" },
  timeTheirs: { color: colors.textSecondary },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.xs,
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: colors.disabled },
  sendText: { color: "#fff", fontSize: fontSize.md, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: spacing.xl * 4 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
});
