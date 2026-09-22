import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@zeroapp_user_session';
const TOKEN_KEY = '@zeroapp_auth_token';

// In-memory fallback in case storage has temporary IO issue
let memoryUser = null;
let memoryToken = null;

export const saveUserSession = async (user, token = null) => {
  try {
    memoryUser = user;
    if (token) memoryToken = token;

    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }

    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, String(token));
    }
    return true;
  } catch (err) {
    console.warn('[Storage] Error saving user session:', err);
    return false;
  }
};

export const getUserSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const effectiveToken = token || parsed?.token || parsed?.jwt || null;
      memoryUser = parsed;
      memoryToken = effectiveToken;
      return { user: parsed, token: effectiveToken };
    }
  } catch (err) {
    console.warn('[Storage] Error reading user session:', err);
  }
  return { user: memoryUser, token: memoryToken };
};

export const clearUserSession = async () => {
  try {
    memoryUser = null;
    memoryToken = null;
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (err) {
    console.warn('[Storage] Error clearing user session:', err);
    return false;
  }
};

export default {
  saveUserSession,
  getUserSession,
  clearUserSession,
};
