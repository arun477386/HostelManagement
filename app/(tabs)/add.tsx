import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Modal, FlatList, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../services/AuthContext';
import { router } from 'expo-router';
import { createStudent, getOwnerDocument, addRecentActivity, getRecentActivities } from '../../services/firestoreService';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firestoreService';
import { useHostelStore } from '../../services/hostelStore';
import { Student as SchemaStudent, CustomCharge as SchemaCustomCharge } from '../../types/hostelSchema';
import { differenceInMonths, parseISO, format } from 'date-fns';
import { getStudentPaidStatus } from '../../utils/finance';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { useActivityContext } from '../../services/ActivityContext';
import HostelSelectorModal from '../../components/HostelSelectorModal';
import { useToast } from '../../contexts/ToastContext';

type SharingType = '1' | '2' | '3' | '4' | '5' | 'other';

interface Student extends SchemaStudent {
  id: string;
}

interface CustomCharge {
  label: string;
  amount: string;
}

interface FormData {
  fullName: string;
  phone: string;
  hostelId: string;
  roomId: string;
  sharingType: SharingType;
  joinDate: Date;
  feeAmount: string;
  joiningAdvance: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  hostelId?: string;
  roomId?: string;
  sharingType?: string;
  feeAmount?: string;
  joiningAdvance?: string;
}

