import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { performGoogleSignIn } from '../../config/googleAuth';
import { liveGoogleLoginApi } from '../../config/api';
import { saveUserSession } from '../../utils/storage';
import { shadows } from '../../theme/colors';

// Official Multi-Color Google G Logo
const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

export const GoogleSignInButton = ({ onSuccess, onNavigate, text = 'Continue with Google', style }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const idToken = await performGoogleSignIn();
      const data = await liveGoogleLoginApi(idToken);

      if (data?.success && data?.user) {
        const token = data.token || data.jwt || null;
        await saveUserSession(data.user, token);
        if (onSuccess) {
          onSuccess(data.user, token);
        } else if (onNavigate) {
          onNavigate('Home');
        }
      } else {
        Alert.alert('Google Sign-In', data?.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      if (err.message && !err.message.includes('cancelled')) {
        Alert.alert('Sign-In Error', err.message || 'Could not authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={loading}
      onPress={handleGoogleSignIn}
      style={[styles.button, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text style={styles.buttonText}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
});

export default GoogleSignInButton;
