import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

interface Props {
  count: number;
}

export default function UnreadBadge({ count }: Props) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  text: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
