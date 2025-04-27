import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../services/AuthContext';
import { useState, useEffect } from 'react';
import { getOwnerDocument } from '../../services/firestoreService';
import { useAppData } from '../../contexts/AppDataContext';

const ProfileImage = ({ photoUrl, fullName }: { photoUrl: string; fullName: string }) => {
  if (photoUrl && photoUrl !== 'https://via.placeholder.com/80') {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={styles.profileImage}
      />
    );
  }

  const firstLetter = fullName ? fullName.charAt(0).toUpperCase() : '?';
  
  return (
    <View style={[styles.profileImage, styles.letterAvatar]}>
      <Text style={styles.letterAvatarText}>{firstLetter}</Text>
    </View>
  );
};

export default function Profile() {
  const router = useRouter();
  const { owner } = useAppData();

  const handleManageHostels = () => {
    router.push('/hostels');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleAbout = () => {
    router.push('/about');
  };

  const handleHelpSupport = () => {
    router.push('/help-support');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Small delay to ensure proper navigation
      setTimeout(() => {
        router.replace('/signin');
      }, 50);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.profileImageContainer}>
          <ProfileImage photoUrl={owner?.photoUrl || ''} fullName={owner?.fullName || ''} />
        </View>
        <Text style={styles.name}>{owner?.fullName || ''}</Text>
        <Text style={styles.email}>{owner?.email || ''}</Text>
        <Text style={styles.phone}>{owner?.phone || ''}</Text>
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

        <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="information-circle-outline" size={24} color="#4B9EFF" />
            <Text style={styles.settingItemText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#606770" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#FF4C4C" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.copyrightText}>© 2025 HostelEase. All rights reserved.</Text>
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  signOutText: {
    color: '#FF4C4C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyrightText: {
    textAlign: 'center',
    color: '#606770',
    fontSize: 12,
    marginBottom: 20,
  },
  letterAvatar: {
    backgroundColor: '#4B9EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterAvatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 