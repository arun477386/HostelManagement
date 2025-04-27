import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { useHostelStore } from '../../services/hostelStore';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import HostelSelectorModal from '../../components/HostelSelectorModal';
import { useToast } from '../../contexts/ToastContext';
import { getOwnerDocument } from '../../services/firestoreService';
import { getStudentPaidStatus } from '../../utils/finance';
import { useRouter } from 'expo-router';
import { useAppData } from '../../contexts/AppDataContext';

interface Student {
  id: string;
  fullName: string;
  phone: string;
  joinDate: string;
  hostelId: string;
  roomId: string;
  isActive: boolean;
}

interface HostelOption {
  id: string;
  name: string;
}

// Memoized helper function to calculate due date
const calculateDueDate = (joinDate: string) => {
  const joinDateObj = new Date(joinDate);
  const day = joinDateObj.getDate();
  const dueDate = new Date(joinDateObj);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(day);
  return dueDate;
};

// Memoized StudentItem component
const StudentItem = React.memo(({ 
  item, 
  hostelName, 
  onPress 
}: { 
  item: Student; 
  hostelName: string; 
  onPress: () => void;
}) => {
  const paidStatus = getStudentPaidStatus(item);
  const dueDate = useMemo(() => calculateDueDate(item.joinDate), [item.joinDate]);
  
  return (
    <TouchableOpacity 
      style={styles.studentRow}
      onPress={onPress}
    >
      <View style={styles.studentInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.studentName} numberOfLines={1} ellipsizeMode="tail">{item.fullName}</Text>
          <View style={styles.paymentStatus}>
            <Ionicons name={paidStatus === 'Paid' ? "checkmark-circle" : "alert-circle"} size={16} color={paidStatus === 'Paid' ? "#10B981" : "#EF4444"} />
            <Text style={[styles.paymentStatusText, paidStatus === 'Paid' ? styles.paid : styles.unpaid]}>
              {paidStatus === 'Paid' ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </View>
        <Text style={styles.studentDetails}>
          {hostelName} • Room {item.roomId}
        </Text>
        <View style={styles.studentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>
              Joined {format(new Date(item.joinDate), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#F87171" />
            <Text style={[styles.metaText, styles.dueDateText]}>
              Due {format(dueDate, 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );
});

export default function SearchScreen() {
  const { user } = useAuth();
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const { students, hostels: rawHostels, loading } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isPaymentFilterVisible, setIsPaymentFilterVisible] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  // Memoize hostels array
  const hostels = useMemo(() => 
    [{ id: 'all', name: 'All Hostels' }, ...(rawHostels || []).map((h: any) => ({ id: h.id, name: h.name }))],
    [rawHostels]
  );

  // Memoize filtered students
  const filteredStudents = useMemo(() => 
    students.filter(student => {
      // Only process active students
      if (!student.isActive) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = student.fullName.toLowerCase().includes(searchLower) ||
        student.phone.includes(searchQuery);
      const matchesHostel = selectedHostelId === 'all' || student.hostelId === selectedHostelId;
      const paidStatus = getStudentPaidStatus(student);
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && paidStatus === 'Paid') ||
        (paymentFilter === 'unpaid' && paidStatus === 'Unpaid');
      return matchesSearch && matchesHostel && matchesPayment;
    }),
    [students, searchQuery, selectedHostelId, paymentFilter]
  );

  // Memoize renderItem function
  const renderStudentItem = useCallback(({ item }: { item: Student }) => {
    const hostelObj = hostels.find(h => h.id === item.hostelId);
    const hostelName = hostelObj ? hostelObj.name : '';
    
    return (
      <StudentItem
        item={item}
        hostelName={hostelName}
        onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}
      />
    );
  }, [hostels, router]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Search Students</Text>
        <View style={styles.topBarButtons}>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons name="business-outline" size={22} color="#4B9EFF" />
          </TouchableOpacity>
          <View style={styles.paymentFilterContainer}>
            <TouchableOpacity 
              style={[styles.paymentFilterButton, isPaymentFilterVisible && styles.paymentFilterButtonActive]} 
              onPress={() => setIsPaymentFilterVisible(!isPaymentFilterVisible)}
            >
              <Text style={styles.paymentFilterText}>
                {paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)}
              </Text>
              <Ionicons 
                name={isPaymentFilterVisible ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#4B9EFF" 
              />
            </TouchableOpacity>
            {isPaymentFilterVisible && (
              <View style={styles.paymentFilterDropdown}>
                <TouchableOpacity 
                  style={[styles.paymentFilterOption, paymentFilter === 'all' && styles.paymentFilterOptionSelected]}
                  onPress={() => {
                    setPaymentFilter('all');
                    setIsPaymentFilterVisible(false);
                  }}
                >
                  <Text style={[styles.paymentFilterOptionText, paymentFilter === 'all' && styles.paymentFilterOptionTextSelected]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.paymentFilterOption, paymentFilter === 'paid' && styles.paymentFilterOptionSelected]}
                  onPress={() => {
                    setPaymentFilter('paid');
                    setIsPaymentFilterVisible(false);
                  }}
                >
                  <Text style={[styles.paymentFilterOptionText, paymentFilter === 'paid' && styles.paymentFilterOptionTextSelected]}>
                    Paid
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.paymentFilterOption, paymentFilter === 'unpaid' && styles.paymentFilterOptionSelected]}
                  onPress={() => {
                    setPaymentFilter('unpaid');
                    setIsPaymentFilterVisible(false);
                  }}
                >
                  <Text style={[styles.paymentFilterOptionText, paymentFilter === 'unpaid' && styles.paymentFilterOptionTextSelected]}>
                    Unpaid
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Students List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9EFF" />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      )}

      <HostelSelectorModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        hostels={hostels}
        selectedHostelId={selectedHostelId}
        onSelect={setSelectedHostelId}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterButton: {
    padding: 4,
  },
  smallButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  studentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  paymentStatusText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  paid: {
    color: '#10B981',
  },
  unpaid: {
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  dueDateText: {
    color: '#F87171', // Light red color
  },
  paymentFilterContainer: {
    position: 'relative',
  },
  paymentFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  paymentFilterButtonActive: {
    backgroundColor: '#D1E5FF',
  },
  paymentFilterText: {
    color: '#4B9EFF',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentFilterDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 100,
  },
  paymentFilterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  paymentFilterOptionSelected: {
    backgroundColor: '#E8F2FF',
  },
  paymentFilterOptionText: {
    color: '#1F2937',
    fontSize: 14,
  },
  paymentFilterOptionTextSelected: {
    color: '#4B9EFF',
    fontWeight: '500',
  },
}); 