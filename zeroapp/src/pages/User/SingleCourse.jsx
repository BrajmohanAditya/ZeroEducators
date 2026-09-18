import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Star,
  Clock,
  BookOpen,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const SingleCourse = ({ course, onBack, onEnroll }) => {
  const currentCourse = course || {};

  const highlights = [
    '200+ Live & Recorded Interactive Classes',
    '80+ Downloadable PDF Study Notes',
    '50+ Full-Length & Sectional Mock Tests',
    'Special Doubt Clearing Sessions by Mentors',
    'Previous Year Questions (PYQs) Analysis',
    'Course Valid on Mobile App and Web Portal',
  ];

  return (
    <View style={styles.container}>
      {/* Top Header with Back Arrow */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Course Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Course Thumbnail Banner */}
        <View style={styles.imageContainer}>
          {currentCourse.thumbnail ? (
            <Image
              source={{ uri: currentCourse.thumbnail }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          <View style={styles.badgeOverlay}>
            <Text style={styles.badgeOverlayText}>
              {currentCourse.badge || 'Banking Foundation'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          {/* Rating & Duration Row */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>
                {currentCourse.rating || '4.9'} ({currentCourse.studentsCount || '3.4k'} ratings)
              </Text>
            </View>
            <View style={styles.validityBadge}>
              <Clock size={13} color={colors.primary} />
              <Text style={styles.validityText}>
                {currentCourse.duration || '1 Year'}
              </Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{currentCourse.title}</Text>
          <Text style={styles.description}>{currentCourse.description}</Text>

          {/* What You Will Get */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeadingRow}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.sectionHeading}>What This Course Includes</Text>
            </View>

            {highlights.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Purchase Bar */}
      <View style={styles.bottomBar}>
        <View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{currentCourse.price || 1999}</Text>
            {currentCourse.originalPrice && (
              <Text style={styles.originalPrice}>₹{currentCourse.originalPrice}</Text>
            )}
          </View>
          <Text style={styles.taxText}>Special Discount Applied</Text>
        </View>

        <Button
          size="lg"
          onPress={() => onEnroll && onEnroll(currentCourse)}
          style={styles.enrollButton}
        >
          Enroll Now
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 210,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginLeft: 4,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  validityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...shadows.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  taxText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  enrollButton: {
    paddingHorizontal: 28,
  },
});

export default SingleCourse;
