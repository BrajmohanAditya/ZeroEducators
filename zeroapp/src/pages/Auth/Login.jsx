import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mail, Lock, GraduationCap, ArrowRight } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

import { liveLoginApi } from '../../config/api';

export const Login = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await liveLoginApi(email.trim(), password);
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(data?.user || { email, name: email.split('@')[0] });
      }
      if (onNavigate) {
        onNavigate('Home');
      }
    } catch (err) {
      setLoading(false);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Please check your credentials or network.';
      setError(serverMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Brand Icon Header */}
          <View style={styles.iconCircle}>
            <GraduationCap size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Login Account</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your courses and tests
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {/* Email Input */}
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your registered email"
            keyboardType="email-address"
            icon={<Mail size={18} color={colors.textMuted} />}
          />

          {/* Password Input */}
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            icon={<Lock size={18} color={colors.textMuted} />}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            size="lg"
            loading={loading}
            onPress={handleLogin}
            style={styles.loginBtn}
          >
            Sign In
          </Button>

          {/* Register Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff', // indigo-50
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    ...shadows.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: colors.destructiveLight,
    color: colors.destructive,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loginBtn: {
    width: '100%',
    marginBottom: 16,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default Login;
