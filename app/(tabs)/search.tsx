import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { useHostelStore } from '../../services/hostelStore';
import { format } from 'date-fns';
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
}

interface HostelOption {
  id: string;
  name: string;
}

export default function SearchScreen() {
  const { user } = useAuth();
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const { students, hostels: rawHostels, loading } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHostelDropdownOpen, setIsHostelDropdownOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  // Map hostels to always include id and name for UI
  const hostels = [{ id: 'all', name: 'All Hostels' }, ...(rawHostels || []).map((h: any) => ({ id: h.id, name: h.name }))];

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(searchLower) ||
      student.phone.includes(searchQuery)
    );
  });

  const renderStudentItem = ({ item }: { item: Student }) => {
    const hostelObj = hostels.find(h => h.id === item.hostelId);
    const hostelName = hostelObj ? hostelObj.name : '';
    return (
      <TouchableOpacity onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}>
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
          {/* Line 3: Join Date + Hostel Name */}
          <View style={styles.studentCardRow}>
            <Ionicons name="calendar-outline" size={16} color="#606770" style={{ marginRight: 4 }} />
            <Text style={styles.studentJoinDate}>
              Joined: {format(new Date(item.joinDate), 'MMM d, yyyy')}
            </Text>
            <View style={styles.badgeSpacer} />
            <Text style={styles.hostelNameSmall}>{hostelName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedHostel = hostels.find(h => h.id === selectedHostelId);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.hostelFilter}
          onPress={() => setIsHostelDropdownOpen(true)}
        >
          <Ionicons name="business-outline" size={20} color="#4B9EFF" />
          <Text style={styles.hostelFilterText} numberOfLines={1} ellipsizeMode="tail">
            {selectedHostel ? selectedHostel.name : ''}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#4B9EFF" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Student List */}
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

      {/* Hostel Selector Modal */}
      <HostelSelectorModal
        visible={isHostelDropdownOpen}
        onClose={() => setIsHostelDropdownOpen(false)}
        hostels={hostels}
        selectedHostelId={selectedHostelId}
        onSelect={(id) => {
          setSelectedHostelId(id);
          setIsHostelDropdownOpen(false);
        }}
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  hostelFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    flexBasis: '50%',
    minWidth: 0,
    maxWidth: '50%',
  },
  hostelFilterText: {
    color: '#4B9EFF',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 6,
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  searchContainer: {
    flexBasis: '50%',
    minWidth: 0,
    maxWidth: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  hostelNameSmall: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 8,
    maxWidth: 90,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
}); 