import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { auth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useHostelStore } from '../../services/hostelStore';
import { useState, useEffect } from 'react';
import { getOwnerDocument, addRecentActivity, getRecentActivities } from '../../services/firestoreService';
import { Owner } from '../../types/hostelSchema';
import { useHostelFinanceData } from '../../hooks/useHostelFinanceData';
import { getStudentPaidStatus } from '../../utils/finance';
import { format } from 'date-fns';
import { useActivityContext } from '../../services/ActivityContext';
import { useRouter } from 'expo-router';
import HostelSelectorModal from '../../components/HostelSelectorModal';

interface Hostel {
  id: string;
  name: string;
  totalStudents: number;
  duesToday: number;
  pendingFees: number;
  newJoins: number;
  vacantRooms: number;
  overduePayments: number;
}

interface AllHostelsOption {
  id: 'all';
  name: 'All Hostels';
}

// Helper functions to calculate stats
const calculateDuesToday = (hostel: any) => {
  // Count students with fees due today
  return Object.values(hostel.students || {}).reduce((count: number, student: any) => {
    const dueDate = new Date(student.nextDueDate);
    const today = new Date();
    return count + (dueDate.toDateString() === today.toDateString() ? 1 : 0);
  }, 0);
};

const calculatePendingFees = (hostel: any) => {
  // Sum all pending fees
  return Object.values(hostel.students || {}).reduce((sum: number, student: any) => {
    return sum + (student.pendingFees || 0);
  }, 0);
};

const calculateNewJoins = (hostel: any) => {
  // Count students who joined in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return Object.values(hostel.students || {}).reduce((count: number, student: any) => {
    const joinDate = new Date(student.joinDate);
    return count + (joinDate >= oneWeekAgo ? 1 : 0);
  }, 0);
};

const calculateVacantRooms = (hostel: any) => {
  // Count rooms that are not full
  return Object.values(hostel.rooms || {}).reduce((count: number, room: any) => {
    return count + (!room.isFull ? 1 : 0);
  }, 0);
};

const calculateOverduePayments = (hostel: any) => {
  // Count students with overdue payments
  const today = new Date();
  return Object.values(hostel.students || {}).reduce((count: number, student: any) => {
    const dueDate = new Date(student.nextDueDate);
    return count + (dueDate < today ? 1 : 0);
  }, 0);
};

// Helper to calculate total collected and pending fees
const calculateAmountStats = (hostels: any[], selectedHostelId: string) => {
  let totalCollected = 0;
  let totalPending = 0;

  const processStudentPayments = (students: any) => {
    Object.values(students || {}).forEach((student: any) => {
      if (student.payments) {
        Object.values(student.payments).forEach((payment: any) => {
          if (payment.status === 'paid') {
            totalCollected += payment.amount || 0;
          } else if (payment.status === 'unpaid') {
            totalPending += payment.amount || 0;
          }
        });
      }
    });
  };

  if (selectedHostelId === 'all') {
    hostels.forEach((hostel: any) => {
      if (hostel.id !== 'all' && hostel.students) {
        processStudentPayments(hostel.students);
      }
    });
  } else {
    const hostel = hostels.find((h: any) => h.id === selectedHostelId);
    if (hostel && hostel.students) {
      processStudentPayments(hostel.students);
    }
  }

  return { totalCollected, totalPending };
};

// Helper to calculate finance data for a hostel
function calculateHostelFinanceData(students: Record<string, any>) {
  let amountCollected = 0;
  let pendingFees = 0;
  Object.values(students || {}).forEach((student: any) => {
    Object.values(student.payments || {}).forEach((payment: any) => {
      if (payment.status === 'paid') {
        amountCollected += payment.amount || 0;
      } else if (payment.status === 'unpaid') {
        pendingFees += payment.dueAmount || 0;
      }
    });
  });
  return { amountCollected, pendingFees };
}

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

