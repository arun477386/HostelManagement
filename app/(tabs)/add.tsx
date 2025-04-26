import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../services/AuthContext';
import { router } from 'expo-router';
import { createStudent, getOwnerDocument } from '../../services/firestoreService';

interface CustomCharge {
  label: string;
  amount: string;
}

interface FormData {
  fullName: string;
  phone: string;
  hostelId: string;
  roomId: string;
  joinDate: Date;
  feeAmount: string;
  customCharges: CustomCharge[];
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  hostelId?: string;
  roomId?: string;
  feeAmount?: string;
}

export default function Add() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHostelDropdownOpen, setIsHostelDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hostels, setHostels] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    hostelId: '',
    roomId: '',
    joinDate: new Date(),
    feeAmount: '',
    customCharges: [{ label: '', amount: '' }],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        if (!user) return;

        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;

        // Convert hostels object to array format
        const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
          id,
          name: hostel.name,
        }));

        setHostels(hostelsArray);
      } catch (error) {
        console.error('Error fetching hostels:', error);
      }
    };

    fetchHostels();
  }, [user]);

  const handleAddCharge = () => {
    setFormData(prev => ({
      ...prev,
      customCharges: [...prev.customCharges, { label: '', amount: '' }]
    }));
  };

  const handleRemoveCharge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customCharges: prev.customCharges.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // Validate form
    const newErrors: FormErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.hostelId) newErrors.hostelId = 'Hostel selection is required';
    if (!formData.roomId) newErrors.roomId = 'Room selection is required';
    if (!formData.feeAmount) newErrors.feeAmount = 'Monthly fee is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Create student data
      const studentData = {
        fullName: formData.fullName,
        phone: formData.phone,
        roomId: formData.roomId,
        joinDate: formData.joinDate.toISOString(),
        leaveDate: null,
        feeAmount: parseFloat(formData.feeAmount),
        customCharges: formData.customCharges.map(charge => ({
          label: charge.label,
          amount: parseFloat(charge.amount) || 0,
        })),
        isActive: true,
        documents: [],
        notes: '',
      };

      // Create student in Firestore
      await createStudent(user.uid, formData.hostelId, formData.roomId, studentData);

      // Navigate back to home screen
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the student');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, joinDate: selectedDate });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Add New Student</Text>
        <Text style={styles.subtitle}>Assign to hostel, room and setup monthly fees</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Form */}
      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter student's full name"
            value={formData.fullName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
          />
          {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
        </View>

        {/* Hostel Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Hostel</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsHostelDropdownOpen(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.hostelId ? hostels.find(h => h.id === formData.hostelId)?.name : 'Select Hostel'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {errors.hostelId && <Text style={styles.error}>{errors.hostelId}</Text>}
        </View>

        {/* Room Selection - Disabled until hostel is selected */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Room</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, !formData.hostelId && styles.disabled]}
            disabled={!formData.hostelId}
            onPress={() => {}}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.roomId ? 'Room ' + formData.roomId : 'Select Room'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {errors.roomId && <Text style={styles.error}>{errors.roomId}</Text>}
        </View>

        {/* Join Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Join Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setShowDatePicker(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.dateButtonText}>
              {formData.joinDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Join Date</Text>
                  <View style={styles.datePickerContainer}>
                    <TextInput
                      style={styles.dateInput}
                      value={formData.joinDate.toLocaleDateString()}
                      editable={false}
                    />
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(formData.joinDate);
                        newDate.setDate(newDate.getDate() + 1);
                        setFormData({ ...formData, joinDate: newDate });
                      }}
                    >
                      <Ionicons name="chevron-up" size={24} color="#4B9EFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const newDate = new Date(formData.joinDate);
                        newDate.setDate(newDate.getDate() - 1);
                        setFormData({ ...formData, joinDate: newDate });
                      }}
                    >
                      <Ionicons name="chevron-down" size={24} color="#4B9EFF" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>

        {/* Monthly Fee */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Fee</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter monthly fee"
            keyboardType="numeric"
            value={formData.feeAmount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, feeAmount: text }))}
          />
          {errors.feeAmount && <Text style={styles.error}>{errors.feeAmount}</Text>}
        </View>

        {/* Custom Charges */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Custom Charges</Text>
          {formData.customCharges.map((charge, index) => (
            <View key={index} style={styles.chargeRow}>
              <TextInput
                style={[styles.input, styles.chargeInput]}
                placeholder="Charge label"
                value={charge.label}
                onChangeText={(text) => {
                  const newCharges = [...formData.customCharges];
                  newCharges[index].label = text;
                  setFormData({ ...formData, customCharges: newCharges });
                }}
              />
              <TextInput
                style={[styles.input, styles.chargeInput]}
                placeholder="Amount"
                value={charge.amount}
                onChangeText={(text) => {
                  const newCharges = [...formData.customCharges];
                  newCharges[index].amount = text;
                  setFormData({ ...formData, customCharges: newCharges });
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCharge(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCharge}
          >
            <Ionicons name="add-circle" size={24} color="#4B9EFF" />
            <Text style={styles.addButtonText}>Add Custom Charge</Text>
          </TouchableOpacity>
        </View>

        {/* Upload ID Proof */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Upload ID Proof</Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Ionicons name="cloud-upload-outline" size={24} color="#4B9EFF" />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Student</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Hostel Selection Modal */}
      <Modal
        visible={isHostelDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsHostelDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsHostelDropdownOpen(false)}
        >
          <View style={styles.dropdownList}>
            {hostels.map((hostel) => (
              <TouchableOpacity
                key={hostel.id}
                style={[
                  styles.dropdownItem,
                  formData.hostelId === hostel.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setFormData({ ...formData, hostelId: hostel.id, roomId: '' });
                  setIsHostelDropdownOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  formData.hostelId === hostel.id && styles.dropdownItemTextSelected
                ]}>
                  {hostel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectText: {
    fontSize: 16,
    color: '#1F2937',
  },
  error: {
    color: '#FF4C4C',
    fontSize: 12,
    marginTop: 4,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButton: {
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#4B9EFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#4B9EFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#4B9EFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: 300,
    padding: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownItemTextSelected: {
    color: '#4B9EFF',
    fontWeight: '500',
  },
  chargeInput: {
    flex: 1,
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  datePickerButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#4B9EFF',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 