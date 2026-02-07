import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useClients } from '../../hooks/useClients';
import { UPLOADS_BASE } from '../../api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../theme';
import type { Client } from '../../types';

type NavigationProp = NativeStackNavigationProp<{
  ClientList: undefined;
  ClientDetail: { clientId: number };
  ClientForm: { clientId?: number };
}>;

function ClientListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: clients, isLoading, isError, refetch, isRefetching } = useClients();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!search.trim()) return clients;
    const q = search.toLowerCase().trim();
    return clients.filter(
      (c: Client) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const handlePress = useCallback(
    (clientId: number) => {
      navigation.navigate('ClientDetail', { clientId });
    },
    [navigation],
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('ClientForm', {});
  }, [navigation]);

  const renderAvatar = (client: Client) => {
    if (client.photo_url) {
      return (
        <Image
          source={{ uri: `${UPLOADS_BASE}/${client.photo_url}` }}
          style={styles.avatar}
        />
      );
    }
    const initial = (client.first_name?.[0] ?? '?').toUpperCase();
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handlePress(item.id)}
      activeOpacity={0.7}
    >
      {renderAvatar(item)}
      <View style={styles.rowContent}>
        <Text style={styles.name} numberOfLines={1}>
          {item.first_name} {item.last_name}
        </Text>
      </View>
      <View
        style={[
          styles.statusChip,
          item.is_active ? styles.statusActive : styles.statusInactive,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            item.is_active ? styles.statusTextActive : styles.statusTextInactive,
          ]}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const keyExtractor = (item: Client) => String(item.id);

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
        <Text style={styles.errorText}>Failed to load clients.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {filtered.length === 0 && !search ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No clients yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first client to get started.
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Client</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 && search ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>
            No clients match "{search}".
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const AVATAR_SIZE = 48;

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
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  statusChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  statusActive: {
    backgroundColor: colors.successLight,
  },
  statusInactive: {
    backgroundColor: colors.backgroundAlt,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
});

export default ClientListScreen;
