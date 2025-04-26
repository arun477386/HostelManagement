import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/AuthContext';
import { getRecentActivities } from '../services/firestoreService';
import { format } from 'date-fns';
import { useHostelStore } from '../services/hostelStore';
import HostelSelectorModal from '../components/HostelSelectorModal';

// Helper to get icon and color based on activity type
const getActivityIconAndColor = (type: string) => {
  switch (type) {
    case 'student_added':
      return { icon: 'person-add-outline', color: '#10B981' };
    case 'hostel_added':
      return { icon: 'business-outline', color: '#4B9EFF' };
    default:
      return { icon: 'information-circle-outline', color: '#6B7280' };
  }
};

export default function RecentActivitiesScreen() {
  const { user } = useAuth();
  const hostels = useHostelStore(state => state.hostels);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState<'all' | string>('all');
  const router = useRouter();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (!user) return;
        const allActivities = await getRecentActivities(user.uid, 50); // Fetch up to 50
        setActivities(allActivities);
      } catch (error) {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [user]);

  // Filter activities based on selected hostel
  const filteredActivities = selectedHostelId === 'all'
    ? activities
    : activities.filter(a => a.hostelId === selectedHostelId);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4B9EFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>All Recent Activities</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter-outline" size={22} color="#4B9EFF" />
        </TouchableOpacity>
      </View>
      {/* Filter Modal */}
      <HostelSelectorModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        hostels={[{ id: 'all', name: 'All Hostels' }, ...hostels]}
        selectedHostelId={selectedHostelId}
        onSelect={setSelectedHostelId}
      />
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator color="#4B9EFF" />
        ) : filteredActivities.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          filteredActivities.map((activity, index) => {
            const { icon, color } = getActivityIconAndColor(activity.type);
            return (
              <View key={activity.id || index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: color }]}> 
                  <Ionicons name={icon as any} size={16} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.message}</Text>
                  <Text style={styles.activityTime}>
                    {format(new Date(activity.createdAt), 'MMM dd, h:mm a')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
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
    padding: 24,
    minWidth: 250,
    alignItems: 'center',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F2FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownItemTextSelected: {
    color: '#4B9EFF',
    fontWeight: 'bold',
  },
}); 