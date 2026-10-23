import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Clock, ChevronRight, Sparkles } from 'lucide-react-native';
import { fetchFocusStatsApi } from '../../config/api';

export default function FocusBanner({ onNavigate }) {
  const [activeCount, setActiveCount] = useState(1);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    const loadCount = async () => {
      try {
        const stats = await fetchFocusStatsApi();
        if (isMounted && stats?.success) {
          setActiveCount(stats.activeStudents > 0 ? stats.activeStudents : 1);
        }
      } catch (err) {
        // ignore
      }
    };

    loadCount();
    const interval = setInterval(loadCount, 60000);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
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

    return () => {
      isMounted = false;
      clearInterval(interval);
      pulse.stop();
    };
  }, [pulseAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onNavigate && onNavigate('FocusTime')}
      style={styles.container}
    >
      <View style={styles.leftCol}>
        <View style={styles.liveTagRow}>
          <View style={styles.dotBox}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.dot} />
          </View>
          <Text style={styles.liveText}>STUDY ROOM LIVE</Text>
        </View>

        <Text style={styles.heading}>
          {activeCount} {activeCount === 1 ? 'student' : 'students'} studying right now
        </Text>
        <Text style={styles.subheading}>
          Boost your concentration with 25-min Pomodoro focus sessions
        </Text>
      </View>

      <View style={styles.actionBtn}>
        <Clock size={18} color="#0d1f2d" style={{ marginRight: 6 }} />
        <Text style={styles.actionBtnText}>Focus</Text>
        <ChevronRight size={16} color="#0d1f2d" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.35)',
    elevation: 3,
    shadowColor: '#00d2b4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dotBox: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    position: 'absolute',
  },
  pulseRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveText: {
    color: '#10b981',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heading: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 2,
  },
  subheading: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d2b4',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  actionBtnText: {
    color: '#0d1f2d',
    fontSize: 13,
    fontWeight: '800',
  },
});
