import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BookOpen, Play, Clock, ArrowRight } from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';

export const YourAllPurchasedCourse = ({
  purchasedCourses = [],
  onOpenCourse,
  onExploreCourses,
}) => {
  const hasCourses = purchasedCourses.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Enrolled Courses</Text>
        <Text style={styles.subtitle}>
          Continue learning and mastering your banking concepts
        </Text>
      </View>

      {!hasCourses ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <BookOpen size={36} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Enrolled Courses Yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse our curated banking batches, test series, and notes to begin preparation.
          </Text>
          <Button
            size="default"
            onPress={onExploreCourses}
            style={styles.exploreBtn}
          >
            Explore Courses
          </Button>
        </View>
      ) : (
        <View style={styles.courseList}>
          {purchasedCourses.map((item, index) => {
            const course = item.course || item;
            return (
              <TouchableOpacity
                key={course._id || index}
                activeOpacity={0.85}
                onPress={() => onOpenCourse && onOpenCourse(course)}
                style={styles.courseCard}
              >
                {course.thumbnail ? (
                  <Image
                    source={{ uri: course.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.thumbnail, { backgroundColor: '#0f172a' }]} />
                )}

                <View style={styles.cardBody}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: '35%' }]} />
                    </View>
                    <Text style={styles.progressText}>35% Completed</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <View style={styles.continueBadge}>
                      <Play size={12} color="#ffffff" fill="#ffffff" />
                      <Text style={styles.continueText}>Continue Learning</Text>
                    </View>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exploreBtn: {
    paddingHorizontal: 24,
  },
  courseList: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: '#e2e8f0',
  },
  cardBody: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  continueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
});

export default YourAllPurchasedCourse;
