import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  BookOpen,
  Play,
  Clock,
  ArrowRight,
  Video,
  Sparkles,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';

// Dedicated Card component for individual purchased course
const PurchasedCourseCard = ({ item, onOpenCourse }) => {
  const [imgError, setImgError] = useState(false);

  // Robust extraction whether item is populated, wrapped in courseId, or direct course
  const course = item?.courseId?._id
    ? item.courseId
    : item?.course
    ? item.course
    : item || {};

  const thumbnailUri =
    course?.thumbnail ||
    course?.thumbnailUrl ||
    course?.image ||
    item?.thumbnail ||
    null;

  const totalVideos = useMemo(() => {
    let count = 0;
    (course.subjects || []).forEach((sub) => {
      (sub.chapters || []).forEach((ch) => {
        count += (ch.videos || []).length;
      });
    });
    return count || (course.modules?.length ? course.modules.length : 45);
  }, [course]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onOpenCourse && onOpenCourse(course)}
      style={styles.courseCard}
    >
      {/* ── 16:9 High Definition Thumbnail ── */}
      <View style={styles.thumbnailWrapper}>
        {thumbnailUri && !imgError ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <View style={styles.fallbackIconCircle}>
              <BookOpen size={30} color="#10b981" />
            </View>
            <Text style={styles.fallbackTitle} numberOfLines={1}>
              {course.title || 'ZeroEducators Course'}
            </Text>
          </View>
        )}

        {/* Bottom-Right Duration / Videos Pill */}
        <View style={styles.durationPill}>
          <Clock size={11} color="#ffffff" />
          <Text style={styles.durationPillText}>
            {course.duration || `${totalVideos} Lectures`}
          </Text>
        </View>
      </View>

      {/* ── Card Body Details ── */}
      <View style={styles.cardBody}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title || 'Banking Foundation Batch'}
        </Text>

        {course.description ? (
          <Text style={styles.courseDesc} numberOfLines={2}>
            {course.description}
          </Text>
        ) : null}

        {/* Action Bottom Row */}
        <View style={styles.actionRow}>
          <View style={styles.statsInfo}>
            <Video size={13} color="#64748b" />
            <Text style={styles.statsInfoText}>
              {course.subjects?.length
                ? `${course.subjects.length} Subjects`
                : `${totalVideos} Lectures`}
            </Text>
          </View>

          <View style={styles.continueBtn}>
            <Play size={11} color="#ffffff" fill="#ffffff" />
            <Text style={styles.continueBtnText}>Continue</Text>
            <ArrowRight size={12} color="#ffffff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
        <View style={styles.headerBadge}>
          <Sparkles size={13} color="#10b981" />
          <Text style={styles.headerBadgeText}>MY LEARNING</Text>
        </View>
        <Text style={styles.title}>Your Courses</Text>
        <Text style={styles.subtitle}>
          Continue learning and mastering your banking concepts
        </Text>
      </View>

      {!hasCourses ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <BookOpen size={36} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Courses Found</Text>
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
          {purchasedCourses.map((item, index) => (
            <PurchasedCourseCard
              key={item?._id || item?.course?._id || item?.courseId?._id || index}
              item={item}
              onOpenCourse={onOpenCourse}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
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
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  fallbackIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  durationPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  durationPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default YourAllPurchasedCourse;
