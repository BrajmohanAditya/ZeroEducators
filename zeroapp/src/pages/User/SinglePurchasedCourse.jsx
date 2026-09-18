import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Play,
  FileText,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
  Share2,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { Badge } from '../../components/ui/badge';

const { width } = Dimensions.get('window');

const sampleCurriculum = [
  {
    id: 'ch-1',
    title: 'Chapter 01: Speed Math & Calculation Shortcuts',
    lectures: [
      { id: 'l-1', title: '1. Fast Multiplication & Vedic Math', duration: '45 mins', completed: true },
      { id: 'l-2', title: '2. Square Roots & Cube Roots in 5 Seconds', duration: '38 mins', completed: true },
      { id: 'l-3', title: '3. Fraction to Percentage Conversion', duration: '52 mins', completed: false },
    ],
    notes: [
      { id: 'n-1', title: 'Speed Math Formula Revision Sheet.pdf', pages: '12 Pages' },
    ],
  },
  {
    id: 'ch-2',
    title: 'Chapter 02: Quadratic Equations for SBI PO',
    lectures: [
      { id: 'l-4', title: '1. Sign Method & Direct Root Finding', duration: '50 mins', completed: false },
      { id: 'l-5', title: '2. High Level Root Comparison for Mains', duration: '62 mins', completed: false },
    ],
    notes: [
      { id: 'n-2', title: 'Quadratic Equations 100 Practice Qs.pdf', pages: '18 Pages' },
    ],
  },
];

export const SinglePurchasedCourse = ({ course, onBack }) => {
  const [activeLecture, setActiveLecture] = useState(sampleCurriculum[0].lectures[0]);
  const [expandedChapters, setExpandedChapters] = useState({ 'ch-1': true });

  const toggleChapter = (id) => {
    setExpandedChapters({
      ...expandedChapters,
      [id]: !expandedChapters[id],
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {course?.title || 'SBI PO Foundation Batch 2026'}
        </Text>
      </View>

      {/* Video Player Display Container */}
      <View style={styles.playerContainer}>
        <View style={styles.playerPlaceholder}>
          <View style={styles.playIconCircle}>
            <Play size={28} color="#ffffff" fill="#ffffff" />
          </View>
          <Text style={styles.playingTitle} numberOfLines={1}>
            {activeLecture.title}
          </Text>
          <View style={styles.playerSecurityBadge}>
            <Text style={styles.securityText}>DRM SECURE STREAMING • 1080P</Text>
          </View>
        </View>
      </View>

      {/* Course Curriculum & Notes Scroll */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.curriculumHeader}>
          <Text style={styles.sectionTitle}>Course Curriculum</Text>
          <Text style={styles.sectionSubtitle}>
            Watch recorded lectures and download PDF notes
          </Text>
        </View>

        {sampleCurriculum.map((chapter) => {
          const isExpanded = expandedChapters[chapter.id];
          return (
            <View key={chapter.id} style={styles.chapterCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleChapter(chapter.id)}
                style={styles.chapterHeader}
              >
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.chapterBody}>
                  {/* Lectures */}
                  {chapter.lectures.map((lec) => {
                    const isSelected = activeLecture.id === lec.id;
                    return (
                      <TouchableOpacity
                        key={lec.id}
                        activeOpacity={0.75}
                        onPress={() => setActiveLecture(lec)}
                        style={[
                          styles.lectureRow,
                          isSelected && styles.lectureRowActive,
                        ]}
                      >
                        <View style={styles.lectureIconBox}>
                          {lec.completed ? (
                            <CheckCircle size={18} color={colors.success} />
                          ) : (
                            <Play
                              size={16}
                              color={isSelected ? colors.primary : colors.textMuted}
                            />
                          )}
                        </View>
                        <View style={styles.lectureDetails}>
                          <Text
                            style={[
                              styles.lectureTitle,
                              isSelected && styles.lectureTitleActive,
                            ]}
                          >
                            {lec.title}
                          </Text>
                          <Text style={styles.lectureDuration}>
                            {lec.duration}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Chapter PDF Notes */}
                  {chapter.notes.map((note) => (
                    <View key={note.id} style={styles.noteRow}>
                      <FileText size={18} color={colors.primary} />
                      <View style={styles.noteDetails}>
                        <Text style={styles.noteTitle}>{note.title}</Text>
                        <Text style={styles.notePages}>{note.pages}</Text>
                      </View>
                      <TouchableOpacity style={styles.downloadBtn}>
                        <Download size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
    marginRight: 10,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  playerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#0f172a',
  },
  playerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...shadows.md,
  },
  playingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    maxWidth: width - 40,
  },
  playerSecurityBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  curriculumHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  chapterBody: {
    padding: 12,
  },
  lectureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  lectureRowActive: {
    backgroundColor: colors.primaryLight,
  },
  lectureIconBox: {
    marginRight: 12,
  },
  lectureDetails: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lectureTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  lectureDuration: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  noteDetails: {
    flex: 1,
    marginLeft: 10,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  notePages: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  downloadBtn: {
    padding: 8,
  },
});

export default SinglePurchasedCourse;
