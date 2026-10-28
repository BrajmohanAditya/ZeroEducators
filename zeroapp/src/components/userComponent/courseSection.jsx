import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Star,
  Clock,
  Users,
  Zap,
  Search,
  X,
  ChevronDown,
  Sparkles,
  BookOpen,
  Play,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { fetchLiveCourses } from '../../config/api';

// Memoized individual course card: keeps memory usage low and scrolling at 60fps on 2GB RAM
const CourseCard = React.memo(({ item, purchased, onCoursePress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onCoursePress && onCoursePress(item)}
      style={styles.courseCard}
    >
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
            fadeDuration={0}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <BookOpen size={32} color={colors.textMuted} />
          </View>
        )}
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingText}>
            {item.rating || '4.9'}
          </Text>
        </View>

        {/* Combo Badge */}
        {item.isBundle && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboBadgeText}>
              COMBO • {item.bundledCourses?.length || 2} IN 1
            </Text>
          </View>
        )}
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.isBundle && (
          <View style={styles.comboSubRow}>
            <Text style={styles.comboSubText}>
              Includes {item.bundledCourses?.length || 0} Full Courses
            </Text>
          </View>
        )}

        {/* Course Metadata (Duration & Students) */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={14} color="#64748b" />
            <Text style={styles.metaText}>1.5k students</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.metaText}>
              {item.duration || '6 Months'}
            </Text>
          </View>
        </View>

        {/* Price and Action Row */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>
              {purchased
                ? 'Enrolled'
                : item.isFree || Number(item.amount) === 0
                ? 'Course Fee'
                : 'Starting at'}
            </Text>
            <View style={styles.priceValuesRow}>
              {purchased ? (
                <Text style={[styles.amountText, { color: '#059669', fontSize: 16 }]}>
                  Active Access
                </Text>
              ) : item.isFree || Number(item.amount) === 0 ? (
                <Text style={styles.freePrice}>FREE</Text>
              ) : (
                <>
                  <Text style={styles.amountText}>
                    ₹{item.amount !== undefined ? Number(item.amount).toLocaleString() : '2,999'}
                  </Text>
                  {item.isBundle && Number(item.bundleOriginalPrice) > Number(item.amount) ? (
                    <>
                      <Text style={styles.originalAmountText}>
                        ₹{Number(item.bundleOriginalPrice).toLocaleString()}
                      </Text>
                      <View style={styles.discountPill}>
                        <Text style={styles.discountPillText}>
                          {Math.round(((item.bundleOriginalPrice - item.amount) / item.bundleOriginalPrice) * 100)}% OFF
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.originalAmountText}>
                      ₹
                      {item.amount !== undefined
                        ? Math.round(Number(item.amount) * 1.25)
                        : '3,999'}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Enroll or Continue Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onCoursePress && onCoursePress(item)}
            style={[
              styles.enrollBtn,
              purchased && { backgroundColor: '#059669' },
            ]}
          >
            {purchased ? (
              <Play size={14} color="#ffffff" fill="#ffffff" />
            ) : (
              <Zap size={14} color="#ffffff" fill="#ffffff" />
            )}
            <Text style={styles.enrollBtnText}>
              {purchased ? 'Continue' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export const CourseSection = ({
  courses: initialCourses = [],
  onCoursePress,
  user,
}) => {
  const [courses, setCourses] = useState(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(6);

  // Sync if parent passes updated live courses
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses);
    }
  }, [initialCourses]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const liveData = await fetchLiveCourses();
      if (liveData && liveData.length > 0) {
        setCourses(liveData);
      }
    } catch (err) {
      console.warn('[CourseSection] Error fetching live courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allCourses = useMemo(() => {
    return [...courses].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
      })
    );
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return allCourses;
    const q = searchQuery.toLowerCase().trim();
    return allCourses.filter(
      (course) =>
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q)
    );
  }, [allCourses, searchQuery]);

  const displayedCourses = useMemo(() => {
    if (searchQuery.trim()) return filteredCourses;
    return filteredCourses.slice(0, displayLimit);
  }, [filteredCourses, searchQuery, displayLimit]);

  const isCoursePurchased = useCallback((item) => {
    if (!user || !item?._id) return false;
    const cid = String(item._id);
    const list = user.purchasedCourse || user.purchasedCourses || [];
    return list.some((pc) => {
      if (!pc) return false;
      if (typeof pc === 'string') return pc === cid;
      if (typeof pc === 'object') {
        return (
          String(pc._id || '') === cid ||
          String(pc.id || '') === cid ||
          String(pc.courseId || '') === cid ||
          String(pc.courseId?._id || '') === cid
        );
      }
      return false;
    });
  }, [user]);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.featuredBadge}>
            <Sparkles size={13} color="#059669" />
            <Text style={styles.featuredBadgeText}>Featured Programs</Text>
          </View>
          <Text style={styles.coursesCountText}>
            ({allCourses.length} Courses Available)
          </Text>
        </View>
        <Text style={styles.title}>Explore Our Top Courses</Text>
      </View>

      {/* Search Box - Direct Filter (Matches Web Frontend, No Laggy Dropdown) */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            isFocused && styles.searchBarActive,
          ]}
        >
          <Search
            size={16}
            color={isFocused ? '#059669' : '#94a3b8'}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Filter Badge */}
      {searchQuery.trim().length > 0 && (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.activeFilterText}>
            Showing {filteredCourses.length} results for{' '}
            <Text style={styles.boldText}>"{searchQuery}"</Text>
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Skeleton */}
      {isLoading && courses.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading live courses...</Text>
        </View>
      ) : null}

      {/* Course Cards Feed */}
      <View style={styles.courseFeed}>
        {displayedCourses.length > 0 ? (
          displayedCourses.map((item) => (
            <CourseCard
              key={item._id}
              item={item}
              purchased={isCoursePurchased(item)}
              onCoursePress={onCoursePress}
            />
          ))
        ) : searchQuery.trim().length > 0 ? (
          <View style={styles.noResultsBox}>
            <BookOpen size={36} color="#cbd5e1" />
            <Text style={styles.noResultsTitle}>No courses found</Text>
            <Text style={styles.noResultsSub}>
              We couldn't find any courses matching "{searchQuery}"
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Text style={styles.clearSearchBtnText}>Show All Courses</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Load More Button for low-RAM performance */}
        {filteredCourses.length > displayLimit && !searchQuery.trim() && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDisplayLimit((prev) => prev + 6)}
              style={styles.loadMoreBtn}
            >
              <Text style={styles.loadMoreBtnText}>
                Show More Courses ({filteredCourses.length - displayLimit} remaining)
              </Text>
              <ChevronDown size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#d1fae5', // emerald-100
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46', // emerald-800
  },
  coursesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  // Search & Dropdown Box
  searchContainer: {
    position: 'relative',
    zIndex: 30,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    ...shadows.sm,
  },
  searchBarActive: {
    borderColor: '#10b981',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
    paddingVertical: 0,
  },
  iconBtn: {
    padding: 6,
  },
  noResultsBox: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
  },
  noResultsSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  clearSearchBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  activeFilterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#065f46',
  },
  boldText: {
    fontWeight: '800',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  courseFeed: {
    gap: 22,
    paddingBottom: 12,
  },
  // Main Course Card
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    ...shadows.sm,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    marginBottom: 14,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    ...shadows.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardBody: {
    paddingHorizontal: 2,
  },
  courseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 23,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
    marginTop: 4,
  },
  priceContainer: {
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  freePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  amountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  originalAmountText: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  enrollBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0a66c2', // LinkedIn / brand Blue from web frontend
    height: 46,
    borderRadius: 12,
    ...shadows.sm,
  },
  enrollBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  paginationRow: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    ...shadows.sm,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default React.memo(CourseSection);
