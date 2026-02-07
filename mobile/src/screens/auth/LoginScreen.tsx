import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../AuthContext";
import { colors, spacing, fontSize, borderRadius } from "../../theme";

export default function LoginScreen() {
  const { loginAsTrainer, loginAsClient } = useAuth();
  const [mode, setMode] = useState<"trainer" | "client" | null>(null);
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrainerLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await loginAsTrainer(password.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async () => {
    if (!accessCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await loginAsClient(accessCode.trim().toUpperCase());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PT Tracker</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => setMode("trainer")}
        >
          <Text style={styles.roleIcon}>{"🏋️"}</Text>
          <Text style={styles.roleText}>I'm a Trainer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.roleButtonAlt]}
          onPress={() => setMode("client")}
        >
          <Text style={styles.roleIcon}>{"👤"}</Text>
          <Text style={[styles.roleText, styles.roleTextAlt]}>I'm a Client</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setMode(null);
          setError("");
          setPassword("");
          setAccessCode("");
        }}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {mode === "trainer" ? "Trainer Login" : "Client Login"}
      </Text>

      {mode === "trainer" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.disabled}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleTrainerLogin}
          />
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleTrainerLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="Access Code"
            placeholderTextColor={colors.disabled}
            autoCapitalize="characters"
            maxLength={6}
            value={accessCode}
            onChangeText={setAccessCode}
            onSubmitEditing={handleClientLogin}
          />
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleClientLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  roleButtonAlt: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: fontSize.lg + 6,
    marginRight: spacing.md,
  },
  roleText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.surface,
  },
  roleTextAlt: {
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  codeInput: {
    fontSize: fontSize.xl,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
    letterSpacing: 6,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
