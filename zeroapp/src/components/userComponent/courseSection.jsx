import React, { useState, useEffect, useMemo } from 'react';
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

export const CourseSection = ({
  courses: initialCourses = [],
  onCoursePress,
  user,
}) => {
  const [courses, setCourses] = useState(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync if parent passes updated live courses
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses);
    } else {
      loadCourses();
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

  const isCoursePurchased = (item) => {
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
  };

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

      {/* Search Dropdown Component */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            isDropdownOpen && styles.searchBarActive,
          ]}
        >
          <Search size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search courses or click for all..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.iconBtn}
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            style={styles.iconBtn}
          >
            <ChevronDown
              size={16}
              color={isDropdownOpen ? '#059669' : '#64748b'}
              style={isDropdownOpen ? styles.chevronRotated : null}
            />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu showing courses */}
        {isDropdownOpen && (
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>
                {searchQuery.trim()
                  ? `Matching Courses (${filteredCourses.length})`
                  : `All Available Courses (${allCourses.length})`}
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.showAllText}>Show all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dropdownList}>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <TouchableOpacity
                    key={course._id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsDropdownOpen(false);
                      if (onCoursePress) onCoursePress(course);
                    }}
                    style={styles.dropdownItem}
                  >
                    {course.thumbnail ? (
                      <Image
                        source={{ uri: course.thumbnail }}
                        style={styles.dropdownThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.dropdownThumbPlaceholder} />
                    )}

                    <View style={styles.dropdownItemInfo}>
                      <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                        {course.title}
                      </Text>
                      <View style={styles.dropdownItemMeta}>
                        <Text style={styles.dropdownMetaText}>
                          {course.duration || '12 hrs'}
                        </Text>
                        <Text style={styles.dropdownMetaDot}>•</Text>
                        <Text style={styles.dropdownItemPrice}>
                          {course.isFree || Number(course.amount) === 0
                            ? 'FREE'
                            : `₹${course.amount}`}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.dropdownViewAction,
                        isCoursePurchased(course) && { color: '#059669', fontWeight: '800' },
                      ]}
                    >
                      {isCoursePurchased(course) ? 'Continue →' : 'View →'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyDropdown}>
                  <BookOpen size={24} color="#cbd5e1" />
                  <Text style={styles.emptyDropdownText}>
                    No courses found matching "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
        {filteredCourses.map((item) => {
          const purchased = isCoursePurchased(item);
          return (
            <TouchableOpacity
              key={item._id}
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
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {item.title}
                </Text>

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
                <View style={styles.actionRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>
                      {purchased
                        ? 'Enrolled'
                        : item.isFree || Number(item.amount) === 0
                        ? 'Course Fee'
                        : 'Starting at'}
                    </Text>
                    <View style={styles.priceRow}>
                      {purchased ? (
                        <Text style={[styles.amountText, { color: '#059669', fontSize: 16 }]}>
                          Active Access
                        </Text>
                      ) : item.isFree || Number(item.amount) === 0 ? (
                        <Text style={styles.freeText}>FREE</Text>
                      ) : (
                        <>
                          <Text style={styles.amountText}>
                            ₹{item.amount !== undefined ? item.amount : '2,999'}
                          </Text>
                          <Text style={styles.originalAmountText}>
                            ₹
                            {item.amount !== undefined
                              ? Math.round(Number(item.amount) * 1.25)
                              : '3,999'}
                          </Text>
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
        })}
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
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.lg,
  },
  dropdownHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  showAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  dropdownThumb: {
    width: 48,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  dropdownThumbPlaceholder: {
    width: 48,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dropdownMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  dropdownMetaDot: {
    fontSize: 11,
    color: '#94a3b8',
  },
  dropdownItemPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  dropdownViewAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  emptyDropdown: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyDropdownText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
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
  courseList: {
    gap: 18,
  },
  // Main Course Card
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  priceValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  freePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  amountText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },
  originalAmountText: {
    fontSize: 13,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a66c2', // LinkedIn / brand Blue from web frontend
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    ...shadows.sm,
  },
  enrollBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default CourseSection;
