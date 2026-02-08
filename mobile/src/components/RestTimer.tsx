import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Audio } from "expo-av";
import { colors, spacing, fontSize } from "../theme";

const PRESET_TIMES = [30, 60, 90, 120];

export default function RestTimer() {
  const [seconds, setSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playAlarm = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" },
        { shouldPlay: true }
      );
      setTimeout(() => sound.unloadAsync(), 3000);
    } catch {
      // Sound may not be available
    }
  }, []);

  const startTimer = useCallback(() => {
    setRemaining(seconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          playAlarm();
          // Pulse animation
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, playAlarm, pulseAnim]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setRemaining(0);
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>⏱</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rest Timer</Text>
        <TouchableOpacity onPress={() => { stopTimer(); setIsExpanded(false); }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.timeDisplay}>
        {isRunning ? formatTime(remaining) : formatTime(seconds)}
      </Text>

      {!isRunning && (
        <View style={styles.presets}>
          {PRESET_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.presetButton, seconds === t && styles.presetActive]}
              onPress={() => setSeconds(t)}
            >
              <Text style={[styles.presetText, seconds === t && styles.presetTextActive]}>
                {formatTime(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, isRunning ? styles.stopButton : styles.startButton]}
        onPress={isRunning ? stopTimer : startTimer}
      >
        <Text style={styles.actionText}>{isRunning ? "Stop" : "Start"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: { fontSize: 22 },
  container: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  closeText: { fontSize: 18, color: colors.textSecondary },
  timeDisplay: { fontSize: 36, fontWeight: "700", color: colors.text, textAlign: "center", marginVertical: spacing.sm },
  presets: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  presetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { fontSize: 11, color: colors.textSecondary },
  presetTextActive: { color: "#fff" },
  actionButton: { borderRadius: 8, padding: spacing.sm, alignItems: "center" },
  startButton: { backgroundColor: colors.success },
  stopButton: { backgroundColor: colors.danger },
  actionText: { color: "#fff", fontSize: fontSize.md, fontWeight: "700" },
});