export default function Home() {
  const ownerName = "Ravi"; // This would come from your auth/user context
  const { selectedHostelId, setSelectedHostelId } = useHostelStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hostels, setHostels] = useState<(Hostel | AllHostelsOption)[]>([{ id: 'all', name: 'All Hostels' }]);
  const [loading, setLoading] = useState(true);
  const { amountCollected, pendingFees, loading: financeLoading, error: financeError } = useHostelFinanceData(selectedHostelId);
  const [dueStudents, setDueStudents] = useState<{ name: string; room: string; feeAmount: number }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const { refreshKey } = useActivityContext();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = format(new Date(), 'EEE, dd MMM yyyy');

  // Move fetchHostels out of useEffect
  const fetchHostels = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ownerDoc = await getOwnerDocument(user.uid);
      if (!ownerDoc) return;
      const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
        id,
        name: hostel.name,
        totalStudents: Object.keys(hostel.students || {}).length,
        duesToday: calculateDuesToday(hostel),
        pendingFees: calculatePendingFees(hostel),
        newJoins: calculateNewJoins(hostel),
        vacantRooms: calculateVacantRooms(hostel),
        overduePayments: calculateOverduePayments(hostel),
      })) as Hostel[];
      if (hostelsArray.length > 0) {
        setSelectedHostelId(hostelsArray[0].id);
      }
      setHostels([{ id: 'all', name: 'All Hostels' } as AllHostelsOption, ...hostelsArray]);
    } catch (error) {
      console.error('Error fetching hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Move fetchDueStudents out of useEffect
  const fetchDueStudents = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ownerDoc = await getOwnerDocument(user.uid);
      if (!ownerDoc) return;
      let students: Record<string, any> = {};
      if (selectedHostelId === 'all') {
        Object.values(ownerDoc.hostels || {}).forEach((hostel: any) => {
          students = { ...students, ...(hostel.students || {}) };
        });
      } else {
        const hostel = ownerDoc.hostels[selectedHostelId];
        students = hostel ? hostel.students || {} : {};
      }
      const dueList = Object.values(students)
        .filter((student: any) => getStudentPaidStatus(student) === 'Unpaid')
        .map((student: any) => ({
          name: student.fullName,
          room: student.roomId,
          feeAmount: student.feeAmount,
        }));
      setDueStudents(dueList);
    } catch {
      setDueStudents([]);
    }
  };

  // Move fetchActivities out of useEffect
  const fetchActivities = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const recentActivities = await getRecentActivities(user.uid);
      if (!recentActivities || recentActivities.length === 0) {
        setActivities([]);
      } else {
        setActivities(recentActivities);
      }
    } catch (error) {
      setActivities([]);
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    fetchDueStudents();
  }, [selectedHostelId, loading]);

  useEffect(() => {
    fetchActivities();
  }, [refreshKey]);

  // Calculate stats based on selected hostel
  const calculateStats = () => {
    try {
      const selectedHostel = hostels.find(h => h.id === selectedHostelId);
      if (!selectedHostel || selectedHostelId === 'all') {
        // Calculate totals across all hostels
        const allHostels = hostels.filter((h): h is Hostel => h.id !== 'all');
        return {
          totalHostels: allHostels.length,
          totalStudents: allHostels.reduce((sum, h) => sum + h.totalStudents, 0),
          duesToday: allHostels.reduce((sum, h) => sum + h.duesToday, 0),
          pendingFees: allHostels.reduce((sum, h) => sum + h.pendingFees, 0),
          newJoins: allHostels.reduce((sum, h) => sum + h.newJoins, 0),
          vacantRooms: allHostels.reduce((sum, h) => sum + h.vacantRooms, 0),
          overduePayments: allHostels.reduce((sum, h) => sum + h.overduePayments, 0)
        };
      } else {
        const hostel = selectedHostel as Hostel;
        // Get stats for selected hostel
        return {
          totalHostels: 1,
          totalStudents: hostel.totalStudents,
          duesToday: hostel.duesToday,
          pendingFees: hostel.pendingFees,
          newJoins: hostel.newJoins,
          vacantRooms: hostel.vacantRooms,
          overduePayments: hostel.overduePayments
        };
      }
    } catch (error) {
      // Return default values if there's an error
      return {
        totalHostels: 0,
        totalStudents: 0,
        duesToday: 0,
        pendingFees: 0,
        newJoins: 0,
        vacantRooms: 0,
        overduePayments: 0
      };
    }
  };

  const stats = calculateStats();
  const selectedHostel = hostels.find(h => h.id === selectedHostelId) || hostels[0];
  const { totalCollected, totalPending } = calculateAmountStats(hostels, selectedHostelId);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch hostels
      await fetchHostels();
      // Re-fetch due students
      await fetchDueStudents();
      // Re-fetch activities
      await fetchActivities();
    } catch (e) {
      // Optionally handle error
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header: Owner Summary */}
      <View style={styles.header}>
        <View style={styles.headerContentFlex}>
          {!loading && (
            <TouchableOpacity 
              style={styles.hostelSelector}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Ionicons name="business-outline" size={16} color="#4B9EFF" />
              <Text
                style={styles.hostelText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedHostel?.name || 'All Hostels'}
              </Text>
              <Ionicons 
                name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#4B9EFF" 
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerRightRowSmall}>
          <Text style={styles.dateText}>{todayStr}</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#4B9EFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount & Pending Fees Card */}
      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          <View style={styles.amountCard}>
            <Ionicons name="cash-outline" size={24} color="#4B9EFF" style={{ marginBottom: 6 }} />
            <Text style={styles.amountTitle}>Amount Collected</Text>
            <Text style={styles.amountValue}>₹{amountCollected}</Text>
          </View>
          <View style={styles.amountCard}>
            <Ionicons name="wallet-outline" size={24} color="#FF4C4C" style={{ marginBottom: 6, marginRight: 4 }} />
            <Text style={styles.amountTitle}>Pending Fees</Text>
            <Text style={styles.amountValue}>₹{pendingFees}</Text>
          </View>
        </View>
        {financeError ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{financeError}</Text> : null}
      </View>

      <HostelSelectorModal
        visible={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        hostels={hostels}
        selectedHostelId={selectedHostelId}
        onSelect={setSelectedHostelId}
      />

      {/* Dashboard Cards Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dashboardRowContainer}
        style={{ marginTop: 18, marginBottom: 8 }}
      >
        <View style={styles.dashboardRow}>
          <View style={styles.hCard}>
            <Ionicons name="people-outline" size={22} color="#4B9EFF" style={styles.hCardIcon} />
            <Text style={styles.hCardValue}>{stats.totalStudents}</Text>
            <Text style={styles.hCardLabel}>Active Students</Text>
          </View>
          <View style={styles.hCard}>
            <Ionicons name="person-add-outline" size={22} color="#4B9EFF" style={styles.hCardIcon} />
            <Text style={styles.hCardValue}>{stats.newJoins}</Text>
            <Text style={styles.hCardLabel}>New Joins</Text>
          </View>
          {selectedHostelId === 'all' && (
            <View style={styles.hCard}>
              <Ionicons name="business-outline" size={22} color="#4B9EFF" style={styles.hCardIcon} />
              <Text style={styles.hCardValue}>{stats.totalHostels}</Text>
              <Text style={styles.hCardLabel}>Total Hostels</Text>
            </View>
          )}
          <View style={styles.hCard}>
            <Ionicons name="bed-outline" size={22} color="#4B9EFF" style={styles.hCardIcon} />
            <Text style={styles.hCardValue}>{stats.vacantRooms}</Text>
            <Text style={styles.hCardLabel}>Vacant Rooms</Text>
          </View>
        </View>
      </ScrollView>

      {/* Due Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Due Payments ({dueStudents.length})</Text>
        {dueStudents.length === 0 ? (
          <Text style={styles.emptyText}>No pending payments! 🎉</Text>
        ) : (
          dueStudents.map((student, idx) => (
            <View key={idx} style={styles.dueStudentRow}>
              <Ionicons name="alert-circle-outline" size={18} color="#FF4C4C" style={{ marginRight: 8 }} />
              <Text style={styles.dueStudentName}>{student.name}</Text>
              <Text style={styles.dueStudentRoom}>Room {student.room}</Text>
              <Text style={styles.dueStudentAmount}>₹{student.feeAmount}</Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Activity Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/recent-activities')}>
            <Text style={styles.seeAllText}>See All ({activities.length})</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {loadingActivities ? (
            <ActivityIndicator color="#4B9EFF" />
          ) : activities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity</Text>
          ) : (
            activities.slice(0, 3).map((activity, index) => {
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContentFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  notificationButton: {
    padding: 4,
    marginLeft: 0,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  hostelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  hostelText: {
    fontSize: 14,
    color: '#4B9EFF',
    fontWeight: '500',
    marginHorizontal: 6,
    maxWidth: 180,
    flexShrink: 1,
  },
  headerRightRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 0,
    maxWidth: 120,
  },
  dateText: {
    fontSize: 11,
    color: '#4B9EFF',
    fontWeight: '500',
    marginRight: 4,
    flexShrink: 1,
  },
  dashboardRowContainer: {
    paddingHorizontal: 16,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hCard: {
    backgroundColor: '#F6FAFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#4B9EFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 60,
  },
  hCardIcon: {
    marginBottom: 0,
  },
  hCardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 0,
  },
  hCardLabel: {
    fontSize: 9,
    color: '#6B7280',
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
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 0,
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
  amountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountCard: {
    flex: 1,
    backgroundColor: '#E8F2FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginHorizontal: 2,
  },
  amountTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B9EFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
  dueStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dueStudentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  dueStudentRoom: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  dueStudentAmount: {
    fontSize: 14,
    color: '#FF4C4C',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
}); 