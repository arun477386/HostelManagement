import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { useHostelStore } from '../services/hostelStore';
import { format } from 'date-fns';
import HostelSelectorModal from '../components/HostelSelectorModal';
import { useToast } from '../contexts/ToastContext';
import { getOwnerDocument } from '../services/firestoreService';
import { getStudentPaidStatus } from '../utils/finance';
import { useRouter } from 'expo-router';
import { useAppData } from '../contexts/AppDataContext';

interface Student {
  id: string;
  fullName: string;
  phone: string;
  joinDate: string;
  hostelId: string;
  roomId: string;
  feeAmount: number;
}

interface HostelOption {
  id: string;
  name: string;
}

export default function DuePaymentsScreen() {
  const { user } = useAuth();
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const { students, hostels: rawHostels, loading } = useAppData();
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();
  const router = useRouter();

  // Map hostels to always include id and name for UI
  const hostels = [{ id: 'all', name: 'All Hostels' }, ...(rawHostels || []).map((h: any) => ({ id: h.id, name: h.name }))];

  const filteredStudents = students.filter(student => {
    const paidStatus = getStudentPaidStatus(student);
    const searchLower = searchQuery.toLowerCase();
    return paidStatus === 'Unpaid' && (
      student.fullName.toLowerCase().includes(searchLower) ||
      student.phone.includes(searchQuery)
    );
  });

  const renderStudentItem = ({ item }: { item: Student }) => {
    const hostelObj = hostels.find(h => h.id === item.hostelId);
    const hostelName = hostelObj ? hostelObj.name : '';
    const paidStatus = getStudentPaidStatus(item);
    return (
      <TouchableOpacity 
        style={styles.studentRow}
        onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}
      >
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.fullName}</Text>
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
          </View>
          <View style={styles.paymentStatus}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.paymentStatusText}>
              Due: ₹{item.feeAmount}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4B9EFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Due Payments</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter-outline" size={22} color="#4B9EFF" />
        </TouchableOpacity>
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
              <Ionicons name="checkmark-circle-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No due payments</Text>
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
  backButton: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterButton: {
    padding: 4,
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
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
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
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
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
}); 