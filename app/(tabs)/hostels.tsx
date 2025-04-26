import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useHostels } from '../../hooks/useHostels';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHostelStore } from '../../services/hostelStore';

interface Hostel {
  id: string;
  name: string;
  location: string;
  totalStudents: number;
  vacantRooms: number;
  pendingFees: number;
}

export default function HostelsScreen() {
  const { hostels, loading, error } = useHostels();
  const router = useRouter();
  const setSelectedHostelId = useHostelStore((state) => state.setSelectedHostelId);

  const renderHostelCard = ({ item }: { item: Hostel }) => (
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
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.hostelLocation}>{item.location}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Ionicons name="business-outline" size={24} color="#4B9EFF" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Rooms</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={24} color="#4B9EFF" />
          <Text style={styles.statValue}>{item.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="bed-outline" size={24} color="#4B9EFF" />
          <Text style={styles.statValue}>{item.vacantRooms}</Text>
          <Text style={styles.statLabel}>Vacant</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="wallet-outline" size={24} color="#4B9EFF" />
          <Text style={styles.statValue}>₹{item.pendingFees}</Text>
          <Text style={styles.statLabel}>Pending</Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
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
            <Text style={styles.addButtonText}>Add</Text>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  hostelLocation: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F8FF',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4B9EFF',
    fontWeight: '500',
  },
}); 