import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkBanner() {
  const { isOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOffline) {
      // Debounce: only show banner after 1 second of being offline
      timerRef.current = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
    } else {
      // Clear pending timer and hide immediately when back online
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowBanner(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOffline]);

  if (!showBanner) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
