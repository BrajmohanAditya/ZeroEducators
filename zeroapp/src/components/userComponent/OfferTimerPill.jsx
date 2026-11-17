import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const OfferTimerPill = ({ offerTimer, onPress }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!offerTimer || !offerTimer.isActive || !offerTimer.endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(offerTimer.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${String(totalHours).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setTimeLeft(formatted);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [offerTimer]);

  if (!offerTimer || !offerTimer.isActive || !timeLeft) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.pillContainer}
    >
      <Text style={styles.walletIcon}>👛</Text>
      <View style={styles.textColumn}>
        <Text style={styles.titleText} numberOfLines={1}>
          {offerTimer.title || 'Dussehra Dhamaka'}
        </Text>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },
  walletIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  textColumn: {
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
    maxWidth: 105,
    lineHeight: 12,
  },
  timerBadge: {
    backgroundColor: '#e11d48',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(OfferTimerPill);
