import React from "react";
import { TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import { useAuth } from "../AuthContext";
import { colors, fontSize, spacing } from "../theme";

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: spacing.md,
  },
  text: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
