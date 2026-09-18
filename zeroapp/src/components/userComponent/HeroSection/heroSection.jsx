import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows } from '../../../theme/colors';

const { width } = Dimensions.get('window');

// Default live AWS exam data for instant rendering
const DEFAULT_EXAMS = [
  {
    _id: 'sbi_po',
    title: 'SBI PO',
    imageUrl: 'https://idr01.zata.ai/zerozeroeducators/hero/1788458937616-i2.png',
  },
  {
    _id: 'ssc',
    title: 'SSC',
    imageUrl: 'https://idr01.zata.ai/zerozeroeducators/hero/1788464433939-l4.png',
  },
  {
    _id: 'rbi',
    title: 'RBI',
    imageUrl: 'https://idr01.zata.ai/zerozeroeducators/hero/1788464451870-l3.png',
  },
  {
    _id: 'ibps_po',
    title: 'IBPS PO',
    imageUrl: 'https://idr01.zata.ai/zerozeroeducators/hero/1788464471244-l1.png',
  },
];

export const HeroSection = ({
  upcomingExams = [],
  banners = [],
  isLoading = false,
  onExamPress,
}) => {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-scroll banners every 5 seconds if multiple exist
  useEffect(() => {
    if (banners && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  // Use live upcomingExams or fallback to the live AWS 4 exams
  const displayedExams =
    upcomingExams && upcomingExams.length > 0
      ? upcomingExams.slice(0, 4)
      : DEFAULT_EXAMS;

  return (
    <View style={styles.container}>
      {/* ==================================================== */}
      {/* 1. UPCOMING EXAMS (Exact 2x2 Clean Box UI)           */}
      {/* ==================================================== */}
      <View style={styles.examsCard}>
        {/* Header */}
        <View style={styles.examsHeader}>
          <Text style={styles.examsTitle}>Upcoming Exams</Text>
        </View>

        {/* 2x2 Grid: SBI PO, SSC / RBI, IBPS PO */}
        <View style={styles.examsGrid}>
          {displayedExams.map((exam) => (
            <TouchableOpacity
              key={exam._id}
              activeOpacity={0.75}
              onPress={() => onExamPress && onExamPress(exam)}
              style={styles.examItem}
            >
              <View style={styles.examImageContainer}>
                {exam.imageUrl ? (
                  <Image
                    source={{ uri: exam.imageUrl }}
                    style={styles.examImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderBox} />
                )}
              </View>
              <Text style={styles.examItemTitle} numberOfLines={1}>
                {exam.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ==================================================== */}
      {/* 2. LIVE AWS OFFER BANNER                             */}
      {/* ==================================================== */}
      {banners && banners.length > 0 && banners[currentBanner]?.imageUrl ? (
        <View style={styles.bannerCard}>
          <View style={styles.bannerImageWrapper}>
            <Image
              source={{ uri: banners[currentBanner].imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            {/* Carousel Dots */}
            {banners.length > 1 && (
              <View style={styles.carouselDotsContainer}>
                {banners.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setCurrentBanner(idx)}
                    style={[
                      styles.dot,
                      currentBanner === idx ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  // Upcoming Exams Main Card (matches exact user screenshot)
  examsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 18,
    ...shadows.sm,
  },
  examsHeader: {
    marginBottom: 16,
  },
  examsTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#073256', // Rich deep navy blue matching screenshot
    letterSpacing: -0.3,
  },
  examsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  examItem: {
    width: '47.8%',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  examImageContainer: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  examImage: {
    width: 60,
    height: 60,
  },
  placeholderBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  examItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#073256', // Bold title matching screenshot
    textAlign: 'center',
  },
  // Offer Banner Styling
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    height: 180,
    position: 'relative',
    ...shadows.sm,
  },
  bannerImageWrapper: {
    width: '100%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  carouselDotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1',
  },
});

export default HeroSection;
