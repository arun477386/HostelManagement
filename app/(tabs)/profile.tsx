import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();

  const handleManageHostels = () => {
    router.push('/hostels');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/80' }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
        <Text style={styles.phone}>+1 234 567 8900</Text>
      </View>

      {/* Manage Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Settings</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleManageHostels}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="business-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Manage Hostels</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="create-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="moon-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Dark Mode</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="notifications-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </View>
      </View>

      {/* System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="lock-closed-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#606770',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#606770',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#1E1E1E',
    marginLeft: 12,
  },
}); 