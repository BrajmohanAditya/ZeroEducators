import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID = '454932120899-fk4tsb8bcvha6sbqblso70fq5agfi4r3.apps.googleusercontent.com';

let isConfigured = false;

export const configureGoogleSignIn = () => {
  if (isConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    isConfigured = true;
  } catch (err) {
    console.warn('Failed to configure Google Sign-In:', err);
  }
};

export const performGoogleSignIn = async () => {
  configureGoogleSignIn();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    // Support both new (v13+) response format and older formats
    const idToken = response?.data?.idToken || response?.idToken;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Please try again.');
    }
    return idToken;
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available on this device.');
    } else {
      throw error;
    }
  }
};
