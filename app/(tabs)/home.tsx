import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Modal } from 'react-native';
import { router } from 'expo-router';
import { auth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useHostelStore } from '../../services/hostelStore';
import { useState, useEffect } from 'react';
import { getOwnerDocument } from '../../services/firestoreService';
import { Owner } from '../../types/hostelSchema';

export default function Home() {
  const ownerName = "Ravi"; // This would come from your auth/user context
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hostels, setHostels] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'All Hostels' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;

        // Convert hostels object to array format
        const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
          id,
          name: hostel.name,
        }));

        // Add "All Hostels" option
        setHostels([{ id: 'all', name: 'All Hostels' }, ...hostelsArray]);
      } catch (error) {
        console.error('Error fetching hostels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHostels();
  }, []);

  // Calculate stats based on selected hostel
  const calculateStats = () => {
    if (selectedHostelId === 'all') {
      // Calculate totals across all hostels
      return {
        totalHostels: hostels.length - 1, // Subtract 1 for "All Hostels" option
        totalStudents: 0, // TODO: Calculate from all hostels
        duesToday: 0, // TODO: Calculate from all hostels
        pendingFees: 0, // TODO: Calculate from all hostels
        newJoins: 0, // TODO: Calculate from all hostels
        vacantRooms: 0, // TODO: Calculate from all hostels
        overduePayments: 0 // TODO: Calculate from all hostels
      };
    } else {
      // Get stats for selected hostel
      return {
        totalHostels: 1,
        totalStudents: 0, // TODO: Get from selected hostel
        duesToday: 0, // TODO: Get from selected hostel
        pendingFees: 0, // TODO: Get from selected hostel
        newJoins: 0, // TODO: Get from selected hostel
        vacantRooms: 0, // TODO: Get from selected hostel
        overduePayments: 0 // TODO: Get from selected hostel
      };
    }
  };

  const stats = calculateStats();

  const selectedHostel = hostels.find(h => h.id === selectedHostelId) || hostels[0];

  const recentActivities = [
    { type: 'payment', text: 'Ravi paid ₹6000 for Room 202', time: '2h ago' },
    { type: 'join', text: 'Preeti joined Shanti PG', time: 'yesterday' },
    { type: 'room', text: 'Room 101 marked full', time: '3d ago' }
  ];

  const notifications = [
    { type: 'warning', text: '5 students have not paid May rent' },
    { type: 'calendar', text: 'License expires on June 10' },
    { type: 'feedback', text: 'New student feedback received' }
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => {}} />
      }
    >
      {/* Header: Owner Summary */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Good Morning, {ownerName} 👋</Text>
            {!loading && (
              <TouchableOpacity 
                style={styles.hostelSelector}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Ionicons name="business-outline" size={16} color="#4B9EFF" />
                <Text style={styles.hostelText}>{selectedHostel?.name || 'All Hostels'}</Text>
                <Ionicons 
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#4B9EFF" 
                />
              </TouchableOpacity>
            )}
          </View>
          {!loading && (
            <Text style={styles.summary}>
              You have {stats.totalHostels} hostels, {stats.totalStudents} students, {stats.duesToday} dues today
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownList}>
            {hostels.map((hostel) => (
              <TouchableOpacity
                key={hostel.id}
                style={[
                  styles.dropdownItem,
                  selectedHostelId === hostel.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedHostelId(hostel.id);
                  setIsDropdownOpen(false);
                }}
              >
                <Ionicons 
                  name="business-outline" 
                  size={16} 
                  color={selectedHostelId === hostel.id ? "#4B9EFF" : "#6B7280"} 
                />
                <Text style={[
                  styles.dropdownItemText,
                  selectedHostelId === hostel.id && styles.dropdownItemTextSelected
                ]}>
                  {hostel.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dashboard Cards Grid */}
      <View style={styles.dashboardGrid}>
        <View style={styles.card}>
          <Ionicons name="people-outline" size={24} color="#4B9EFF" />
          <Text style={styles.cardValue}>{stats.totalStudents}</Text>
          <Text style={styles.cardTitle}>Active Students</Text>
          <Text style={styles.cardTrend}>+4 this week 📈</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="wallet-outline" size={24} color="#FF4C4C" />
          <Text style={styles.cardValue}>₹{stats.pendingFees}</Text>
          <Text style={styles.cardTitle}>Pending Fees</Text>
          <Text style={styles.cardTrend}>{stats.duesToday} overdue</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="person-add-outline" size={24} color="#4B9EFF" />
          <Text style={styles.cardValue}>{stats.newJoins}</Text>
          <Text style={styles.cardTitle}>New Joins</Text>
          <Text style={styles.cardTrend}>This week</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="business-outline" size={24} color="#4B9EFF" />
          <Text style={styles.cardValue}>{stats.totalHostels}</Text>
          <Text style={styles.cardTitle}>Total Hostels</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="bed-outline" size={24} color="#4B9EFF" />
          <Text style={styles.cardValue}>{stats.vacantRooms}</Text>
          <Text style={styles.cardTitle}>Vacant Rooms</Text>
          <Text style={styles.cardTrend}>Tap to assign</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="alert-circle-outline" size={24} color="#FF4C4C" />
          <Text style={styles.cardValue}>{stats.overduePayments}</Text>
          <Text style={styles.cardTitle}>Overdue Payments</Text>
        </View>
      </View>

      {/* Recent Activity Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) }]}>
                <Ionicons 
                  name={getActivityIcon(activity.type)} 
                  size={16} 
                  color="white" 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notificationList}>
          {notifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <Ionicons 
                name={getNotificationIcon(notification.type)} 
                size={20} 
                color={getNotificationColor(notification.type)} 
              />
              <Text style={styles.notificationText}>{notification.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Last synced 2 mins ago</Text>
      </View>
    </ScrollView>
  );
}

// Helper functions for icons and colors
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'payment': return 'card-outline';
    case 'join': return 'person-add-outline';
    case 'room': return 'bed-outline';
    default: return 'information-circle-outline';
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'payment': return '#4B9EFF';
    case 'join': return '#10B981';
    case 'room': return '#F59E0B';
    default: return '#6B7280';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning': return 'alert-circle-outline';
    case 'calendar': return 'calendar-outline';
    case 'feedback': return 'chatbubble-outline';
    default: return 'information-circle-outline';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'warning': return '#FF4C4C';
    case 'calendar': return '#4B9EFF';
    case 'feedback': return '#10B981';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardTrend: {
    fontSize: 12,
    color: '#4B9EFF',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    color: '#4B9EFF',
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  notificationList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  hostelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  hostelText: {
    fontSize: 14,
    color: '#4B9EFF',
    fontWeight: '500',
    marginHorizontal: 6,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  dropdownItemTextSelected: {
    color: '#4B9EFF',
    fontWeight: '500',
  },
}); 