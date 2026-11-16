import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {
  ChevronDown,
  LayoutGrid,
  Sparkles,
  Video,
  FileText,
  Layers,
  X,
  ArrowRight,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export const CategoryBifurcationBar = ({
  categories = [],
  selectedCategory = null,
  onSelectCategory,
  onClearCategory,
  onCoursePress,
}) => {
  const [modalCategory, setModalCategory] = useState(null);

  if (!categories || categories.length === 0) {
    return null;
  }

  const handlePillPress = (cat) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    // Open the dropdown/modal sheet
    setModalCategory(cat);
  };

  const handleAllCoursesPress = () => {
    if (onClearCategory) {
      onClearCategory();
    }
    setModalCategory(null);
  };

  const handleCourseItemPress = (course) => {
    setModalCategory(null);
    if (onCoursePress) {
      onCoursePress(course);
    }
  };

  const isAllActive = !selectedCategory;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        overScrollMode="never"
      >
        {/* 1. "All Courses" Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAllCoursesPress}
          style={[
            styles.pill,
            isAllActive ? styles.activePill : styles.inactivePill,
          ]}
        >
          <LayoutGrid
            size={13}
            color={isAllActive ? '#ffffff' : '#334155'}
            style={styles.pillIcon}
          />
          <Text
            style={[
              styles.pillText,
              isAllActive ? styles.activePillText : styles.inactivePillText,
            ]}
          >
            All Courses
          </Text>
        </TouchableOpacity>

        {/* Separator Pipe */}
        <View style={styles.pipeSeparator}>
          <Text style={styles.pipeText}>|</Text>
        </View>

        {/* 2. Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategory?._id === cat._id;
          const coursesCount = (cat.courses || []).length;

          return (
            <TouchableOpacity
              key={cat._id}
              activeOpacity={0.8}
              onPress={() => handlePillPress(cat)}
              style={[
                styles.pill,
                isSelected ? styles.activePill : styles.inactivePill,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.activePillText : styles.inactivePillText,
                ]}
                numberOfLines={1}
              >
                {cat.title}
              </Text>
              <ChevronDown
                size={13}
                color={isSelected ? '#ffffff' : '#64748b'}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Popup / Dropdown Modal Sheet */}
      <Modal
        visible={Boolean(modalCategory)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalCategory(null)}
      >
        <TouchableWithoutFeedback onPress={() => setModalCategory(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Sparkles size={16} color="#f59e0b" />
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {modalCategory?.title}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {(modalCategory?.courses || []).length} Courses
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalCategory(null)}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Courses List */}
                <ScrollView
                  style={styles.coursesList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.coursesListContent}
                >
                  {(modalCategory?.courses || []).length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No courses added to this category yet.
                      </Text>
                    </View>
                  ) : (
                    modalCategory.courses.map((course) => {
                      const isBundle = course.isBundle;
                      const isPdf = course.courseType === 'pdf';

                      return (
                        <TouchableOpacity
                          key={course._id}
                          activeOpacity={0.8}
                          onPress={() => handleCourseItemPress(course)}
                          style={styles.courseItem}
                        >
                          {/* Type Icon Badge */}
                          <View
                            style={[
                              styles.typeBadge,
                              isBundle
                                ? styles.bundleBadge
                                : isPdf
                                ? styles.pdfBadge
                                : styles.videoBadge,
                            ]}
                          >
                            {isBundle ? (
                              <Layers size={14} color="#7c3aed" />
                            ) : isPdf ? (
                              <FileText size={14} color="#d97706" />
                            ) : (
                              <Video size={14} color="#073b75" />
                            )}
                          </View>

                          {/* Info */}
                          <View style={styles.courseInfo}>
                            <Text style={styles.courseItemTitle} numberOfLines={2}>
                              {course.title}
                            </Text>
                            <View style={styles.courseItemMeta}>
                              <Text style={styles.courseItemType}>
                                {isBundle ? 'BUNDLE' : isPdf ? 'PDF COURSE' : 'VIDEO'}
                              </Text>
                              {course.amount > 0 ? (
                                <Text style={styles.courseItemPrice}>
                                  ₹{course.amount}
                                </Text>
                              ) : course.isFree ? (
                                <Text style={styles.courseItemFree}>FREE</Text>
                              ) : null}
                            </View>
                          </View>

                          <ArrowRight size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                {/* Bottom Dismiss / Browse Action */}
                {(modalCategory?.courses || []).length > 0 && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setModalCategory(null)}
                      style={styles.viewAllBtn}
                    >
                      <Text style={styles.viewAllBtnText}>
                        View in Courses Section
                      </Text>
                      <ArrowRight size={14} color="#073b75" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: 44,
    justifyContent: 'center',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  activePill: {
    backgroundColor: '#073b75',
  },
  inactivePill: {
    backgroundColor: '#f8fafc',
  },
  pillIcon: {
    marginRight: 5,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activePillText: {
    color: '#ffffff',
  },
  inactivePillText: {
    color: '#334155',
  },
  pipeSeparator: {
    paddingHorizontal: 4,
    marginRight: 6,
  },
  pipeText: {
    color: '#cbd5e1',
    fontWeight: '800',
    fontSize: 14,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 6,
    marginRight: 8,
    maxWidth: 180,
  },
  countBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#073b75',
  },
  closeBtn: {
    padding: 4,
  },
  coursesList: {
    maxHeight: 340,
  },
  coursesListContent: {
    padding: 12,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bundleBadge: {
    backgroundColor: '#f3e8ff',
  },
  pdfBadge: {
    backgroundColor: '#fef3c7',
  },
  videoBadge: {
    backgroundColor: '#e0f2fe',
  },
  courseInfo: {
    flex: 1,
    marginRight: 8,
  },
  courseItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 16,
  },
  courseItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  courseItemType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  courseItemPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  courseItemFree: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#073b75',
    marginRight: 6,
  },
});

export default React.memo(CategoryBifurcationBar);

