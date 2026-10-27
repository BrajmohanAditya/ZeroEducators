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
  GraduationCap,
  Layers,
  CheckCircle,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../../components/ui/button';

// Dedicated Card component for individual purchased course
const PurchasedCourseCard = ({ item, onOpenCourse }) => {
  const [imgError, setImgError] = useState(false);

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
      {/* ── 16:9 Thumbnail ── */}
      <View style={styles.thumbnailWrapper}>
        {thumbnailUri && !imgError ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            fadeDuration={0}
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

        <View style={styles.durationPill}>
          <Clock size={11} color="#ffffff" />
          <Text style={styles.durationPillText}>
            {course.duration || `${totalVideos} Lectures`}
          </Text>
        </View>

        <View style={styles.badgeTopLeft}>
          <BookOpen size={10} color="#ffffff" />
          <Text style={styles.badgeTopLeftText}>COURSE</Text>
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

// Dedicated Card component for individual purchased or course-linked exam
const PurchasedExamCard = ({ item, onOpenExam }) => {
  const [imgError, setImgError] = useState(false);
  const exam = item || {};

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onOpenExam && onOpenExam(exam)}
      style={styles.courseCard}
    >
      {/* ── Banner Section ── */}
      <View style={styles.examBannerWrapper}>
        <View style={styles.examTopRow}>
          <View style={styles.badgeTopLeftExam}>
            <GraduationCap size={11} color="#818cf8" />
            <Text style={styles.badgeTopLeftExamText}>MOCK SERIES</Text>
          </View>

          {exam.category ? (
            <View style={styles.examCategoryPill}>
              <Text style={styles.examCategoryPillText}>{exam.category}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.examCenterBox}>
          <View style={styles.examLogoCircle}>
            {exam.logoUrl && !imgError ? (
              <Image
                source={{ uri: exam.logoUrl }}
                style={styles.examLogoImg}
                resizeMode="contain"
                fadeDuration={0}
                onError={() => setImgError(true)}
              />
            ) : (
              <GraduationCap size={24} color="#4f46e5" />
            )}
          </View>
          <View style={styles.examMetaBox}>
            <Text style={styles.examTestsCount} numberOfLines={1}>
              {exam.totalQuizzes
                ? `${exam.totalQuizzes} Tests Available`
                : 'Full Test Series'}
            </Text>
            <Text style={styles.examInterfaceText}>Live Exam Interface</Text>
          </View>
        </View>
      </View>

      {/* ── Card Body Details ── */}
      <View style={styles.cardBody}>
        {/* Source Badge (Course Linked or Direct) */}
        {exam.accessSource === 'course_linked' ? (
          <View style={styles.linkedBadge}>
            <Sparkles size={11} color="#7c3aed" />
            <Text style={styles.linkedBadgeText} numberOfLines={1}>
              Included with {exam.linkedCourseTitle || 'Video Course'}
            </Text>
          </View>
        ) : (
          <View style={styles.directBadge}>
            <CheckCircle size={11} color="#059669" />
            <Text style={styles.directBadgeText}>Direct Enrolled</Text>
          </View>
        )}

        <Text style={styles.courseTitle} numberOfLines={2}>
          {exam.title || 'Mock Test Series'}
        </Text>

        {exam.description ? (
          <Text style={styles.courseDesc} numberOfLines={2}>
            {exam.description}
          </Text>
        ) : (
          <Text style={styles.courseDesc} numberOfLines={2}>
            High-yield questions with sectional timings & solutions.
          </Text>
        )}

        <View style={styles.actionRow}>
          <View style={styles.statsInfo}>
            <GraduationCap size={13} color="#64748b" />
            <Text style={styles.statsInfoText}>
              {exam.totalQuizzes ? `${exam.totalQuizzes} Mocks` : 'Package Unlocked'}
            </Text>
          </View>

          <View style={[styles.continueBtn, styles.attemptBtn]}>
            <Text style={styles.continueBtnText}>Attempt</Text>
            <ArrowRight size={12} color="#ffffff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const YourAllPurchasedCourse = ({
  purchasedCourses = [],
  purchasedExams = [],
  onOpenCourse,
  onOpenExam,
  onExploreCourses,
  onExploreExams,
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'courses' | 'exams'

  const totalCount = purchasedCourses.length + purchasedExams.length;
  const isAllEmpty = totalCount === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      overScrollMode="never"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Sparkles size={13} color="#10b981" />
          <Text style={styles.headerBadgeText}>MY ENROLLED LEARNING</Text>
        </View>
        <Text style={styles.title}>Your Courses & Tests</Text>
        <Text style={styles.subtitle}>
          Continue learning from your enrolled video courses and mock test packages
        </Text>
      </View>

      {/* Empty State */}
      {isAllEmpty ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <BookOpen size={36} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Learning Materials Yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse our curated banking batches, test series, and notes to begin preparation.
          </Text>
          <View style={styles.emptyActionsRow}>
            <Button
              size="default"
              onPress={onExploreCourses}
              style={styles.exploreBtn}
            >
              Explore Batches
            </Button>
            {onExploreExams && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onExploreExams}
                style={styles.exploreExamsBtn}
              >
                <Text style={styles.exploreExamsBtnText}>Test Series</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <>
          {/* Segmented Filter Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('all')}
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            >
              <Layers size={13} color={activeTab === 'all' ? '#0f172a' : '#64748b'} />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'all' && styles.tabBtnTextActive,
                ]}
              >
                All
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'all' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'all' && styles.tabCountTextActive,
                  ]}
                >
                  {totalCount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('courses')}
              style={[styles.tabBtn, activeTab === 'courses' && styles.tabBtnActive]}
            >
              <BookOpen size={13} color={activeTab === 'courses' ? '#047857' : '#64748b'} />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'courses' && styles.tabBtnTextActive,
                ]}
              >
                Courses
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'courses' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'courses' && styles.tabCountTextActive,
                  ]}
                >
                  {purchasedCourses.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('exams')}
              style={[styles.tabBtn, activeTab === 'exams' && styles.tabBtnActive]}
            >
              <GraduationCap size={13} color={activeTab === 'exams' ? '#4338ca' : '#64748b'} />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'exams' && styles.tabBtnTextActive,
                ]}
              >
                Mock Tests
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'exams' && styles.tabCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'exams' && styles.tabCountTextActive,
                  ]}
                >
                  {purchasedExams.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* List Area */}
          <View style={styles.courseList}>
            {/* Courses Section */}
            {(activeTab === 'all' || activeTab === 'courses') &&
              purchasedCourses.map((item, index) => (
                <PurchasedCourseCard
                  key={item?._id || item?.course?._id || item?.courseId?._id || index}
                  item={item}
                  onOpenCourse={onOpenCourse}
                />
              ))}

            {/* Mock Tests Section */}
            {(activeTab === 'all' || activeTab === 'exams') &&
              purchasedExams.map((exam, index) => (
                <PurchasedExamCard
                  key={exam._id || exam.id || index}
                  item={exam}
                  onOpenExam={onOpenExam}
                />
              ))}

            {/* Empty Tab State */}
            {activeTab === 'courses' && purchasedCourses.length === 0 && (
              <View style={styles.subEmptyCard}>
                <BookOpen size={28} color="#94a3b8" />
                <Text style={styles.subEmptyText}>No Video Courses Enrolled</Text>
              </View>
            )}

            {activeTab === 'exams' && purchasedExams.length === 0 && (
              <View style={styles.subEmptyCard}>
                <GraduationCap size={28} color="#94a3b8" />
                <Text style={styles.subEmptyText}>No Mock Tests Assigned</Text>
              </View>
            )}
          </View>
        </>
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
    marginBottom: 16,
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    padding: 3,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 11,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    ...shadows.xs,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  tabCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  tabCountBadgeActive: {
    backgroundColor: '#f1f5f9',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#0f172a',
  },

  // Cards
  courseList: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 185,
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
    backgroundColor: '#061a33',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbackIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  durationPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeTopLeftText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
  },

  // Exam Banner
  examBannerWrapper: {
    width: '100%',
    height: 130,
    backgroundColor: '#1e1b4b',
    padding: 12,
    justifyContent: 'space-between',
  },
  examTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTopLeftExam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeTopLeftExamText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
  examCategoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examCategoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  examCenterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  examLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  examLogoImg: {
    width: '100%',
    height: '100%',
  },
  examMetaBox: {
    flex: 1,
  },
  examTestsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e0e7ff',
  },
  examInterfaceText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Origin badges
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  linkedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6d28d9',
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  directBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  cardBody: {
    padding: 14,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 4,
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
    paddingTop: 10,
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
    fontWeight: '600',
    color: '#64748b',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  attemptBtn: {
    backgroundColor: '#4f46e5',
  },
  continueBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Empty
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
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  exploreBtn: {
    minWidth: 130,
  },
  exploreExamsBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreExamsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  subEmptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginVertical: 10,
  },
  subEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});

export default YourAllPurchasedCourse;
