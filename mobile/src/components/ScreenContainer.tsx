import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface ScreenContainerProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function ScreenContainer({
  isLoading,
  isError,
  error,
  onRetry,
  children,
}: ScreenContainerProps) {
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={error?.message} onRetry={onRetry} />;
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
