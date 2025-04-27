import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOwnerDocument } from '../../services/firestoreService';
import { useAuth } from '../../services/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { format } from 'date-fns';
import { getStudentPaidStatus } from '../../utils/finance';
import { Hostel } from '../../types/hostelSchema';
import { useAppData } from '../../contexts/AppDataContext';

interface Room {
  roomNumber: string;
  type: string;
  capacity: number;
  sharingType: string;
  students: string[];
  isFull: boolean;
}

export default function RoomViewScreen() {
  const { roomNumber, hostelId } = useLocalSearchParams();
  const { user } = useAuth();
  const { students } = useAppData();
  const [room, setRoom] = useState<Room | null>(null);
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        if (!user) return;
        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;
        const h = ownerDoc.hostels[hostelId as string];
        setHostel(h);
        if (h && h.rooms && h.rooms[roomNumber as string]) {
          setRoom(h.rooms[roomNumber as string]);
        }
      } catch (e) {
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomNumber, hostelId, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color={colors.error} />
        <Text style={styles.errorText}>Room not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={36} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  const roomStudents = students.filter(student => student.roomId === roomNumber);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={36} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={roomStudents}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <>
            <View style={styles.header}>
              <Ionicons name="bed-outline" size={64} color={colors.primary} />
              <View style={styles.titleContainer}>
                <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
                <View style={[styles.roomStatus, room.isFull ? styles.full : styles.available]}>
                  <Ionicons 
                    name={room.isFull ? 'close-circle' : 'checkmark-circle'} 
                    size={16} 
                    color={room.isFull ? colors.error : colors.success} 
                  />
                  <Text style={[styles.roomStatusText, room.isFull ? styles.full : styles.available]}>
                    {room.isFull ? 'Full' : 'Available'}
                  </Text>
                </View>
              </View>
              <View style={styles.hostelRow}>
                <Text style={styles.hostelName}>{hostel?.name || ''}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room Details</Text>
              <InfoRow label="Type" value={room.type} icon="home-outline" style={styles.infoRowSpacing} />
              <InfoRow label="Capacity" value={room.capacity.toString()} icon="people-outline" style={styles.infoRowSpacing} />
              <InfoRow label="Sharing" value={room.sharingType} icon="person-outline" style={styles.infoRowSpacing} />
            </View>
            <View style={styles.separator} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Students ({roomStudents.length}/{room.capacity})</Text>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No students in this room</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.studentRow}
            onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}
          >
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.fullName}</Text>
              <Text style={styles.studentDetails}>{item.phone}</Text>
              <View style={styles.studentMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{format(new Date(item.joinDate), 'MMM d, yyyy')}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>₹{item.feeAmount}</Text>
                </View>
              </View>
              <View style={styles.paymentStatus}>
                <Ionicons 
                  name={getStudentPaidStatus(item) === 'Paid' ? "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={getStudentPaidStatus(item) === 'Paid' ? colors.success : colors.error} 
                />
                <Text style={[styles.paymentStatusText, getStudentPaidStatus(item) === 'Paid' ? styles.paid : styles.unpaid]}>
                  {getStudentPaidStatus(item)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
}

const InfoRow = ({ label, value, icon, style }: { label: string; value: string; icon: string; style?: any }) => (
  <View style={[infoRowStyles.row, style]}>
    <Ionicons name={icon as any} size={20} color={colors.textSecondary} style={infoRowStyles.icon} />
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text style={infoRowStyles.value}>{value}</Text>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  icon: { marginRight: 8 },
  label: { fontWeight: '500', color: colors.textSecondary, minWidth: 80, marginRight: 16 },
  value: { color: colors.textPrimary, flexShrink: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.error, fontSize: 16, marginTop: 12, textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  roomNumber: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: colors.textPrimary,
    marginRight: 12,
  },
  hostelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    width: '100%',
  },
  hostelName: {
    fontSize: 15,
    color: colors.primary,
    marginRight: 8,
  },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 14, fontStyle: 'italic' },
  separator: { height: 1, backgroundColor: colors.borderColor, marginVertical: 16 },
  infoRowSpacing: { marginBottom: 12 },
  roomStatusContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
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
  full: {
    backgroundColor: colors.primaryLight,
    color: colors.error,
  },
  available: {
    backgroundColor: colors.primaryLight,
    color: colors.success,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginLeft: 4,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  paid: {
    color: colors.success,
  },
  unpaid: {
    color: colors.error,
  },
}); 