import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { createOwnerDocument } from '../services/firestoreService';
import { Owner, Hostel } from '../types/hostelSchema';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSignUp = async () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create owner document in Firestore
      const ownerData: Omit<Owner, 'hostels'> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        photoUrl: '',
        role: 'owner',
        createdAt: new Date().toISOString(),
        settings: {
          language: 'en',
          currency: 'INR',
          darkMode: false,
          notificationsEnabled: true,
        },
      };

      // Create owner document without initial hostel
      await createOwnerDocument(userCredential.user.uid, ownerData);

      // Navigate to Create Hostel screen
      router.replace('/createHostel');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={colors.textSecondary}
        value={formData.fullName}
        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor={colors.textSecondary}
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.cardBackground} />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => router.push('/signin')}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.screenPadding,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.titleXL,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  input: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: layout.inputRadius,
    paddingHorizontal: layout.cardPadding,
    marginBottom: 15,
    ...typography.textBase,
    color: colors.textPrimary,
    backgroundColor: colors.cardBackground,
  },
  button: {
    height: layout.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: layout.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    ...typography.textBase,
    color: colors.cardBackground,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    ...typography.textSecondary,
    color: colors.primary,
  },
  error: {
    ...typography.textSecondary,
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
}); 