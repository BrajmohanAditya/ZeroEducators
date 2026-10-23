import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Alert,
  Vibration,
  Animated,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, G } from 'react-native-svg';
import {
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  Award,
  CheckCircle2,
  X,
  Flame,
} from 'lucide-react-native';
import {
  startFocusApi,
  pingFocusApi,
  stopFocusApi,
  fetchFocusStatsApi,
} from '../../../config/api';

const { width } = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.72, 280);
const STROKE_WIDTH = 10;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PRESETS = [
  { label: '15m', minutes: 15, seconds: 15 * 60 },
  { label: '25m', minutes: 25, seconds: 25 * 60 },
  { label: '1h', minutes: 60, seconds: 60 * 60 },
  { label: '2h', minutes: 120, seconds: 120 * 60 },
];

const MOTIVATIONAL_QUOTES = [
  'Your first focus session today could set the tone for a productive day.',
  'Small daily efforts lead to giant lifetime achievements.',
  'Focus is the bridge between goals and accomplishment.',
  'Eliminate distractions. Your future self is depending on you.',
  'Deep work produces rare and valuable outcomes.',
];

export default function FocusTimer({ user, onNavigate }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[1]); // Default 25m
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeStudents, setActiveStudents] = useState(1);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [deviceId, setDeviceId] = useState(null);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const timerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Generate or retrieve persistent unique deviceId for guest students
  useEffect(() => {
    (async () => {
      try {
        let storedId = await AsyncStorage.getItem('@focus_device_id');
        if (!storedId) {
          storedId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
          await AsyncStorage.setItem('@focus_device_id', storedId);
        }
        setDeviceId(storedId);
      } catch (err) {
        setDeviceId('dev_' + Date.now());
      }
    })();
  }, []);

  // Fetch initial active count & today's study minutes
  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchFocusStatsApi({
        userId: user?._id,
        deviceId,
      });
      if (stats?.success) {
        // Display realistic minimum if server has few active sessions
        const count = stats.activeStudents > 0 ? stats.activeStudents : 1;
        setActiveStudents(count);
        if (typeof stats.todayMinutes === 'number') {
          setTodayMinutes(stats.todayMinutes);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [user?._id, deviceId]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 45000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Subtle pulsing animation on green live dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Select duration preset
  const handleSelectPreset = (preset) => {
    if (isRunning) return;
    setSelectedPreset(preset);
    setTimeLeft(preset.seconds);
  };

  // Start Focus Session
  const handleStartFocus = async () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();

    try {
      const res = await startFocusApi({
        userId: user?._id || null,
        deviceId,
        userName: user?.name || 'Student',
        durationMinutes: selectedPreset.minutes,
      });

      if (res?.success && res?.sessionId) {
        setSessionId(res.sessionId);
        if (res.activeStudents) setActiveStudents(res.activeStudents);
      }
    } catch (err) {
      console.warn('Start focus API error:', err);
    }
  };

  // Heartbeat ping every 30s while running
  useEffect(() => {
    if (isRunning && sessionId) {
      pingIntervalRef.current = setInterval(async () => {
        try {
          const spentMins = Math.floor((selectedPreset.seconds - timeLeft) / 60);
          const res = await pingFocusApi({
            sessionId,
            actualMinutes: Math.max(1, spentMins),
          });
          if (res?.success && res?.activeStudents) {
            setActiveStudents(res.activeStudents);
          }
        } catch (e) {
          // ignore
        }
      }, 45000);
    } else {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    }

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [isRunning, sessionId, selectedPreset.seconds, timeLeft]);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Handle Session Completed
  const handleSessionCompleted = async () => {
    setIsRunning(false);
    Vibration.vibrate([0, 500, 200, 500]);

    const completedMins = selectedPreset.minutes;
    setTodayMinutes((prev) => prev + completedMins);

    if (sessionId) {
      await stopFocusApi({
        sessionId,
        actualMinutes: completedMins,
        status: 'completed',
      });
      setSessionId(null);
    }

    Alert.alert(
      '🎉 Focus Session Completed!',
      `Brilliant job! You stayed locked in for ${completedMins} minutes. Keep this winning momentum!`,
      [{ text: 'Awesome', onPress: () => setTimeLeft(selectedPreset.seconds) }]
    );
  };

  // Pause Focus
  const handlePause = () => {
    setIsRunning(false);
  };

  // Give Up / Stop Session Confirmation
  const handleGiveUp = () => {
    Alert.alert(
      'Give Up Session?',
      'Are you sure you want to end this focus session early?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(false);
            const spentMins = Math.max(
              1,
              Math.floor((selectedPreset.seconds - timeLeft) / 60)
            );

            if (sessionId) {
              await stopFocusApi({
                sessionId,
                actualMinutes: spentMins,
                status: 'cancelled',
              });
              setSessionId(null);
            }

            setTimeLeft(selectedPreset.seconds);
            loadStats();
          },
        },
      ]
    );
  };

  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // SVG Progress Stroke
  const progressRatio = timeLeft / selectedPreset.seconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark soothing overlay */}
      <View style={styles.overlay}>
        {/* Top Community Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLiveModal(true)}
          style={styles.communityPill}
        >
          <View style={styles.dotContainer}>
            <Animated.View
              style={[
                styles.livePulseDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.communityText}>
            {activeStudents} {activeStudents === 1 ? 'student' : 'students'} studying
          </Text>
          <ChevronRight size={16} color="#ffffff" style={styles.chevron} />
        </TouchableOpacity>

        {/* Center Circular Timer */}
        <View style={styles.timerCenterWrapper}>
          <View style={styles.timerContainer}>
            <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
              <G rotation="-90" origin={`${TIMER_SIZE / 2}, ${TIMER_SIZE / 2}`}>
                {/* Background Ring */}
                <Circle
                  cx={TIMER_SIZE / 2}
                  cy={TIMER_SIZE / 2}
                  r={RADIUS}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth={STROKE_WIDTH}
                  fill="#0e1726"
                />
                {/* Dynamic Cyan/Teal Progress Ring */}
                <Circle
                  cx={TIMER_SIZE / 2}
                  cy={TIMER_SIZE / 2}
                  r={RADIUS}
                  stroke="#00d2b4"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </G>
            </Svg>

            {/* Centered Time Display */}
            <View style={styles.timeInnerContent}>
              <Text style={styles.timerDigits}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerSublabel}>
                {isRunning ? 'FOCUS MODE' : 'READY TO STUDY'}
              </Text>
            </View>
          </View>
        </View>

        {/* Motivational Card & Preset Selectors */}
        <View style={styles.cardContainer}>
          <Text style={styles.quoteText}>
            {MOTIVATIONAL_QUOTES[quoteIndex]} Let's lock in {selectedPreset.minutes} minutes.
          </Text>

          {/* Preset Buttons: 15m | 25m | 1h | 2h */}
          <View style={styles.presetsRow}>
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset.minutes === preset.minutes;
              return (
                <TouchableOpacity
                  key={preset.label}
                  disabled={isRunning}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPreset(preset)}
                  style={[
                    styles.presetItem,
                    isSelected && styles.presetItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSelected && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.bottomActionsContainer}>
          {!isRunning ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.startBtn}
              onPress={handleStartFocus}
            >
              <Play size={20} color="#0d1f2d" fill="#0d1f2d" style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>Start Focus</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.giveUpBtn}
                onPress={handleGiveUp}
              >
                <RotateCcw size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.giveUpBtnText}>Give Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.pauseBtn}
                onPress={handlePause}
              >
                <Pause size={18} color="#0d1f2d" fill="#0d1f2d" style={{ marginRight: 6 }} />
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Today's Focus Stats Pill */}
          <View style={styles.todayStatsRow}>
            <Flame size={16} color="#f59e0b" style={{ marginRight: 6 }} />
            <Text style={styles.todayStatsText}>
              Today's Focus: <Text style={styles.todayStatsHighlight}>{todayMinutes} mins</Text>
            </Text>
          </View>
        </View>

        {/* Live Community Info Modal */}
        <Modal
          visible={showLiveModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLiveModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Users size={22} color="#00d2b4" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Live Study Room</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLiveModal(false)}>
                  <X size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Right now, <Text style={styles.modalHighlight}>{activeStudents} students</Text> are actively studying and staying disciplined across ZeroEducators.
              </Text>

              <View style={styles.modalFeatureBox}>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={18} color="#10b981" style={{ marginRight: 10 }} />
                  <Text style={styles.featureItemText}>Real-time synchronized student count</Text>
                </View>
                <View style={styles.featureItem}>
                  <Award size={18} color="#f59e0b" style={{ marginRight: 10 }} />
                  <Text style={styles.featureItemText}>Build daily focus habit & consistency</Text>
                </View>
                <View style={styles.featureItem}>
                  <Sparkles size={18} color="#38bdf8" style={{ marginRight: 10 }} />
                  <Text style={styles.featureItemText}>Pomodoro science-backed 25m interval</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modalDoneBtn}
                onPress={() => setShowLiveModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Let's Study Together</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 26, 0.62)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Top Live Pill
  communityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 27, 36, 0.85)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 8,
  },
  dotContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    position: 'absolute',
  },
  livePulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  communityText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.8,
  },
  // Center Timer
  timerCenterWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  timerContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  timerSublabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  // Motivational Card
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(19, 27, 38, 0.88)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quoteText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 14,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  presetItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  presetText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  // Actions
  bottomActionsContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#00d2b4',
    paddingVertical: 15,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00d2b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  startBtnText: {
    color: '#0a1a24',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  runningActionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  giveUpBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingVertical: 14,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giveUpBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00d2b4',
    paddingVertical: 14,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtnText: {
    color: '#0d1f2d',
    fontSize: 15,
    fontWeight: '800',
  },
  todayStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  todayStatsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12.5,
    fontWeight: '500',
  },
  todayStatsHighlight: {
    color: '#00d2b4',
    fontWeight: '700',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  modalHighlight: {
    color: '#00d2b4',
    fontWeight: '700',
  },
  modalFeatureBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureItemText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
  modalDoneBtn: {
    backgroundColor: '#00d2b4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#0a1a24',
    fontSize: 15,
    fontWeight: '700',
  },
});
