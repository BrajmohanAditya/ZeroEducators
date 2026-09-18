import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const trendingLinks = [
  'SBI PO & Clerk Complete Foundation Batch 2026',
  'IBPS PO / Clerk Target Batch 2026',
  'RBI Grade B & Assistant Comprehensive Live Course',
  'RRB PO / Clerk (Pre + Mains) Special Batch',
  'Banking & Financial Awareness Special Masterclass',
  'Admissions Open for All Banking Foundation Courses',
];

export const TrendingBar = ({ onLinkPress }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  // Approximate total width of one iteration of items
  const totalContentWidth = 1900;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalContentWidth,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [scrollX]);

  return (
    <View style={styles.container}>
      {/* 1. Left Label (Matching frontend: 🔥 Trending Links: with vertical border) */}
      <View style={styles.labelContainer}>
        <Text style={styles.fireIcon}>🔥</Text>
        <Text style={styles.labelText}>Trending Links:</Text>
      </View>

      {/* 2. Marquee Animated Area */}
      <View style={styles.marqueeWrapper}>
        <Animated.View
          style={[
            styles.marqueeTrack,
            {
              transform: [{ translateX: scrollX }],
            },
          ]}
        >
          {/* First pass */}
          {trendingLinks.map((text, idx) => (
            <View key={`first-${idx}`} style={styles.itemRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onLinkPress && onLinkPress(text)}
              >
                <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="clip">
                  {text}
                </Text>
              </TouchableOpacity>
              <Text style={styles.pipeDivider}>|</Text>
            </View>
          ))}

          {/* Duplicate pass for seamless infinite loop */}
          {trendingLinks.map((text, idx) => (
            <View key={`second-${idx}`} style={styles.itemRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onLinkPress && onLinkPress(text)}
              >
                <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="clip">
                  {text}
                </Text>
              </TouchableOpacity>
              <Text style={styles.pipeDivider}>|</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fffbeb', // amber-50
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7', // amber-100
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingLeft: 14,
    paddingRight: 14,
    borderRightWidth: 1.5,
    borderRightColor: '#fde68a', // amber-200/60
    height: '100%',
    zIndex: 10,
  },
  fireIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626', // text-red-600
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  marqueeWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingLeft: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb', // text-blue-600
    paddingVertical: 4,
    flexShrink: 0,
  },
  pipeDivider: {
    color: '#cbd5e1', // text-slate-300
    fontWeight: '700',
    fontSize: 14,
    marginHorizontal: 12,
    flexShrink: 0,
  },
});

export default TrendingBar;
