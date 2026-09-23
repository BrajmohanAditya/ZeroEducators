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
import { User, Mail, Lock, Phone, GraduationCap, ArrowLeft } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { liveRegisterApi } from '../../config/api';
import { saveUserSession } from '../../utils/storage';
import GoogleSignInButton from '../../components/common/GoogleSignInButton';

export const Register = ({ onNavigate, onRegisterSuccess, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        mobileNo: phone.trim(),
      };
      const data = await liveRegisterApi(payload);
      setLoading(false);

      if (onNavigate) {
        onNavigate('VerifyOtp', {
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          name: name.trim(),
          password,
        });
      }
    } catch (err) {
      setLoading(false);
      const serverMsg =
        err?.message ||
        err?.response?.data?.message ||
        'Registration failed. Please check your details and try again.';
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (onBack) onBack();
              else if (onNavigate) onNavigate('Home');
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#475569" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <GraduationCap size={28} color="#ffffff" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join ZeroEducators to start learning from top banking mentors
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {/* Full Name */}
          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            icon={<User size={18} color={colors.textMuted} />}
          />

          {/* Email */}
          <Input
            label="Email Address *"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon={<Mail size={18} color={colors.textMuted} />}
          />

          {/* Phone */}
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            icon={<Phone size={18} color={colors.textMuted} />}
          />

          {/* Password */}
          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            secureTextEntry
            icon={<Lock size={18} color={colors.textMuted} />}
          />

          {/* Register Button */}
          <Button
            size="lg"
            loading={loading}
            onPress={handleRegister}
            style={styles.registerBtn}
          >
            Create Account
          </Button>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <GoogleSignInButton
            text="Sign up with Google"
            onSuccess={(user, token) => {
              if (onRegisterSuccess) onRegisterSuccess(user, token);
              else if (onNavigate) onNavigate('Home');
            }}
            onNavigate={onNavigate}
            style={styles.googleBtn}
          />

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
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
    backgroundColor: '#eef2ff',
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
    position: 'relative',
    ...shadows.lg,
  },
  backBtn: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    ...shadows.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: colors.destructiveLight,
    color: colors.destructive,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
  },
  registerBtn: {
    width: '100%',
    marginTop: 6,
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  googleBtn: {
    width: '100%',
    marginBottom: 14,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default Register;
