import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { getOwnerDocument } from '../services/firestoreService';
import { format, startOfMonth, endOfMonth, setMonth } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

export default function VacatedStudentsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [allVacatedStudents, setAllVacatedStudents] = React.useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  React.useEffect(() => {
    const fetchVacatedStudents = async () => {
      try {
        if (!user) return;
        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;

        const allStudents: any[] = [];
        Object.entries(ownerDoc.hostels || {}).forEach(([hostelId, hostel]: [string, any]) => {
          Object.entries(hostel.students || {}).forEach(([studentId, student]: [string, any]) => {
            if (!student.isActive) {
              allStudents.push({
                id: studentId,
                hostelId,
                hostelName: hostel.name,
                ...student
              });
            }
          });
        });

        // Sort by leave date, most recent first
        allStudents.sort((a, b) => {
          const dateA = new Date(a.leaveDate || 0);
          const dateB = new Date(b.leaveDate || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setAllVacatedStudents(allStudents);
      } catch (error: any) {
        showToast(error.message || 'Failed to fetch vacated students', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchVacatedStudents();
  }, [user]);

  // Filter students by selected month
  const filteredStudents = allVacatedStudents.filter(student => {
    const leaveDate = new Date(student.leaveDate);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return leaveDate >= monthStart && leaveDate <= monthEnd;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(setMonth(new Date(), monthIndex));
    setIsMonthPickerOpen(false);
  };

  const renderStudentCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => router.push({ pathname: `/student-profile/${item.id}`, params: { hostelId: item.hostelId } })}
    >
      <View style={styles.studentInfo}>
        <View style={styles.nameRow}>
          <Ionicons name="person-circle-outline" size={24} color="#4B9EFF" style={styles.studentIcon} />
          <Text style={styles.studentName}>{item.fullName}</Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.hostelName}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Room {item.roomId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Left on {format(new Date(item.leaveDate), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B9EFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#4B9EFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Vacated Students</Text>
        <TouchableOpacity 
          style={styles.monthSelector}
          onPress={() => setIsMonthPickerOpen(true)}
        >
          <Text style={styles.monthText}>
            {format(selectedMonth, 'MMM yyyy')}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color="#4B9EFF" 
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isMonthPickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMonthPickerOpen(false)}
        >
          <View style={styles.monthPickerContainer}>
            <View style={styles.monthPickerHeader}>
              <Text style={styles.monthPickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setIsMonthPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#4B9EFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthGrid}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={styles.monthButton}
                  onPress={() => handleMonthSelect(index)}
                >
                  <View style={[
                    styles.monthButtonInner,
                    format(selectedMonth, 'M') === (index + 1).toString() && styles.selectedMonth
                  ]}>
                    <Text style={[
                      styles.monthButtonText,
                      format(selectedMonth, 'M') === (index + 1).toString() && styles.selectedMonthText
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No vacated students found for {format(selectedMonth, 'MMMM yyyy')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B9EFF',
    marginRight: 4,
  },
  listContainer: {
    padding: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentIcon: {
    marginRight: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
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
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  monthPickerContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  monthPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  monthButton: {
    width: '33.33%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  monthButtonInner: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: '#E8F2FF',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedMonthText: {
    color: '#4B9EFF',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 