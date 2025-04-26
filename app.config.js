module.exports = {
  expo: {
    name: 'Arun_HostelManagement',         // ✅ Display name (shown under app icon)
    slug: 'arun-hostelmanagement',         // ✅ Used in build URLs and internal references
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'arunhostelapp',               // ✅ Used for linking, should be lowercase
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourcompany.arunhostelmanagement' // ✅ Optional (for iOS builds)
    },
    android: {
      package: 'com.yourcompany.arunhostelmanagement',         // ✅ Optional (for Android builds)
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    plugins: ['expo-router'],
    newArchEnabled: true
  }
};
