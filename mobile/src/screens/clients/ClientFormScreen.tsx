import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  useClient,
  useCreateClient,
  useUpdateClient,
  useUploadPhoto,
} from '../../hooks/useClients';
import { UPLOADS_BASE } from '../../api';
import { colors, spacing, fontSize } from '../../theme';

type ParamList = {
  ClientForm: { clientId?: number };
};

type NavigationProp = NativeStackNavigationProp<ParamList, 'ClientForm'>;
type ClientFormRouteProp = RouteProp<ParamList, 'ClientForm'>;

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  goals: string;
  notes: string;
  is_active: boolean;
}

const initialForm: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  goals: '',
  notes: '',
  is_active: true,
};

function ClientFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClientFormRouteProp>();
  const clientId = route.params?.clientId;
  const isEditing = clientId != null;

  const { data: existingClient, isLoading: clientLoading } = useClient(
    clientId as number,
  );
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const uploadPhoto = useUploadPhoto();

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && existingClient) {
      setForm({
        first_name: existingClient.first_name ?? '',
        last_name: existingClient.last_name ?? '',
        email: existingClient.email ?? '',
        phone: existingClient.phone ?? '',
        goals: existingClient.goals ?? '',
        notes: existingClient.notes ?? '',
        is_active: existingClient.is_active ?? true,
      });
    }
  }, [isEditing, existingClient]);

  const updateField = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handlePickImage = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to select a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.first_name.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return;
    }
    if (!form.last_name.trim()) {
      Alert.alert('Validation Error', 'Last name is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        goals: form.goals.trim() || undefined,
        notes: form.notes.trim() || undefined,
        is_active: form.is_active,
      };

      if (isEditing && clientId) {
        await updateClient.mutateAsync({ id: clientId, ...payload });

        if (selectedImage) {
          await uploadPhoto.mutateAsync({
            id: clientId,
            uri: selectedImage,
          });
        }
      } else {
        await createClient.mutateAsync(payload);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    form,
    isEditing,
    clientId,
    selectedImage,
    createClient,
    updateClient,
    uploadPhoto,
    navigation,
  ]);

  if (isEditing && clientLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentPhotoUri = selectedImage
    ? selectedImage
    : isEditing && existingClient?.photo_url
      ? `${UPLOADS_BASE}/${existingClient.photo_url}`
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Picker */}
        <View style={styles.photoSection}>
          {currentPhotoUri ? (
            <Image source={{ uri: currentPhotoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>No Photo</Text>
            </View>
          )}
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            <Text style={styles.photoButtonText}>
              {currentPhotoUri ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={form.first_name}
            onChangeText={(v) => updateField('first_name', v)}
            placeholder="First name"
            placeholderTextColor={colors.disabled}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={form.last_name}
            onChangeText={(v) => updateField('last_name', v)}
            placeholder="Last name"
            placeholderTextColor={colors.disabled}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="email@example.com"
            placeholderTextColor={colors.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.disabled}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Goals</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={form.goals}
            onChangeText={(v) => updateField('goals', v)}
            placeholder="Client goals..."
            placeholderTextColor={colors.disabled}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={form.notes}
            onChangeText={(v) => updateField('notes', v)}
            placeholder="Additional notes..."
            placeholderTextColor={colors.disabled}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {isEditing && (
          <View style={styles.switchRow}>
            <Text style={styles.label}>Active</Text>
            <Switch
              value={form.is_active}
              onValueChange={(v) => updateField('is_active', v)}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Client' : 'Create Client'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PHOTO_PREVIEW_SIZE = 100;

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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: PHOTO_PREVIEW_SIZE,
    height: PHOTO_PREVIEW_SIZE,
    borderRadius: PHOTO_PREVIEW_SIZE / 2,
    marginBottom: spacing.sm,
  },
  photoPlaceholder: {
    width: PHOTO_PREVIEW_SIZE,
    height: PHOTO_PREVIEW_SIZE,
    borderRadius: PHOTO_PREVIEW_SIZE / 2,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  photoPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  photoButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: spacing.sm + 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});

export default ClientFormScreen;
