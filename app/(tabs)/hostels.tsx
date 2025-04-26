import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHostelStore } from '../../services/hostelStore';
import { useAuth } from '../../services/AuthContext';
import { getStudentPaidStatus } from '../../utils/finance';
import { useToast } from '../../contexts/ToastContext';

interface Hostel {
  id: string;
  name: string;
  location?: string;
  rooms?: Record<string, any>;
  students?: Record<string, any>;
  totalStudents?: number;
  vacantRooms?: number;
  pendingFees?: number;
}

export default function HostelsScreen() {
  const { user } = useAuth();
  const hostels = useHostelStore(state => state.hostels);
  const fetchHostels = useHostelStore(state => state.fetchHostels);
  const setSelectedHostelId = useHostelStore(state => state.setSelectedHostelId);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      if (user) {
        setLoading(true);
        try {
          await fetchHostels(user.uid);
        } catch (error) {
          showToast('Failed to load hostels. Please try again.', 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [user, fetchHostels]);

  const renderHostelCard = ({ item }: { item: Hostel }) => {
    // Calculate dynamic values
    const roomsCount = item.rooms ? Object.keys(item.rooms).length : 0;
    const studentsCount = item.students ? Object.keys(item.students).length : 0;
    const vacantRooms = item.rooms ? Object.values(item.rooms).filter((room: any) => !room.isFull).length : 0;
    let received = 0;
    let pending = 0;
    if (item.students) {
      Object.values(item.students).forEach((student: any) => {
        if (getStudentPaidStatus(student) === 'Paid') {
          received += student.feeAmount || 0;
        } else {
          pending += student.feeAmount || 0;
        }
      });
    }
    return (
      <TouchableOpacity
        style={styles.hostelCard}
        onPress={() => {
          setSelectedHostelId(item.id);
          router.push(`/hostel-details/${item.id}`);
        }}
      >
        {/* Hostel Name and Location */}
        <View>
          <Text style={styles.hostelName}>{item.name}</Text>
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.hostelLocation}>{item.location}</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
            <Text style={styles.statValue}>₹{received}</Text>
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={24} color="#FF4C4C" />
            <Text style={styles.statValue}>₹{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="business-outline" size={24} color="#4B9EFF" />
            <Text style={styles.statValue}>{roomsCount}</Text>
            <Text style={styles.statLabel}>Rooms</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={24} color="#4B9EFF" />
            <Text style={styles.statValue}>{studentsCount}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bed-outline" size={24} color="#4B9EFF" />
            <Text style={styles.statValue}>{vacantRooms}</Text>
            <Text style={styles.statLabel}>Vacant</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bed-outline" size={20} color="#4B9EFF" />
            <Text style={styles.actionButtonText}>Manage Rooms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={20} color="#4B9EFF" />
            <Text style={styles.actionButtonText}>View Students</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Hostels</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            router.push({
              pathname: '/createHostel',
              params: { from: 'hostels' }
            });
          }}
        >
          <View style={styles.addButtonContent}>
            <Ionicons name="business-outline" size={16} color="#4B9EFF" />
            <Text style={styles.addButtonText}>Add +</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={hostels}
        renderItem={renderHostelCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  screenTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#4B9EFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  hostelCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostelLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#4B9EFF',
    fontWeight: '500',
    marginLeft: 4,
  },
}); 