import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOwnerDocument } from '../../services/firestoreService';
import { format } from 'date-fns';
import { useAuth } from '../../services/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme/layout';
import { Hostel } from '../../types/hostelSchema';

interface Room {
  roomNumber: string;
  type: string;
  capacity: number;
  sharingType: string;
  students: string[];
  isFull: boolean;
}

export default function HostelViewScreen() {
  const { hostelId } = useLocalSearchParams();
  const { user } = useAuth();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchHostel = async () => {
      setLoading(true);
      try {
        if (!user) return;
        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;
        const h = ownerDoc.hostels[hostelId as string];
        setHostel(h);
      } catch (e) {
        setHostel(null);
      } finally {
        setLoading(false);
      }
    };
    fetchHostel();
  }, [hostelId, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hostel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color={colors.error} />
        <Text style={styles.errorText}>Hostel not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  const getStudentPaidStatus = (student: any) => {
    if (!student.feePaid) return 'Pending';
    const currentDate = new Date();
    const lastPaidDate = new Date(student.feePaid);
    const monthsSinceLastPayment = (currentDate.getFullYear() - lastPaidDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - lastPaidDate.getMonth());
    return monthsSinceLastPayment < 1 ? 'Paid' : 'Pending';
  };

  const calculateStats = () => {
    if (!hostel) return { totalRooms: 0, totalStudents: 0, availableRooms: 0, totalFees: 0, pendingFees: 0 };
    
    const totalRooms = Object.keys(hostel.rooms || {}).length;
    const totalStudents = Object.values(hostel.students || {}).filter((student: any) => student.isActive).length;
    const availableRooms = Object.values(hostel.rooms || {}).filter((room: any) => {
      const roomStudents = Object.values(hostel.students || {}).filter((student: any) => 
        student.roomId === room.roomNumber && student.isActive
      );
      return roomStudents.length < room.capacity;
    }).length;
    
    let totalFees = 0;
    let pendingFees = 0;
    Object.values(hostel.students || {}).forEach((student: any) => {
      if (!student.isActive) return;
      if (getStudentPaidStatus(student) === 'Paid') {
        totalFees += student.feeAmount || 0;
      } else {
        pendingFees += student.feeAmount || 0;
      }
    });
    
    return { totalRooms, totalStudents, availableRooms, totalFees, pendingFees };
  };

  const totalRooms = Object.keys(hostel.rooms).length;
  const totalStudents = Object.values(hostel.students || {}).filter((student: any) => student.isActive).length;
  const availableRooms = Object.values(hostel.rooms).filter((room: any) => {
    const roomStudents = Object.values(hostel.students || {}).filter((student: any) => 
      student.roomId === room.roomNumber && student.isActive
    );
    return roomStudents.length < room.capacity;
  }).length;

  const filteredRooms = Object.entries(hostel.rooms).filter(([roomNumber, room]) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    
    // Check if room exists and has required properties
    if (!room) return false;
    
    // Check room number
    if (roomNumber.toLowerCase().includes(searchLower)) return true;
    
    // Check room type if it exists
    if (room.type && room.type.toLowerCase().includes(searchLower)) return true;
    
    // Check sharing type if it exists
    if (room.sharingType && room.sharingType.toLowerCase().includes(searchLower)) return true;
    
    // Check students if they exist
    if (room.students && room.students.length > 0) {
      return room.students.some(studentId => {
        const student = hostel.students?.[studentId];
        return student && (
          (student.fullName && student.fullName.toLowerCase().includes(searchLower)) ||
          (student.phone && student.phone.includes(searchQuery))
        );
      });
    }
    
    return false;
  });

  const renderRoomCard = ({ item: [roomNumber, room] }: { item: [string, Room] }) => {
    const activeStudentsCount = Object.values(hostel.students || {}).filter((student: any) => 
      student.roomId === roomNumber && student.isActive
    ).length;
    
    const isRoomFull = activeStudentsCount >= room.capacity;
    
    return (
      <TouchableOpacity 
        style={styles.roomCard}
        onPress={() => router.push({ pathname: `/room/${roomNumber}`, params: { hostelId } })}
      >
        <View style={styles.roomHeader}>
          <View style={styles.roomNumberContainer}>
            <Ionicons name="bed-outline" size={20} color={colors.primary} />
            <Text style={styles.roomNumber}>Room {roomNumber}</Text>
          </View>
          <View style={[styles.roomStatus, isRoomFull ? styles.fullRoom : styles.availableRoom]}>
            <Ionicons 
              name={isRoomFull ? 'close-circle' : 'checkmark-circle'} 
              size={16} 
              color={isRoomFull ? colors.error : colors.success} 
            />
            <Text style={[styles.roomStatusText, isRoomFull ? styles.fullRoom : styles.availableRoom]}>
              {isRoomFull ? 'Full' : 'Available'}
            </Text>
          </View>
        </View>
        <View style={styles.roomDetails}>
          <View style={styles.roomDetailItem}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.roomDetailText}>{activeStudentsCount}/{room.capacity} Students</Text>
          </View>
          <View style={styles.roomDetailItem}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.roomDetailText}>{room.sharingType}-sharing</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{hostel.name}</Text>
          <Text style={styles.subtitle}>{hostel.location}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bed-outline" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{totalRooms}</Text>
            <Text style={styles.statLabel}>Total Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bed-outline" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{availableRooms}</Text>
            <Text style={styles.statLabel}>Available Rooms</Text>
          </View>
        </View>

        {/* Hostel Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Hostel Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="transgender-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{hostel.gender.charAt(0).toUpperCase() + hostel.gender.slice(1)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{format(new Date(hostel.createdAt), 'MMM yyyy')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{hostel.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>

        {/* Rooms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rooms</Text>
            <TouchableOpacity 
              style={styles.searchIconButton}
              onPress={() => setIsSearchVisible(!isSearchVisible)}
            >
              <Ionicons name="search-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {isSearchVisible && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search rooms..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={filteredRooms}
            renderItem={renderRoomCard}
            keyExtractor={([roomNumber]) => roomNumber}
            scrollEnabled={false}
            contentContainerStyle={styles.roomsList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="bed-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No rooms added yet</Text>
                <Text style={styles.emptySubtext}>Add rooms to start managing your hostel</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    ...typography.textBase,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    ...typography.titleLG,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.textSecondary,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    ...typography.titleLG,
    color: colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    ...typography.textSecondary,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    padding: 16,
    backgroundColor: colors.cardBackground,
    marginTop: 8,
  },
  sectionTitle: {
    ...typography.titleLG,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    padding: 8,
  },
  infoLabel: {
    ...typography.textSecondary,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoValue: {
    ...typography.textBase,
    color: colors.textPrimary,
    marginTop: 2,
  },
  section: {
    padding: 16,
    backgroundColor: colors.cardBackground,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  roomsList: {
    paddingBottom: 16,
  },
  roomCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomNumber: {
    ...typography.titleLG,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roomStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  fullRoom: {
    backgroundColor: colors.primaryLight,
    color: colors.error,
  },
  availableRoom: {
    backgroundColor: colors.primaryLight,
    color: colors.success,
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roomDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomDetailText: {
    ...typography.textSecondary,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    ...typography.titleLG,
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.textSecondary,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
}); 