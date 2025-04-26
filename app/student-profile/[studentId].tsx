import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOwnerDocument } from '../../services/firestoreService';
import { format } from 'date-fns';
import { useAuth } from '../../services/AuthContext';

export default function StudentProfile() {
  const { studentId, hostelId } = useLocalSearchParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        if (!user) return;
        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) return;
        const h = ownerDoc.hostels[hostelId as string];
        setHostel(h);
        if (h && h.students && h.students[studentId as string]) {
          setStudent(h.students[studentId as string]);
        }
      } catch (e) {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId, hostelId, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B9EFF" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={40} color="#FF4C4C" />
        <Text style={styles.errorText}>Student not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#4B9EFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#4B9EFF" />
        </TouchableOpacity>
        <View style={[styles.activeStatus, student.isActive ? styles.active : styles.inactive]}>
          <Ionicons name={student.isActive ? 'checkmark-circle' : 'close-circle'} size={18} color={student.isActive ? '#10B981' : '#FF4C4C'} />
          <Text style={[styles.activeText, student.isActive ? styles.active : styles.inactive]}>{student.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={64} color="#4B9EFF" />
        <Text style={styles.name}>{student.fullName}</Text>
        <View style={styles.hostelRow}>
          <Text style={styles.hostelName}>{hostel?.name || ''}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => {/* TODO: Implement edit */}}>
            <Ionicons name="create-outline" size={16} color="#4B9EFF" style={styles.editIcon} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <InfoRow label="Phone" value={student.phone} icon="call-outline" style={styles.infoRowSpacing} />
        <InfoRow label="Room" value={student.roomId} icon="bed-outline" style={styles.infoRowSpacing} />
        <InfoRow label="Join Date" value={format(new Date(student.joinDate), 'MMM d, yyyy')} icon="calendar-outline" style={styles.infoRowSpacing} />
        {student.leaveDate && <InfoRow label="Leave Date" value={format(new Date(student.leaveDate), 'MMM d, yyyy')} icon="calendar-outline" style={styles.infoRowSpacing} />}
        <InfoRow label="Monthly Fee" value={`₹${student.feeAmount}`} icon="cash-outline" style={styles.infoRowSpacing} />
      </View>
      <View style={styles.separator} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Joining Advance</Text>
        <InfoRow label="Amount" value={`₹${student.joiningAdvance?.amount || 0}`} icon="cash-outline" style={styles.infoRowSpacing} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {student.documents && student.documents.length > 0 ? (
          student.documents.map((doc: string, idx: number) => (
            <InfoRow key={idx} label={`Document ${idx + 1}`} value={doc} icon="document-outline" style={styles.infoRowSpacing} />
          ))
        ) : (
          <Text style={styles.emptyText}>No documents uploaded</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.notes}>{student.notes || 'No notes'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments</Text>
        {student.payments && Object.keys(student.payments).length > 0 ? (
          Object.entries(student.payments).map(([month, payment]: any) => (
            <View key={month} style={styles.paymentRow}>
              <Text style={styles.paymentMonth}>{month}</Text>
              <Text style={[styles.paymentStatus, payment.status === 'paid' ? styles.paid : styles.unpaid]}>
                {payment.status === 'paid' ? 'Paid' : 'Unpaid'}
              </Text>
              <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
              {payment.paidDate && <Text style={styles.paymentDate}>on {format(new Date(payment.paidDate), 'MMM d, yyyy')}</Text>}
              {payment.remarks && <Text style={styles.paymentRemarks}>{payment.remarks}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payment records</Text>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, icon, style }: { label: string; value: string; icon: any; style?: any }) {
  return (
    <View style={[infoRowStyles.row, style]}>
      <Ionicons name={icon} size={18} color="#4B9EFF" style={infoRowStyles.icon} />
      <Text style={infoRowStyles.label}>{label}:</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  icon: { marginRight: 8 },
  label: { fontWeight: '500', color: '#374151', minWidth: 80, marginRight: 16 },
  value: { color: '#1F2937', flexShrink: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#FF4C4C', fontSize: 16, marginTop: 12, textAlign: 'center' },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#4B9EFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    color: '#4B9EFF',
    marginRight: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#E8F2FF',
    marginLeft: 8,
  },
  editIcon: {
    marginRight: 4,
  },
  editText: {
    color: '#4B9EFF',
    fontSize: 13,
    fontWeight: '600',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptyText: { color: '#6B7280', fontSize: 14, fontStyle: 'italic' },
  notes: { color: '#374151', fontSize: 14, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
  paymentMonth: { fontWeight: '500', color: '#374151', minWidth: 70 },
  paymentStatus: { fontWeight: 'bold', marginLeft: 8 },
  paid: { color: '#10B981' },
  unpaid: { color: '#FF4C4C' },
  paymentAmount: { marginLeft: 12, color: '#1F2937' },
  paymentDate: { marginLeft: 8, color: '#6B7280', fontSize: 12 },
  paymentRemarks: { marginLeft: 8, color: '#6B7280', fontSize: 12, fontStyle: 'italic' },
  infoRowSpacing: {
    marginBottom: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 18,
    borderRadius: 1,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  active: {
    backgroundColor: '#E6F7F0',
  },
  inactive: {
    backgroundColor: '#FFE5E5',
  },
}); 