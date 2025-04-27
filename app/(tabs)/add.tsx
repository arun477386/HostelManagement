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
import { Student as SchemaStudent } from '../../types/hostelSchema';
import { differenceInMonths, parseISO, format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getStudentPaidStatus } from '../../utils/finance';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { useActivityContext } from '../../services/ActivityContext';
import HostelSelectorModal from '../../components/HostelSelectorModal';
import { useToast } from '../../contexts/ToastContext';
import { useAppData } from '../../contexts/AppDataContext';

type SharingType = '1' | '2' | '3' | '4' | '5' | 'other';

interface Student extends SchemaStudent {
  id: string;
  hostelId: string;
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
  const { hostels: rawHostels, students, refresh } = useAppData();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    hostelId: selectedHostelId !== 'all' ? selectedHostelId : '',
    roomId: '',
    sharingType: '4',
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
  const [roomRegistry, setRoomRegistry] = useState<{
    [roomNumber: string]: {
      sharingType: SharingType;
      maxCapacity: number;
      currentStudents: number;
    };
  }>({});

  // Map hostels to always include id and name for UI
  const hostels = [{ id: 'all', name: 'All Hostels' }, ...(rawHostels || []).map((h: any) => ({ id: h.id, name: h.name }))];

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      hostelId: selectedHostelId !== 'all' ? selectedHostelId : '',
      roomId: '',
      sharingType: '4',
      joinDate: new Date(),
      feeAmount: '',
      joiningAdvance: '',
    });
    setErrors({});
  };

  // Function to check and update room registry
  const updateRoomRegistry = (roomNumber: string, sharingType?: SharingType) => {
    if (!roomNumber) return;

    const existingRoom = roomRegistry[roomNumber];
    
    if (existingRoom) {
      // Room exists, update form data with stored sharing type
      setFormData(prev => ({
        ...prev,
        sharingType: existingRoom.sharingType
      }));
      return existingRoom;
    } else if (sharingType) {
      // New room, add to registry
      const newRoom = {
        sharingType,
        maxCapacity: parseInt(sharingType),
        currentStudents: 0
      };
      setRoomRegistry(prev => ({
        ...prev,
        [roomNumber]: newRoom
      }));
      return newRoom;
    }
    return null;
  };

  // Handle room number change
  const handleRoomNumberChange = (roomNumber: string) => {
    setFormData(prev => ({ ...prev, roomId: roomNumber }));
    const roomData = updateRoomRegistry(roomNumber);
    
    if (roomData) {
      // Check if room is full
      if (roomData.currentStudents >= roomData.maxCapacity) {
        setErrors(prev => ({
          ...prev,
          roomId: `Room ${roomNumber} is full`
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.roomId;
          return newErrors;
        });
      }
    } else {
      // New room, clear any room-related errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.roomId;
        return newErrors;
      });
    }
  };

  // Handle sharing type change
  const handleSharingTypeChange = (sharingType: SharingType) => {
    if (!formData.roomId) {
      setFormData(prev => ({ ...prev, sharingType }));
      return;
    }

    const existingRoom = roomRegistry[formData.roomId];
    if (!existingRoom) {
      // Only allow sharing type change for new rooms
      setFormData(prev => ({ ...prev, sharingType }));
      updateRoomRegistry(formData.roomId, sharingType);
    }
  };

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

    // Check room capacity
    const roomData = roomRegistry[formData.roomId];
    if (roomData && roomData.currentStudents >= roomData.maxCapacity) {
      newErrors.roomId = `Room ${formData.roomId} is full`;
    }

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
          capacity: parseInt(formData.sharingType) || 4,
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

      // Update room registry
      setRoomRegistry(prev => ({
        ...prev,
        [formData.roomId]: {
          ...prev[formData.roomId],
          currentStudents: (prev[formData.roomId]?.currentStudents || 0) + 1
        }
      }));

      // Show success toast
      showToast('Student added successfully', 'success');

      // Reset form and close modal
      resetForm();
      setIsAddModalVisible(false);

      // Add activity
      const hostelName = hostels.find(h => h.id === formData.hostelId)?.name || '';
      await addRecentActivity(user.uid, {
        type: 'student_added',
        message: `${formData.fullName} joined ${hostelName}`,
        hostelId: formData.hostelId,
        studentId: studentId,
        createdAt: new Date().toISOString(),
      });

      // Refresh all data
      if (typeof window !== 'undefined') {
        // Refresh AppDataContext
        await refresh();
        
        // Trigger activity refresh
        triggerRefresh();
      }
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
    // Only show active students
    if (!student.isActive) return false;
    
    // Filter by hostel
    const matchesHostel = selectedHostelId === 'all' || student.hostelId === selectedHostelId;
    return matchesHostel;
  });

  const renderStudentCard = ({ item }: { item: Student }) => {
    const hostelObj = hostels.find(h => h.id === item.hostelId);
    const hostelName = hostelObj ? hostelObj.name : '';
    
    return (
      <TouchableOpacity 
        style={styles.studentCard}
        onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}
      >
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
        {/* Line 3: Join Date + Hostel Name */}
        <View style={styles.studentCardRow}>
          <Ionicons name="calendar-outline" size={16} color="#606770" style={{ marginRight: 4 }} />
          <Text style={styles.studentJoinDate}>
            Joined: {new Date(item.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <View style={styles.badgeSpacer} />
          <Text style={styles.hostelName}>
            {hostelName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
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
              onPress={() => {
                setIsAddModalVisible(false);
                resetForm();
              }}
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
                      onChangeText={(text) => handleRoomNumberChange(text)}
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
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.datePickerModal}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <Text style={styles.datePickerTitle}>Select Join Date</Text>
                          <TouchableOpacity
                            style={styles.datePickerCloseButton}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Ionicons name="close" size={24} color="#6B7280" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.datePickerMonthSelector}>
                          <TouchableOpacity
                            style={styles.datePickerMonthButton}
                            onPress={() => {
                              const newDate = new Date(formData.joinDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setFormData({ ...formData, joinDate: newDate });
                            }}
                          >
                            <Ionicons name="chevron-back" size={24} color="#4B9EFF" />
                          </TouchableOpacity>
                          <Text style={styles.datePickerMonthText}>
                            {format(formData.joinDate, 'MMMM yyyy')}
                          </Text>
                          <TouchableOpacity
                            style={styles.datePickerMonthButton}
                            onPress={() => {
                              const newDate = new Date(formData.joinDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setFormData({ ...formData, joinDate: newDate });
                            }}
                          >
                            <Ionicons name="chevron-forward" size={24} color="#4B9EFF" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.datePickerWeekDays}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <Text key={day} style={styles.datePickerWeekDay}>{day}</Text>
                          ))}
                        </View>

                        <View style={styles.datePickerDays}>
                          {eachDayOfInterval({
                            start: startOfMonth(formData.joinDate),
                            end: endOfMonth(formData.joinDate)
                          }).map((date) => {
                            const isSelected = date.getDate() === formData.joinDate.getDate() &&
                                             date.getMonth() === formData.joinDate.getMonth() &&
                                             date.getFullYear() === formData.joinDate.getFullYear();
                            const isDisabled = date > new Date();

                            return (
                              <TouchableOpacity
                                key={date.toISOString()}
                                style={[
                                  styles.datePickerDay,
                                  isSelected && styles.datePickerDaySelected,
                                  isDisabled && styles.datePickerDayDisabled
                                ]}
                                onPress={() => {
                                  if (!isDisabled) {
                                    setFormData({ ...formData, joinDate: date });
                                  }
                                }}
                                disabled={isDisabled}
                              >
                                <Text style={[
                                  styles.datePickerDayText,
                                  isSelected && styles.datePickerDayTextSelected
                                ]}>
                                  {date.getDate()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <View style={styles.datePickerActions}>
                          <TouchableOpacity
                            style={[styles.datePickerActionButton, styles.datePickerCancelButton]}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={[styles.datePickerActionText, styles.datePickerCancelText]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.datePickerActionButton, styles.datePickerConfirmButton]}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={[styles.datePickerActionText, styles.datePickerConfirmText]}>Confirm</Text>
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
                  placeholder="₹ Enter monthly fee"
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
                  placeholder="₹ Enter joining advance amount"
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
                  handleSharingTypeChange(type as SharingType);
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
  hostelName: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePickerCloseButton: {
    padding: 8,
  },
  datePickerMonthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerMonthText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  datePickerMonthButton: {
    padding: 8,
  },
  datePickerWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datePickerWeekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  datePickerDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 0,
  },
  datePickerDay: {
    width: '14.28%', // 100% / 7 days
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  datePickerDayText: {
    fontSize: 16,
    color: '#1F2937',
  },
  datePickerDaySelected: {
    backgroundColor: '#4B9EFF',
    borderRadius: 20,
  },
  datePickerDayTextSelected: {
    color: '#FFFFFF',
  },
  datePickerDayDisabled: {
    opacity: 0.3,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  datePickerActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  datePickerActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  datePickerCancelText: {
    color: '#6B7280',
  },
  datePickerConfirmButton: {
    backgroundColor: '#4B9EFF',
  },
  datePickerConfirmText: {
    color: '#FFFFFF',
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