import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  FileText,
  Award,
  Crown,
  Lock,
  Play,
  Search,
  CheckCircle,
  Sparkles,
} from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import { fetchLiveQuizzes, fetchLiveExams, fetchMyQuizResultsApi } from '../../../config/api';

export const QuizList = ({
  initialType = null,
  initialExamId = null,
  initialExamTitle = '',
  onStartQuiz,
  onViewResult,
  onBack,
  user,
  token,
}) => {
  const [selectedType, setSelectedType] = useState(initialType || 'All'); // 'All' | 'Free' | 'Paid'
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  const [quizzes, setQuizzes] = useState([]);
  const [exams, setExams] = useState([]);
  const [attemptedQuizMap, setAttemptedQuizMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [allExams, allQuizzes, myResults] = await Promise.all([
        fetchLiveExams(),
        fetchLiveQuizzes(),
        token ? fetchMyQuizResultsApi('', token) : Promise.resolve([]),
      ]);

      setExams(allExams || []);
      setQuizzes(allQuizzes || []);

      // Build attempted map: quizId -> result
      const resultMap = {};
      (myResults || []).forEach((r) => {
        const qId = (r.quiz?._id || r.quiz || '').toString();
        if (qId && !resultMap[qId]) {
          resultMap[qId] = r;
        }
      });
      setAttemptedQuizMap(resultMap);
    } catch (err) {
      console.warn('Error loading quiz list data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    // 1. Filter by Type
    if (selectedType === 'Free') {
      const isFree =
        quiz.quizType === 'Free' || quiz.isFreeDemo || Number(quiz.price || 0) <= 0;
      if (!isFree) return false;
    } else if (selectedType === 'Paid') {
      const isPaid =
        quiz.quizType === 'Paid' && !quiz.isFreeDemo && Number(quiz.price || 0) > 0;
      if (!isPaid) return false;
    }

    // 2. Filter by Exam
    if (selectedExamId !== 'All') {
      const examId = (quiz.examId?._id || quiz.examId || '').toString();
      if (examId !== selectedExamId) return false;
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const title = (quiz.nameOfExam || quiz.title || '').toLowerCase();
      const subject = (quiz.subject || '').toLowerCase();
      if (!title.includes(query) && !subject.includes(query)) return false;
    }

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {initialExamTitle ? `${initialExamTitle} Tests` : 'Mock Tests & Quizzes'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Practice with exam-standard questions & full solutions
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search mock tests by name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Tabs: All, Free, Premium */}
      <View style={styles.typeTabsRow}>
        {[
          { key: 'All', label: 'All Tests' },
          { key: 'Free', label: 'Free Tests' },
          { key: 'Paid', label: 'Premium Tests' },
        ].map((tab) => {
          const isActive = selectedType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setSelectedType(tab.key)}
              style={[styles.typeTab, isActive && styles.typeTabActive]}
            >
              {tab.key === 'Paid' && (
                <Crown
                  size={14}
                  color={isActive ? '#ffffff' : '#047857'}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.typeTabText,
                  isActive && styles.typeTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exam Categories Filter Pills */}
      {exams.length > 0 && (
        <View style={styles.examsFilterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examsFilterScroll}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedExamId('All')}
              style={[
                styles.examPill,
                selectedExamId === 'All' && styles.examPillActive,
              ]}
            >
              <Text
                style={[
                  styles.examPillText,
                  selectedExamId === 'All' && styles.examPillTextActive,
                ]}
              >
                All Exams
              </Text>
            </TouchableOpacity>

            {exams.map((exam) => {
              const isSelected = selectedExamId === exam._id?.toString();
              return (
                <TouchableOpacity
                  key={exam._id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedExamId(exam._id?.toString())}
                  style={[styles.examPill, isSelected && styles.examPillActive]}
                >
                  <Text
                    style={[
                      styles.examPillText,
                      isSelected && styles.examPillTextActive,
                    ]}
                  >
                    {exam.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Quizzes List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {filteredQuizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <FileText size={38} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Mock Tests Found</Text>
              <Text style={styles.emptyDesc}>
                Try selecting a different filter or search query.
              </Text>
            </View>
          ) : (
            filteredQuizzes.map((quiz, index) => {
              const qId = quiz._id?.toString();
              const attempted = attemptedQuizMap[qId];
              const isFree =
                quiz.quizType === 'Free' ||
                quiz.isFreeDemo ||
                Number(quiz.price || 0) <= 0;

              return (
                <View key={quiz._id || index} style={styles.quizCard}>
                  {/* Card Top Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeRow}>
                      {isFree ? (
                        <View style={styles.freeBadge}>
                          <Sparkles size={11} color="#15803d" />
                          <Text style={styles.freeBadgeText}>FREE DEMO</Text>
                        </View>
                      ) : (
                        <View style={styles.premiumBadge}>
                          <Crown size={11} color="#047857" />
                          <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                        </View>
                      )}

                      {attempted && (
                        <View style={styles.attemptedBadge}>
                          <CheckCircle size={11} color="#2563eb" />
                          <Text style={styles.attemptedBadgeText}>ATTEMPTED</Text>
                        </View>
                      )}
                    </View>

                    {quiz.language ? (
                      <Text style={styles.languageText}>{quiz.language}</Text>
                    ) : null}
                  </View>

                  {/* Quiz Title */}
                  <Text style={styles.quizTitle}>
                    {quiz.nameOfExam || quiz.title || 'Full Length Mock Test'}
                  </Text>

                  {/* Meta Pills (Questions, Duration, Marks) */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="#64748b" />
                      <Text style={styles.metaText}>
                        {quiz.duration || 60} Mins
                      </Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <FileText size={14} color="#64748b" />
                      <Text style={styles.metaText}>
                        {quiz.totalQuestions || quiz.questions?.length || 100} Qs
                      </Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Award size={14} color="#64748b" />
                      <Text style={styles.metaText}>
                        {quiz.totalMarks || 100} Marks
                      </Text>
                    </View>
                  </View>

                  {/* Action Row */}
                  <View style={styles.actionRow}>
                    {attempted ? (
                      <View style={styles.actionButtonsAttempted}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            onViewResult &&
                            onViewResult(quiz._id, attempted, quiz)
                          }
                          style={styles.viewResultBtn}
                        >
                          <Text style={styles.viewResultBtnText}>
                            View Analysis & Solutions
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => onStartQuiz && onStartQuiz(quiz)}
                          style={styles.reattemptBtn}
                        >
                          <Text style={styles.reattemptBtnText}>Re-attempt</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => onStartQuiz && onStartQuiz(quiz)}
                        style={styles.startTestBtn}
                      >
                        <Play size={16} color="#ffffff" fill="#ffffff" />
                        <Text style={styles.startTestBtnText}>Start Test</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 2,
  },

  // Type Tabs
  typeTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  typeTabActive: {
    backgroundColor: '#073256',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typeTabTextActive: {
    color: '#ffffff',
  },

  // Exams Filter Pills
  examsFilterWrap: {
    backgroundColor: '#ffffff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  examsFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  examPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  examPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  examPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '800',
  },

  // List
  listContent: {
    padding: 16,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  // Quiz Card
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.3,
  },
  attemptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attemptedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.3,
  },
  languageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Action Buttons
  actionRow: {
    width: '100%',
  },
  startTestBtn: {
    backgroundColor: '#073256',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    ...shadows.sm,
  },
  startTestBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionButtonsAttempted: {
    flexDirection: 'row',
    gap: 10,
  },
  viewResultBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewResultBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  reattemptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reattemptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

export default QuizList;
