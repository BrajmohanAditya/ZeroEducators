import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  BookCheck,
  Clock,
  FileText,
  Award,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

const sampleQuizzes = [
  {
    _id: '1',
    title: 'SBI PO Prelims Full Mock Test 01',
    category: 'Full Mock',
    questionsCount: 100,
    durationMinutes: 60,
    totalMarks: 100,
    isFree: true,
  },
  {
    _id: '2',
    title: 'IBPS PO 2026 Target Speed Mock Test',
    category: 'Prelims Mock',
    questionsCount: 100,
    durationMinutes: 60,
    totalMarks: 100,
    isFree: true,
  },
  {
    _id: '3',
    title: 'Quantitative Aptitude Sectional Speed Test',
    category: 'Sectional',
    questionsCount: 35,
    durationMinutes: 20,
    totalMarks: 35,
    isFree: false,
  },
  {
    _id: '4',
    title: 'Reasoning Ability & Puzzle Booster Test',
    category: 'Sectional',
    questionsCount: 35,
    durationMinutes: 20,
    totalMarks: 35,
    isFree: false,
  },
];

export const QuizeDetail = ({ onStartQuiz }) => {
  const [filter, setFilter] = useState('All'); // 'All', 'Free', 'Sectional'

  const filtered = sampleQuizzes.filter((q) => {
    if (filter === 'Free') return q.isFree;
    if (filter === 'Sectional') return q.category === 'Sectional';
    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <BookCheck size={16} color={colors.primary} />
          <Text style={styles.badgeText}>EXAM SIMULATOR</Text>
        </View>
        <Text style={styles.title}>All Banking Mock Tests</Text>
        <Text style={styles.subtitle}>
          Latest pattern tests with instant all-India rank and detailed solutions
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['All', 'Free', 'Sectional'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[
              styles.filterPill,
              filter === tab && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
              ]}
            >
              {tab === 'All' ? 'All Tests' : tab === 'Free' ? 'Free Mocks' : 'Sectional'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test Cards List */}
      <View style={styles.list}>
        {filtered.map((test) => (
          <View key={test._id} style={styles.testCard}>
            <View style={styles.cardHeader}>
              <Badge variant={test.isFree ? 'success' : 'accent'}>
                {test.isFree ? 'FREE TEST' : 'PREMIUM'}
              </Badge>
              <Text style={styles.categoryText}>{test.category}</Text>
            </View>

            <Text style={styles.testTitle}>{test.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <FileText size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{test.questionsCount} Questions</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{test.durationMinutes} Mins</Text>
              </View>
              <View style={styles.metaItem}>
                <Award size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{test.totalMarks} Marks</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.languageText}>English & Hindi</Text>
              <Button
                size="sm"
                variant={test.isFree ? 'default' : 'secondary'}
                onPress={() => onStartQuiz && onStartQuiz(test)}
                style={styles.startBtn}
              >
                {test.isFree ? 'Start Test' : 'Unlock Mock'}
              </Button>
            </View>
          </View>
        ))}
      </View>
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
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 4,
    letterSpacing: 0.5,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    gap: 14,
  },
  testCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
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
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  languageText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  startBtn: {
    paddingHorizontal: 18,
  },
});

export default QuizeDetail;
