import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTemplates, useDeleteTemplate } from '../../hooks/useTemplates';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../theme';
import type { WorkoutTemplate } from '../../types';

type NavProp = NativeStackNavigationProp<{
  TemplateList: undefined;
  TemplateForm: { templateId?: number };
  WorkoutLog: { sessionId: number };
}>;

function TemplateListScreen() {
  const navigation = useNavigation<NavProp>();
  const { data: templates, isLoading, isError, error, refetch, isRefetching } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const handleDelete = useCallback(
    (template: WorkoutTemplate) => {
      Alert.alert(
        'Delete Template',
        `Are you sure you want to delete "${template.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteTemplate.mutate(template.id),
          },
        ],
      );
    },
    [deleteTemplate],
  );

  const handlePress = useCallback(
    (templateId: number) => {
      navigation.navigate('TemplateForm', { templateId });
    },
    [navigation],
  );

  const handleCreate = useCallback(() => {
    navigation.navigate('TemplateForm', {});
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: WorkoutTemplate }) => {
      const exerciseCount = item.exercises?.length ?? 0;
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => handlePress(item.id)}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rowSubtitle}>
              {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [handlePress, handleDelete],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No templates yet</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
          <Text style={styles.emptyButtonText}>Create Template</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, handleCreate]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load templates'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          templates && templates.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  list: {
    padding: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteButtonText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: {
    fontSize: 28,
    color: colors.surface,
    fontWeight: '400',
    lineHeight: 30,
  },
});

export default TemplateListScreen;
