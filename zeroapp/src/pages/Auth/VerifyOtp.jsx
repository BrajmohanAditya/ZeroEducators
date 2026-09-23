import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ShieldCheck, ArrowLeft, RefreshCw, Mail } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';
import { liveVerifyOtpApi, liveRegisterApi } from '../../config/api';
import { saveUserSession } from '../../utils/storage';

export const VerifyOtp = ({ email, phone, name, password, onNavigate, onVerifySuccess, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // 60-second Resend countdown
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtp(newOtp);

    // Auto-advance to next input box
    if (cleanVal && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await liveVerifyOtpApi(email, otpCode);
      if (data?.success && data?.user) {
        await saveUserSession(data.user, data.token);
        if (onVerifySuccess) {
          onVerifySuccess(data.user);
        } else if (onNavigate) {
          onNavigate('Home');
        }
      } else {
        setError(data?.message || 'Invalid OTP. Please check and try again.');
      }
    } catch (err) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      if (name && password && email && phone) {
        await liveRegisterApi({ name, email, password, mobileNo: phone });
      }
      setTimer(60);
      Alert.alert('OTP Resent', `A new verification code has been sent to ${email}`);
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
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
              if (onBack) onBack();
              else if (onNavigate) onNavigate('Register');
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color="#10b981" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We have sent a 4-digit verification code to
          </Text>
          <View style={styles.emailPill}>
            <Mail size={13} color="#2563eb" />
            <Text style={styles.emailText} numberOfLines={1}>
              {email || 'your email'}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 4 OTP Digit Input Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <Button
            size="lg"
            loading={loading}
            onPress={handleVerify}
            style={styles.verifyBtn}
          >
            Verify &amp; Continue
          </Button>

          {/* Resend Timer / Action */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerHighlight}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resending}
                style={styles.resendBtn}
              >
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={styles.resendContent}>
                    <RefreshCw size={14} color={colors.primary} />
                    <Text style={styles.resendText}>Resend Code</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
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
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
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
    marginBottom: 8,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 20,
  },
  emailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  errorBox: {
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
    textAlign: 'center',
    fontWeight: '500',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  otpBox: {
    width: 56,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  otpBoxFilled: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  otpBoxError: {
    borderColor: colors.destructive,
  },
  verifyBtn: {
    width: '100%',
    marginBottom: 20,
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timerHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendBtn: {
    padding: 8,
  },
  resendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default VerifyOtp;
