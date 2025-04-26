import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useGoogleAuth } from '../services/googleAuth';

type AuthButtonProps = {
  type: 'google' | 'email';
};

export default function AuthButton({ type }: AuthButtonProps) {
  const { promptAsync, handleGoogleSignIn } = useGoogleAuth();

  const handlePress = async () => {
    try {
      if (type === 'google') {
        const result = await promptAsync();
        if (result?.type === 'success') {
          await handleGoogleSignIn(); // internally navigates to /home
        }
      } else {
        router.push('/email-auth'); // Redirect to email form screen
      }
    } catch (error) {
      console.error(`Error with ${type} auth:`, error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        type === 'google' ? styles.googleButton : styles.emailButton,
      ]}
      onPress={handlePress}
    >
      <Text style={styles.buttonText}>
        {type === 'google' ? 'Continue with Google' : 'Continue with Email'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginVertical: 10,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  emailButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
