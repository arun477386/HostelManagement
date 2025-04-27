import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { createHostel, addRecentActivity } from '../services/firestoreService';
import { useHostelStore } from '../services/hostelStore';
import { useActivityContext } from '../services/ActivityContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { HostelGender } from '../types/hostelSchema';
import { useAppData } from '../contexts/AppDataContext';

interface FormData {
  name: string;
  location: string;
  gender: HostelGender;
  totalFloors: string;
}

interface FormErrors {
  name?: string;
  location?: string;
  gender?: string;
  totalFloors?: string;
}

export default function CreateHostelScreen() {
  const { user } = useAuth();
  const { from } = useLocalSearchParams<{ from: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    gender: 'coliving',
    totalFloors: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const { setSelectedHostelId, fetchHostels } = useHostelStore();
  const { triggerRefresh } = useActivityContext();
  const { refresh } = useAppData();

  const handleSubmit = async () => {
    // Validate form
    const newErrors: FormErrors = {};
    if (!formData.name) newErrors.name = 'Hostel name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.totalFloors) newErrors.totalFloors = 'Total floors is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Create hostel data
      const hostelData = {
        name: formData.name,
        location: formData.location,
        gender: formData.gender,
        totalFloors: parseInt(formData.totalFloors),
        createdAt: new Date().toISOString(),
        isActive: true,
        recentActivities: {},
      };

      // Create hostel in Firestore
      const hostelId = await createHostel(user.uid, hostelData);

      // Add recent activity for hostel creation
      await addRecentActivity(user.uid, {
        type: 'hostel_added',
        message: `Hostel '${formData.name}' was created`,
        hostelId: hostelId,
        createdAt: new Date().toISOString(),
      });

      // Refresh all data
      if (typeof window !== 'undefined') {
        // Refresh AppDataContext
        refresh();
        
        // Trigger activity refresh
        triggerRefresh();
        
        // Refetch hostels list
        await fetchHostels(user.uid);
      }

      // Set this hostel as the selected hostel
      setSelectedHostelId(hostelId);

      // Navigate based on where we came from
      if (from === 'hostels') {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the hostel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {from === 'hostels' && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {from === 'hostels' ? 'Create Your Hostel' : 'Create Your First Hostel'}
          </Text>
          <Text style={styles.subtitle}>
            {from === 'hostels' 
              ? 'Add a new hostel to your management system'
              : "Let's get started by setting up your first hostel"}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          {/* Hostel Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hostel Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter hostel name"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city or area"
              placeholderTextColor={colors.textSecondary}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              autoCapitalize="words"
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderOptions}>
              {(['gents', 'ladies', 'coliving'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    formData.gender === gender && styles.genderOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Ionicons
                    name={
                      gender === 'gents'
                        ? 'male-outline'
                        : gender === 'ladies'
                        ? 'female-outline'
                        : 'people-outline'
                    }
                    size={20}
                    color={formData.gender === gender ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === gender && styles.genderTextSelected,
                    ]}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Total Floors */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Floors</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total number of floors"
              placeholderTextColor={colors.textSecondary}
              value={formData.totalFloors}
              onChangeText={(text) => setFormData({ ...formData, totalFloors: text })}
              keyboardType="numeric"
            />
            {errors.totalFloors && <Text style={styles.errorText}>{errors.totalFloors}</Text>}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.cardBackground} />
          ) : (
            <Text style={styles.buttonText}>Create Hostel</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: layout.screenPadding,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    ...typography.titleXL,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.textSecondary,
    color: colors.textSecondary,
  },
  form: {
    padding: layout.screenPadding,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.textBase,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: layout.inputRadius,
    paddingHorizontal: layout.cardPadding,
    ...typography.textBase,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: layout.inputRadius,
    marginHorizontal: 4,
  },
  genderOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  genderText: {
    ...typography.textBase,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  genderTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: layout.screenPadding,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  button: {
    height: layout.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: layout.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.textBase,
    color: colors.cardBackground,
    fontWeight: '600',
  },
  error: {
    ...typography.textSecondary,
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  errorText: {
    ...typography.textSecondary,
    color: colors.error,
    marginTop: 4,
  },
}); 