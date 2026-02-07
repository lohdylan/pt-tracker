import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession, useCreateSession, useUpdateSession } from '../../hooks/useSessions';
import { useClients } from '../../hooks/useClients';
import { colors, spacing, fontSize } from '../../theme';
import FormField from '../../components/FormField';
import type { Client } from '../../types';

type RootStackParamList = {
  Calendar: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  WorkoutLog: { sessionId: number };
};

type ScreenRouteProp = RouteProp<RootStackParamList, 'SessionForm'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function SessionFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { sessionId, date: routeDate, clientId: routeClientId } = route.params || {};

  const isEditing = !!sessionId;
  const { data: existingSession, isLoading: sessionLoading } = useSession(sessionId!);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dateTime, setDateTime] = useState<string>(routeDate ? `${routeDate} 09:00` : '');
  const [duration, setDuration] = useState<string>('60');
  const [notes, setNotes] = useState<string>('');
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!selectedClient) errs.client = 'Please select a client';
    if (!dateTime.trim()) errs.dateTime = 'Date is required';
    if (!duration.trim()) {
      errs.duration = 'Duration is required';
    } else {
      const durationNum = parseInt(duration, 10);
      if (isNaN(durationNum) || durationNum <= 0) errs.duration = 'Duration must be a positive number';
    }
    return errs;
  }, [selectedClient, dateTime, duration]);

  const errors = validate();
  const showError = (field: string) => (touched[field] || submitted) ? errors[field] : undefined;
  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  useEffect(() => {
    if (isEditing && existingSession) {
      if (existingSession.first_name && clients) {
        const client = clients.find((c: Client) => c.id === existingSession.client_id);
        if (client) setSelectedClient(client);
      }
      if (existingSession.scheduled_at) {
        const d = new Date(existingSession.scheduled_at);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setDateTime(`${year}-${month}-${day} ${hours}:${minutes}`);
      }
      setDuration(String(existingSession.duration_min || 60));
      if (existingSession.notes) setNotes(existingSession.notes);
    }
  }, [isEditing, existingSession, clients]);

  useEffect(() => {
    if (routeClientId && clients) {
      const client = clients.find((c: Client) => c.id === routeClientId);
      if (client) setSelectedClient(client);
    }
  }, [routeClientId, clients]);

  const handleSave = useCallback(() => {
    setSubmitted(true);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    const durationNum = parseInt(duration, 10);
    const payload = {
      client_id: selectedClient!.id,
      scheduled_at: dateTime.trim(),
      duration_min: durationNum,
      notes: notes.trim() || undefined,
    };

    if (isEditing && sessionId) {
      updateSession.mutate(
        { id: sessionId, ...payload } as any,
        {
          onSuccess: () => navigation.goBack(),
          onError: () => Alert.alert('Error', 'Failed to update session.'),
        }
      );
    } else {
      createSession.mutate(payload as any, {
        onSuccess: () => navigation.goBack(),
        onError: () => Alert.alert('Error', 'Failed to create session.'),
      });
    }
  }, [selectedClient, dateTime, duration, notes, isEditing, sessionId, updateSession, createSession, navigation, validate]);

  const isSaving = createSession.isPending || updateSession.isPending;

  if (isEditing && sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const clientDisplayName = (c: Client) => `${c.first_name} ${c.last_name}`;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditing ? 'Edit Session' : 'New Session'}</Text>

        <View style={styles.field}>
          <Text style={styles.pickerLabel}>Client *</Text>
          <TouchableOpacity style={[styles.pickerButton, showError('client') && styles.pickerButtonError]} onPress={() => setClientPickerVisible(true)}>
            <Text style={[styles.pickerButtonText, !selectedClient && styles.placeholderText]}>
              {selectedClient ? clientDisplayName(selectedClient) : 'Select a client'}
            </Text>
          </TouchableOpacity>
          {showError('client') && <Text style={styles.errorText}>{showError('client')}</Text>}
        </View>

        <FormField
          label="Date & Time"
          required
          value={dateTime}
          onChangeText={setDateTime}
          onBlur={() => handleBlur('dateTime')}
          error={showError('dateTime')}
          placeholder="YYYY-MM-DD HH:MM"
        />

        <FormField
          label="Duration (minutes)"
          required
          value={duration}
          onChangeText={setDuration}
          onBlur={() => handleBlur('duration')}
          error={showError('duration')}
          placeholder="60"
          keyboardType="numeric"
        />

        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Session notes..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Session' : 'Book Session'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={clientPickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setClientPickerVisible(false); setTouched(prev => ({ ...prev, client: true })); }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity onPress={() => { setClientPickerVisible(false); setTouched(prev => ({ ...prev, client: true })); }}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          {clientsLoading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : !clients || clients.length === 0 ? (
            <View style={styles.centered}><Text style={styles.emptyText}>No clients found</Text></View>
          ) : (
            <FlatList
              data={clients.filter((c: Client) => c.is_active)}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.clientList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.clientItem, selectedClient?.id === item.id && styles.clientItemSelected]}
                  onPress={() => { setSelectedClient(item); setClientPickerVisible(false); setTouched(prev => ({ ...prev, client: true })); }}
                >
                  <Text style={[styles.clientItemText, selectedClient?.id === item.id && styles.clientItemTextSelected]}>
                    {clientDisplayName(item)}
                  </Text>
                  {item.email ? <Text style={styles.clientItemEmail}>{item.email}</Text> : null}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  pickerLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  textArea: { minHeight: 100, paddingTop: spacing.sm + 4 },
  pickerButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  pickerButtonError: { borderColor: colors.danger },
  errorText: { fontSize: fontSize.sm, color: colors.danger, marginTop: spacing.xs },
  pickerButtonText: { fontSize: fontSize.md, color: colors.text },
  placeholderText: { color: colors.disabled },
  saveButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center', marginTop: spacing.md },
  saveButtonDisabled: { backgroundColor: colors.disabled },
  saveButtonText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.surface },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  clientList: { padding: spacing.md },
  clientItem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginBottom: spacing.sm },
  clientItemSelected: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  clientItemText: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  clientItemTextSelected: { color: colors.primary, fontWeight: '600' },
  clientItemEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
});

export default SessionFormScreen;
