import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, fontSize, borderRadius } from "../../theme";

const { width } = Dimensions.get("window");

interface OnboardingPage {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const pages: OnboardingPage[] = [
  {
    id: "welcome",
    title: "Welcome to PT Tracker",
    subtitle:
      "Your personal training companion. Track sessions, monitor progress, and stay connected with your trainer.",
    icon: "fitness-outline",
  },
  {
    id: "sessions",
    title: "Your Sessions",
    subtitle:
      "View upcoming and past sessions. Get reminders before each session so you never miss one.",
    icon: "calendar-outline",
  },
  {
    id: "progress",
    title: "Track Progress",
    subtitle:
      "See your measurements, workout logs, and progress photos all in one place.",
    icon: "trending-up-outline",
  },
  {
    id: "connected",
    title: "Stay Connected",
    subtitle:
      "Message your trainer directly and receive notifications about new sessions and measurements.",
    icon: "chatbubbles-outline",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = useCallback(async () => {
    await AsyncStorage.setItem("pt_onboarding_complete", "true");
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  }, [currentIndex]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / width
      );
      setCurrentIndex(index);
    },
    []
  );

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={styles.page}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={80} color={colors.primary} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const isLastPage = currentIndex === pages.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip link (pages 0-2) */}
      {!isLastPage && (
        <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={isLastPage ? handleComplete : handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLastPage ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  page: {
    width,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginTop: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: borderRadius.full,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.disabled,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
});
