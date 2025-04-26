import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../services/AuthContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

function RootLayoutNav() {
  const { loading, user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure proper mounting
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen until everything is ready
  if (!isReady || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4B9EFF" />
      </View>
    );
  }

  // If not authenticated, show auth screens
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="email-auth" />
      </Stack>
    );
  }

  // If authenticated, show main app
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <StatusBar style="dark" />
          <RootLayoutNav />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 