export default function Add() {
  const { user } = useAuth();
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHostelDropdownOpen, setIsHostelDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSharingDropdownOpen, setIsSharingDropdownOpen] = useState(false);
  const [hostels, setHostels] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    hostelId: selectedHostelId !== 'all' ? selectedHostelId : '',
    roomId: '',
    sharingType: '2',
    joinDate: new Date(),
    feeAmount: '',
    joiningAdvance: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [studentFilter, setStudentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const { triggerRefresh } = useActivityContext();
  const [refreshing, setRefreshing] = useState(false);
  const filterIconRef = useRef<View>(null);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const { showToast } = useToast();

  const fetchHostels = async () => {
    try {
      if (!user) return;
      const ownerDoc = await getOwnerDocument(user.uid);
      if (!ownerDoc) return;
      const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
        id,
        name: hostel.name,
      }));
      setHostels(hostelsArray);
      // Set first hostel as default if none is selected
      if (hostelsArray.length > 0 && (!selectedHostelId || selectedHostelId === 'all')) {
        const firstHostelId = hostelsArray[0].id;
        setSelectedHostelId(firstHostelId);
        setFormData(prev => ({ ...prev, hostelId: firstHostelId }));
      }
    } catch (error) {
      // Error handling
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHostels();
    }, [user])
  );

  useEffect(() => {
    fetchHostels();
  }, [user]);

  const fetchStudents = async () => {
    if (!user || !selectedHostelId || selectedHostelId === 'all') {
      setStudents([]);
      return;
    }

    try {
      const ownerDoc = await getOwnerDocument(user.uid);
      if (!ownerDoc) {
        setStudents([]);
        return;
      }

      const hostel = ownerDoc.hostels[selectedHostelId];
      if (!hostel) {
        setStudents([]);
        return;
      }

      // Convert students object to array
      const studentsData = Object.entries(hostel.students || {}).map(([id, student]) => ({
        id,
        ...student
      })) as Student[];
      
      setStudents(studentsData);
    } catch (error) {
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, selectedHostelId]);

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

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      hostelId: selectedHostelId !== 'all' ? selectedHostelId : '',
      roomId: '',
      sharingType: '2',
      joinDate: new Date(),
      feeAmount: '',
      joiningAdvance: '',
    });
    setErrors({});
  };

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, []);

  const handleSubmit = async () => {
    // Validate form
    const newErrors: FormErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.hostelId) newErrors.hostelId = 'Hostel selection is required';
    if (!formData.roomId) newErrors.roomId = 'Room number is required';
    if (!formData.sharingType) newErrors.sharingType = 'Sharing type is required';
    if (!formData.feeAmount) newErrors.feeAmount = 'Monthly fee is required';
    if (!formData.joiningAdvance) newErrors.joiningAdvance = 'Joining advance is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Get owner document to check hostel and room
      const ownerDoc = await getOwnerDocument(user.uid);
      if (!ownerDoc) throw new Error('Owner document not found');

      const hostel = ownerDoc.hostels[formData.hostelId];
      if (!hostel) throw new Error('Hostel not found');

      // Create room if it doesn't exist
      if (!hostel.rooms[formData.roomId]) {
        const roomData = {
          roomNumber: formData.roomId,
          type: 'standard',
          capacity: parseInt(formData.sharingType) || 2,
          sharingType: formData.sharingType,
          students: [],
          isFull: false,
        };

        // Update hostel with new room
        await updateDoc(doc(db, 'owners', user.uid), {
          [`hostels.${formData.hostelId}.rooms.${formData.roomId}`]: roomData,
        });
      }

      // Create student data
      const studentData = {
        fullName: formData.fullName,
        phone: formData.phone,
        roomId: formData.roomId,
        joinDate: formData.joinDate.toISOString(),
        leaveDate: null,
        feeAmount: parseFloat(formData.feeAmount),
        joiningAdvance: {
          amount: parseFloat(formData.joiningAdvance) || 0,
        },
        isActive: true,
        documents: [],
        notes: '',
      };

      // Create student in Firestore
      const studentId = await createStudent(user.uid, formData.hostelId, formData.roomId, studentData);

      // Show success toast
      showToast('Student added successfully', 'success');

      // Reset form and close modal
      resetForm();
      setIsAddModalVisible(false);

      // Refresh data
      await fetchStudents();
      triggerRefresh();

      // Add activity with proper data structure
      const hostelName = hostels.find(h => h.id === formData.hostelId)?.name || '';
      await addRecentActivity(user.uid, {
        type: 'student_added',
        message: `${formData.fullName} joined ${hostelName}`,
        hostelId: formData.hostelId,
        studentId: studentId,
        createdAt: new Date().toISOString(),
      });
      // Fetch recent activities immediately so UI updates without reload
      if (typeof getRecentActivities === 'function') {
        try {
          const recentActivities = await getRecentActivities(user.uid);
          if (recentActivities && typeof window !== 'undefined') {
            // If you have a context or state for activities, update it here
            // For example, if using useActivityContext or similar:
            if (typeof triggerRefresh === 'function') triggerRefresh();
          }
        } catch (e) {
          // Ignore errors
        }
      }
      triggerRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the student');
      showToast(err.message || 'Failed to add student', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // Helper to check paid status
  const checkPaidStatus = (student: Student) => {
    const today = new Date();
    const joinDate = parseISO(student.joinDate);
    const monthsSinceJoin = differenceInMonths(today, joinDate);
    if (monthsSinceJoin === 0) {
      return 'Paid';
    } else {
      const currentMonth = today.toISOString().slice(0, 7);
      if (student.payments && student.payments[currentMonth]?.status === 'paid') {
        return 'Paid';
      } else {
        return 'Unpaid';
      }
    }
  };

  const filteredStudents = students.filter(student => {
    if (studentFilter === 'all') return true;
    const status = getStudentPaidStatus(student);
    return studentFilter === 'paid' ? status === 'Paid' : status === 'Unpaid';
  });

  const renderStudentCard = ({ item }: { item: Student }) => {
    const paidStatus = checkPaidStatus(item);
    return (
      <View style={styles.studentCard}>
        {/* Line 1: Name | Room No */}
        <View style={styles.studentCardRowJustify}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="person-circle-outline" size={20} color="#4B9EFF" style={{ marginRight: 6 }} />
            <Text style={styles.studentName}>{item.fullName}</Text>
          </View>
          <Text style={styles.studentRoom}>Room {item.roomId}</Text>
        </View>
        {/* Line 2: Phone */}
        <View style={styles.studentCardRow}>
          <Ionicons name="call-outline" size={16} color="#606770" style={{ marginRight: 4 }} />
          <Text style={styles.studentPhone}>{item.phone}</Text>
        </View>
        {/* Line 3: Join Date + Paid/Unpaid Badge */}
        <View style={styles.studentCardRow}>
          <Ionicons name="calendar-outline" size={16} color="#606770" style={{ marginRight: 4 }} />
          <Text style={styles.studentJoinDate}>
            Joined: {new Date(item.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <View style={styles.badgeSpacer} />
          <Text style={[styles.paidBadge, paidStatus === 'Paid' ? styles.paid : styles.unpaid]}>
            {paidStatus === 'Paid' ? '✅ Paid' : '❌ Unpaid'}
          </Text>
        </View>
      </View>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHostels();
      await fetchStudents();
    } catch (e) {
      // Optionally handle error
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          {!loading && (
            <TouchableOpacity 
              style={styles.hostelSelector}
              onPress={() => setIsHostelDropdownOpen(!isHostelDropdownOpen)}
            >
              <Ionicons name="business-outline" size={16} color="#4B9EFF" style={{ marginRight: 3 }} />
              <Text
                style={styles.hostelText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {(hostels.find(h => h.id === selectedHostelId)?.name || '') + ' '}
              </Text>
              <Ionicons 
                name={isHostelDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#4B9EFF" 
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.addStudentButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.addStudentButtonText}>Add</Text>
            <Ionicons name="person-add-outline" size={20} color="#4B9EFF" style={styles.addStudentButtonIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            ref={filterIconRef}
            style={styles.floatingFilterButton}
            onPress={event => {
              filterIconRef.current?.measureInWindow((x, y, width, height) => {
                setFilterDropdownPosition({ left: x + width / 2, top: y + height });
              });
              setFilterDropdownVisible((v) => !v);
            }}
          >
            <Ionicons name="filter-outline" size={20} color="#4B9EFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No students added yet</Text>
            <Text style={styles.emptySubtext}>Tap the Add button to add a new student</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Add Student Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
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

              {/* Room Number and Sharing Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Room Details</Text>
                <View style={styles.rowContainer}>
                  <View style={styles.halfInput}>
                    <TextInput
                      style={styles.input}
                      placeholder="Room number"
                      value={formData.roomId}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, roomId: text }))}
                      keyboardType="numeric"
                    />
                    {errors.roomId && <Text style={styles.error}>{errors.roomId}</Text>}
                  </View>
                  <View style={styles.halfInput}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setIsSharingDropdownOpen(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {formData.sharingType ? `${formData.sharingType}-sharing` : 'Select Sharing'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    {errors.sharingType && <Text style={styles.error}>{errors.sharingType}</Text>}
                  </View>
                </View>
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

              {/* Joining Advance */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Joining Advance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter joining advance amount"
                  keyboardType="numeric"
                  value={formData.joiningAdvance}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, joiningAdvance: text }))}
                />
                {errors.joiningAdvance && <Text style={styles.error}>{errors.joiningAdvance}</Text>}
              </View>

              {/* Upload ID Proof */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Upload ID Proof</Text>
                <TouchableOpacity style={styles.uploadButton}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#4B9EFF" />
                  <Text style={styles.uploadButtonText}>Upload Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
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
        </View>
      </Modal>

      {/* Hostel Selection Modal */}
      <HostelSelectorModal
        visible={isHostelDropdownOpen}
        onClose={() => setIsHostelDropdownOpen(false)}
        hostels={hostels}
        selectedHostelId={selectedHostelId}
        onSelect={(id) => {
          setSelectedHostelId(id);
          setFormData(prev => ({ ...prev, hostelId: id }));
        }}
      />

      {/* Sharing Type Modal */}
      <Modal
        visible={isSharingDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSharingDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSharingDropdownOpen(false)}
        >
          <View style={styles.dropdownList}>
            {(['1', '2', '3', '4', '5', 'other'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.dropdownItem,
                  formData.sharingType === type && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, sharingType: type }));
                  setIsSharingDropdownOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  formData.sharingType === type && styles.dropdownItemTextSelected
                ]}>
                  {type === 'other' ? 'Other' : `${type}-sharing`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Dropdown */}
      {filterDropdownVisible && filterDropdownPosition && (
        <View style={[styles.filterDropdownBare, {
          position: 'absolute',
          right: 8,
          top: filterDropdownPosition.top + 6,
        }]}
        >
          <View style={styles.filterDropdownTightContainer}>
            {[{ key: 'all', label: 'All' }, { key: 'paid', label: 'Paid' }, { key: 'unpaid', label: 'Unpaid' }].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterDropdownBareItem,
                  studentFilter === option.key && styles.filterDropdownBareItemSelected,
                ]}
                onPress={() => {
                  setStudentFilter(option.key as any);
                  setFilterDropdownVisible(false);
                }}
              >
                <Text style={[
                  styles.filterDropdownBareText,
                  studentFilter === option.key && styles.filterDropdownBareTextSelected,
                ]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    maxWidth: '45%',
  },
  hostelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    minWidth: 0,
  },
  hostelText: {
    fontSize: 14,
    color: '#4B9EFF',
    fontWeight: '500',
    marginHorizontal: 6,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
  },
  addStudentButtonText: {
    color: '#4B9EFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  addStudentButtonIcon: {
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  studentCardRowJustify: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
    flexShrink: 1,
  },
  studentRoom: {
    fontSize: 14,
    color: '#606770',
  },
  studentPhone: {
    fontSize: 14,
    color: '#606770',
  },
  studentJoinDate: {
    fontSize: 13,
    color: '#606770',
  },
  badgeSpacer: {
    flex: 1,
  },
  paidBadge: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paid: {
    color: '#10B981', // green
  },
  unpaid: {
    color: '#FF4C4C', // red
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#606770',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  floatingFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
  },
  filterDropdownBare: {
    zIndex: 1000,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    minWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  filterDropdownBareItem: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  filterDropdownBareText: {
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontWeight: '400',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  filterDropdownBareTextSelected: {
    color: '#4B9EFF',
    fontWeight: 'bold',
  },
  filterDropdownBareItemSelected: {
    backgroundColor: '#E8F2FF',
    borderRadius: 8,
  },
  filterDropdownTightContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 0,
    width: 'auto',
  },
}); 