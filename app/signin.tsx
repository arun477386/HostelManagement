import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/authService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.signInWithEmail(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={!email || !password || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.cardBackground} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <Text 
        style={styles.link}
        onPress={() => router.push('/signup')}
      >
        Don't have an account? Sign Up
      </Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.textBase,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: layout.cardPadding,
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
  buttonDisabled: {
    backgroundColor: colors.borderColor,
  },
  buttonText: {
    ...typography.textBase,
    color: colors.cardBackground,
    fontWeight: '600',
  },
  link: {
    ...typography.textSecondary,
    color: colors.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  error: {
    ...typography.textSecondary,
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
}); 