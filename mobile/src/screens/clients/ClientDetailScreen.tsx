import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useClient, useDeleteClient } from '../../hooks/useClients';
import { useSessions } from '../../hooks/useSessions';
import { useMeasurements } from '../../hooks/useMeasurements';
import { UPLOADS_BASE } from '../../api';
import { colors, spacing, fontSize } from '../../theme';
import type { Session, Measurement } from '../../types';

type ParamList = {
  ClientDetail: { clientId: number };
  ClientForm: { clientId?: number };
  SessionDetail: { sessionId: number };
  MeasurementForm: { clientId: number; measurementId?: number };
  ProgressChart: { clientId: number };
};

type NavigationProp = NativeStackNavigationProp<ParamList, 'ClientDetail'>;
type ClientDetailRouteProp = RouteProp<ParamList, 'ClientDetail'>;

type TabName = 'sessions' | 'measurements';

function ClientDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClientDetailRouteProp>();
  const { clientId } = route.params;

  const { data: client, isLoading, isError } = useClient(clientId);
  const deleteClient = useDeleteClient();
  const { data: sessions, isLoading: sessionsLoading } = useSessions({ client_id: clientId });
  const { data: measurements, isLoading: measurementsLoading } = useMeasurements(clientId);

  const [activeTab, setActiveTab] = useState<TabName>('sessions');

  const handleEdit = useCallback(() => {
    navigation.navigate('ClientForm', { clientId });
  }, [navigation, clientId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteClient.mutate(clientId, {
              onSuccess: () => {
                navigation.goBack();
              },
            });
          },
        },
      ],
    );
  }, [deleteClient, clientId, navigation]);

  const handleSessionPress = useCallback(
    (sessionId: number) => {
      navigation.navigate('SessionDetail', { sessionId });
    },
    [navigation],
  );

  const handleAddMeasurement = useCallback(() => {
    navigation.navigate('MeasurementForm', { clientId });
  }, [navigation, clientId]);

  const handleViewCharts = useCallback(() => {
    navigation.navigate('ProgressChart', { clientId });
  }, [navigation, clientId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '--';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load client.</Text>
      </View>
    );
  }

  const renderAvatar = () => {
    if (client.photo_url) {
      return (
        <Image
          source={{ uri: `${UPLOADS_BASE}/${client.photo_url}` }}
          style={styles.profilePhoto}
        />
      );
    }
    const initial = (client.first_name?.[0] ?? '?').toUpperCase();
    return (
      <View style={styles.profileInitialCircle}>
        <Text style={styles.profileInitialText}>{initial}</Text>
      </View>
    );
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSessionPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemLeft}>
        <Text style={styles.listItemTitle}>{formatDate(item.scheduled_at || item.created_at)}</Text>
        <Text style={styles.listItemSubtitle}>
          {item.status ?? 'Scheduled'} {item.duration_min ? `- ${formatDuration(item.duration_min)}` : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </TouchableOpacity>
  );

  const renderMeasurementItem = ({ item }: { item: Measurement }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemLeft}>
        <Text style={styles.listItemTitle}>{formatDate(item.recorded_at)}</Text>
        <Text style={styles.listItemSubtitle}>
          {item.weight_lbs ? `${item.weight_lbs} lbs` : 'No weight recorded'}
        </Text>
      </View>
    </View>
  );

  const renderInfoRow = (label: string, value?: string | null) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {renderAvatar()}
          <Text style={styles.profileName}>
            {client.first_name} {client.last_name}
          </Text>

          {renderInfoRow('Email', client.email)}
          {renderInfoRow('Phone', client.phone)}
          {renderInfoRow('Goals', client.goals)}
          {renderInfoRow('Notes', client.notes)}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
            onPress={() => setActiveTab('sessions')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'sessions' && styles.tabTextActive,
              ]}
            >
              Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'measurements' && styles.tabActive]}
            onPress={() => setActiveTab('measurements')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'measurements' && styles.tabTextActive,
              ]}
            >
              Measurements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'sessions' && (
          <View style={styles.tabContent}>
            {sessionsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.tabLoader}
              />
            ) : !sessions || sessions.length === 0 ? (
              <Text style={styles.emptyTabText}>No sessions yet.</Text>
            ) : (
              sessions.map((session: Session) => (
                <React.Fragment key={session.id}>
                  {renderSessionItem({ item: session })}
                </React.Fragment>
              ))
            )}
          </View>
        )}

        {activeTab === 'measurements' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.chartButton}
              onPress={handleViewCharts}
            >
              <Text style={styles.chartButtonText}>View Charts</Text>
            </TouchableOpacity>

            {measurementsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.tabLoader}
              />
            ) : !measurements || measurements.length === 0 ? (
              <Text style={styles.emptyTabText}>No measurements yet.</Text>
            ) : (
              measurements.map((m: Measurement) => (
                <React.Fragment key={m.id}>
                  {renderMeasurementItem({ item: m })}
                </React.Fragment>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {activeTab === 'measurements' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddMeasurement}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const PHOTO_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
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
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profilePhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    marginBottom: spacing.md,
  },
  profileInitialCircle: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileInitialText: {
    color: colors.surface,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    width: '100%',
    paddingVertical: spacing.xs + 2,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    paddingTop: spacing.sm,
  },
  tabLoader: {
    marginTop: spacing.xl,
  },
  emptyTabText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  chartButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartButtonText: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
});

export default ClientDetailScreen;
