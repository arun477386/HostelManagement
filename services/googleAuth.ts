import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from './authService';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  const handleGoogleSignIn = async () => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      const user = await authService.signInWithGoogleCredential(id_token, access_token);
      if (user) router.replace('/home');
    }
  };

  return { request, promptAsync, handleGoogleSignIn };
};
