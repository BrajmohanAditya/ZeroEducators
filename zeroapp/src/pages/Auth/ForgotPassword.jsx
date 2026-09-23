import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { liveForgotPasswordApi, liveResetPasswordApi } from '../../config/api';

export const ForgotPassword = ({ onNavigate, onBack }) => {
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Send Reset OTP to Email
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await liveForgotPasswordApi(email.trim().toLowerCase());
      if (data?.success) {
        setStep(2);
        setSuccessMessage(`OTP sent to ${email.trim()}`);
      } else {
        setError(data?.message || 'Could not send reset OTP. Please check your email.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to request reset OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async () => {
    if (!otp.trim()) {
      setError('Please enter the reset OTP received on your email');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await liveResetPasswordApi(
        email.trim().toLowerCase(),
        otp.trim(),
        newPassword
      );
      if (data?.success) {
        Alert.alert(
          'Password Reset Successful 🎉',
          'Your password has been updated. Please sign in with your new password.',
          [
            {
              text: 'Sign In Now',
              onPress: () => {
                if (onNavigate) onNavigate('Login');
              },
            },
          ]
        );
      } else {
        setError(data?.message || 'Password reset failed. Please check the OTP.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please check the OTP.');
    } finally {
      setLoading(false);
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (step === 2) {
                setStep(1);
                setError('');
              } else if (onBack) {
                onBack();
              } else if (onNavigate) {
                onNavigate('Login');
              }
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <KeyRound size={34} color="#2563eb" />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your registered email address and we will send you a reset code.'
              : `Enter the verification code sent to ${email} and choose a new password.`}
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <ShieldAlert size={16} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Info Message */}
          {successMessage && step === 2 && !error ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            // ── STEP 1: Enter Email ──
            <View style={styles.formSection}>
              <Input
                label="Registered Email"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={18} color={colors.textMuted} />}
              />

              <Button
                size="lg"
                loading={loading}
                onPress={handleSendOtp}
                style={styles.actionBtn}
              >
                Send Reset Code
              </Button>
            </View>
          ) : (
            // ── STEP 2: Enter OTP & New Password ──
            <View style={styles.formSection}>
              <Input
                label="Reset OTP Code"
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                icon={<KeyRound size={18} color={colors.textMuted} />}
              />

              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                icon={<Lock size={18} color={colors.textMuted} />}
              />

              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
                icon={<Lock size={18} color={colors.textMuted} />}
              />

              <Button
                size="lg"
                loading={loading}
                onPress={handleResetPassword}
                style={styles.actionBtn}
              >
                Reset Password
              </Button>
            </View>
          )}

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate('Login')}
            style={styles.backToLoginRow}
          >
            <Text style={styles.backToLoginText}>Remember your password? </Text>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    ...shadows.lg,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  successText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formSection: {
    gap: 16,
  },
  actionBtn: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  backToLoginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  backToLoginText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ForgotPassword;
