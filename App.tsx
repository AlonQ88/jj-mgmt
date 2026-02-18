import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type SocialProvider = 'google' | 'apple';

type SignedInUser = {
  provider: SocialProvider;
  name?: string;
  email?: string;
};

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
};

export default function App() {
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [loadingGoogleProfile, setLoadingGoogleProfile] = useState(false);
  const [backendSyncMessage, setBackendSyncMessage] = useState<string | null>(null);

  const googleClientId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useAuthRequest({
    clientId: googleClientId ?? '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  const syncSocialAuthWithBackend = async (
    provider: SocialProvider,
    payload: { idToken?: string; accessToken?: string }
  ) => {
    if (!payload.idToken && !payload.accessToken) {
      setBackendSyncMessage(`No ${provider} token available for backend sync.`);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setBackendSyncMessage(`Backend sync complete (${provider}).`);
        return;
      }

      const errorBody = await response.text();
      setBackendSyncMessage(`Backend sync returned ${response.status} (${provider}). ${errorBody}`);
    } catch (error) {
      setBackendSyncMessage(`Backend sync failed (${provider}).`);
      console.warn(`Failed to sync ${provider} auth with backend.`, error);
    }
  };

  useEffect(() => {
    const loadGoogleProfile = async () => {
      if (googleResponse?.type !== 'success') {
        return;
      }

      const accessToken = googleResponse.authentication?.accessToken;
      if (!accessToken) {
        return;
      }

      setLoadingGoogleProfile(true);
      try {
        const response = await fetch(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Google profile: ${response.status}`);
        }

        const profile: { name?: string; email?: string } = await response.json();
        setUser({
          provider: 'google',
          name: profile.name,
          email: profile.email,
        });
      } catch (error) {
        console.warn('Google sign-in completed, but profile fetch failed.', error);
        setUser({ provider: 'google' });
      } finally {
        setLoadingGoogleProfile(false);
      }

      const idTokenFromParams =
        googleResponse?.type === 'success' && typeof googleResponse.params?.id_token === 'string'
          ? googleResponse.params.id_token
          : undefined;

      await syncSocialAuthWithBackend('google', {
        idToken: idTokenFromParams,
        accessToken,
      });
    };

    void loadGoogleProfile();
  }, [googleResponse]);

  const handleGoogleSignIn = async () => {
    await promptGoogleSignIn();
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();

      setUser({
        provider: 'apple',
        name: fullName || undefined,
        email: credential.email ?? undefined,
      });

      await syncSocialAuthWithBackend('apple', {
        idToken: credential.identityToken ?? undefined,
      });
    } catch (error) {
      console.warn('Apple sign-in was cancelled or failed.', error);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setBackendSyncMessage(null);
  };

  const isGoogleConfigured =
    !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>jj-mgmt</Text>
        <Text style={styles.subtitle}>Social login starter (Google + Apple)</Text>

        {!user ? (
          <View style={styles.actions}>
            <Pressable
              disabled={!googleRequest || !isGoogleConfigured || loadingGoogleProfile}
              onPress={handleGoogleSignIn}
              style={({ pressed }) => [
                styles.button,
                styles.googleButton,
                (!googleRequest || !isGoogleConfigured || loadingGoogleProfile) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {loadingGoogleProfile ? 'Loading profile...' : 'Continue with Google'}
              </Text>
            </Pressable>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            {!isGoogleConfigured && (
              <Text style={styles.helperText}>
                Set Google OAuth IDs in .env (see .env.example) to enable Google sign-in.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.actions}>
            <Text style={styles.welcomeText}>Signed in with {user.provider}</Text>
            <Text style={styles.profileText}>Name: {user.name ?? 'Not provided'}</Text>
            <Text style={styles.profileText}>Email: {user.email ?? 'Not provided'}</Text>
            {backendSyncMessage && <Text style={styles.backendText}>{backendSyncMessage}</Text>}
            <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>
          </View>
        )}
      </View>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#101828',
  },
  subtitle: {
    fontSize: 14,
    color: '#667085',
  },
  actions: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  googleButton: {
    backgroundColor: '#1f2937',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  appleButton: {
    width: '100%',
    height: 44,
  },
  helperText: {
    fontSize: 12,
    color: '#475467',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },
  profileText: {
    fontSize: 14,
    color: '#344054',
  },
  backendText: {
    fontSize: 12,
    color: '#475467',
  },
});
