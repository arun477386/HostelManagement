import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AuthButton from '../components/AuthButton';

export default function SignIn() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <AuthButton type="google" />
      <AuthButton type="email" />
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
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    marginTop: 20,
    color: '#007AFF',
  },
}); 