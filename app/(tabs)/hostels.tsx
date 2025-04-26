import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';

interface Hostel {
  id: string;
  name: string;
  location: string;
  totalRooms: number;
  totalStudents: number;
  vacantRooms: number;
  pendingFees: number;
}

// Mock data - replace with real data from Firestore
const mockHostels: Hostel[] = [
  {
    id: '1',
    name: 'Shanti PG',
    location: 'Pune',
    totalRooms: 12,
    totalStudents: 32,
    vacantRooms: 4,
    pendingFees: 18000,
  },
  {
    id: '2',
    name: 'Green Valley Hostel',
    location: 'Mumbai',
    totalRooms: 8,
    totalStudents: 24,
    vacantRooms: 2,
    pendingFees: 12000,
  },
];

export default function Hostels() {
  const { user } = useAuth();

  const renderHostelCard = ({ item }: { item: Hostel }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.hostelName}>{item.name}</Text>
          <Text style={styles.hostelLocation}>{item.location}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="business-outline" size={20} color="#4B9EFF" />
          <Text style={styles.statValue}>{item.totalRooms}</Text>
          <Text style={styles.statLabel}>Rooms</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={20} color="#4B9EFF" />
          <Text style={styles.statValue}>{item.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="bed-outline" size={20} color="#4B9EFF" />
          <Text style={styles.statValue}>{item.vacantRooms}</Text>
          <Text style={styles.statLabel}>Vacant</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="wallet-outline" size={20} color="#4B9EFF" />
          <Text style={styles.statValue}>₹{item.pendingFees}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Hostels</Text>
          <Text style={styles.subtitle}>Manage rooms, students, and track occupancy</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Hostel List */}
      <FlatList
        data={mockHostels}
        renderItem={renderHostelCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B9EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  hostelLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#4B9EFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 