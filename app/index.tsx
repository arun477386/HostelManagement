import { Redirect } from 'expo-router';
import { useAuth } from '../services/AuthContext';

export default function Index() {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to home
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  // If not authenticated, redirect to signin
  return <Redirect href="/signin" />;
}
