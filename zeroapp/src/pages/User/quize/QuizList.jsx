import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  FileText,
  Award,
  Crown,
  Play,
  Search,
  CheckCircle,
  Sparkles,
  Folder,
  ChevronRight,
  Bookmark,
  Brain,
  Calculator,
  Globe,
  Compass,
  Zap,
  Lock,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import {
  fetchLiveQuizzes,
  fetchLiveExams,
  fetchMyQuizResultsApi,
  fetchMyPurchasedExamsApi,
} from '../../../config/api';

export const QuizList = ({
  initialType = null,
  initialExamId = null,
  initialExamTitle = '',
  onStartQuiz,
  onViewResult,
  onBack,
  user,
  token,
  onNavigate,
}) => {
  // Navigation & Tab States
  const [activeMainTab, setActiveMainTab] = useState('Mock Tests'); // 'Mock Tests' | 'PYPs'
  const [activeFolder, setActiveFolder] = useState(null); // null (Folder list) | folderName string
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || 'All');

  // Data States
  const [quizzes, setQuizzes] = useState([]);
  const [exams, setExams] = useState([]);
  const [myPurchasedIds, setMyPurchasedIds] = useState([]);
  const [attemptedQuizMap, setAttemptedQuizMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [allExams, allQuizzes, myResults, myPurchased] = await Promise.all([
        fetchLiveExams(),
        fetchLiveQuizzes(),
        token ? fetchMyQuizResultsApi('', token) : Promise.resolve([]),
        token ? fetchMyPurchasedExamsApi(token) : Promise.resolve([]),
      ]);

      setExams(allExams || []);
      setQuizzes(allQuizzes || []);

      // Build purchased exams set
      const purchasedIds = (myPurchased || []).map((e) =>
        String(e._id || e.id || e)
      );
      if (user?.purchasedExams) {
        user.purchasedExams.forEach((pe) => {
          purchasedIds.push(String(pe._id || pe.id || pe));
        });
      }
      setMyPurchasedIds(Array.from(new Set(purchasedIds)));

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

  useEffect(() => {
    if (initialExamId && initialExamId !== 'All') {
      setSelectedExamId(initialExamId);
      setActiveFolder(null);
    }
  }, [initialExamId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Find Current Selected Exam details
  const currentExam = useMemo(() => {
    if (!selectedExamId || selectedExamId === 'All') {
      if (exams.length > 0) return exams[0];
      return { title: initialExamTitle || 'Mock Test Series' };
    }
    return (
      exams.find((e) => String(e._id || e.id) === String(selectedExamId)) || {
        title: initialExamTitle || 'Mock Test Series',
      }
    );
  }, [exams, selectedExamId, initialExamTitle]);

  const currentExamId = currentExam?._id || currentExam?.id || selectedExamId;

  // Check if current exam package is unlocked
  const isCurrentExamPurchased = useMemo(() => {
    if (initialType === 'Paid') return true;
    if (!currentExamId || currentExamId === 'All') return false;
    const isFree = Number(currentExam?.price || 0) <= 0;
    if (isFree) return true;
    return myPurchasedIds.includes(String(currentExamId));
  }, [currentExam, currentExamId, myPurchasedIds, initialType]);

  // Quizzes belonging to this exam
  const examQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (!currentExamId || currentExamId === 'All') return true;
      const qExamId = (q.examId?._id || q.examId || '').toString();
      const examTitle = (currentExam?.title || initialExamTitle || '').trim().toLowerCase();
      const quizExamName = (q.nameOfExam || '').trim().toLowerCase();
      const nameMatch = examTitle && quizExamName && (quizExamName.includes(examTitle) || examTitle.includes(quizExamName));
      return qExamId === String(currentExamId) || nameMatch;
    });
  }, [quizzes, currentExamId, currentExam, initialExamTitle]);

  // Quizzes filtered by activeMainTab ('Mock Tests' vs 'PYPs')
  const quizzesInCurrentTab = useMemo(() => {
    return examQuizzes.filter((q) => {
      const qTab = q.testType || 'Mock Tests';
      return qTab === activeMainTab;
    });
  }, [examQuizzes, activeMainTab]);

  // Total counts for tabs
  const mockTestsCount = useMemo(() => {
    return examQuizzes.filter((q) => (q.testType || 'Mock Tests') === 'Mock Tests').length;
  }, [examQuizzes]);

  const pypsCount = useMemo(() => {
    return examQuizzes.filter((q) => q.testType === 'PYPs').length;
  }, [examQuizzes]);

  // Group into Folders (Sub-Categories) matching web frontend
  const categoryFolders = useMemo(() => {
    const map = new Map();
    quizzesInCurrentTab.forEach((q) => {
      const folderName = q.subCategory?.trim() || 'Full Length Mock Tests';
      if (!map.has(folderName)) {
        map.set(folderName, {
          name: folderName,
          tests: [],
          freeCount: 0,
        });
      }
      const entry = map.get(folderName);
      entry.tests.push(q);
      if (q.isFreeDemo || q.quizType === 'Free' || Number(q.price || 0) <= 0) {
        entry.freeCount += 1;
      }
    });
    return Array.from(map.values());
  }, [quizzesInCurrentTab]);

  // Filter quizzes for the active folder when drilled down
  const currentFolderQuizzes = useMemo(() => {
    if (!activeFolder) return [];
    return quizzesInCurrentTab.filter(
      (q) => (q.subCategory?.trim() || 'Full Length Mock Tests') === activeFolder
    );
  }, [quizzesInCurrentTab, activeFolder]);

  // Helper for folder icons and themed accents matching web
  const getFolderMeta = (folderName) => {
    const lower = folderName.toLowerCase();
    if (lower.includes('live')) {
      return {
        icon: Zap,
        iconColor: '#ef4444',
        bgColor: '#fee2e2',
        borderColor: '#fca5a5',
      };
    }
    if (lower.includes('saved') || lower.includes('bookmark')) {
      return {
        icon: Bookmark,
        iconColor: '#f59e0b',
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
      };
    }
    if (lower.includes('reasoning')) {
      return {
        icon: Brain,
        iconColor: '#9333ea',
        bgColor: '#f3e8ff',
        borderColor: '#d8b4fe',
      };
    }
    if (lower.includes('numerical') || lower.includes('math') || lower.includes('quant')) {
      return {
        icon: Calculator,
        iconColor: '#2563eb',
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
      };
    }
    if (lower.includes('english')) {
      return {
        icon: Globe,
        iconColor: '#0d9488',
        bgColor: '#ccfbf1',
        borderColor: '#5eead4',
      };
    }
    if (lower.includes('general') || lower.includes('awareness') || lower.includes('ca')) {
      return {
        icon: Compass,
        iconColor: '#4f46e5',
        bgColor: '#e0e7ff',
        borderColor: '#a5b4fc',
      };
    }
    // Default matching screenshot (green folder)
    return {
      icon: Folder,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
    };
  };

  const handleBackPress = () => {
    if (activeFolder) {
      setActiveFolder(null);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Main Navigation Header */}
      <View style={styles.topNavHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle} numberOfLines={1}>
          {currentExam?.title || 'Mock Tests'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* ==================================================== */}
        {/* 1. EXAM HEADER BANNER (Matches user screenshot)      */}
        {/* ==================================================== */}
        <View style={styles.examBannerContainer}>
          {Number(currentExam?.price || 0) > 0 && !isCurrentExamPurchased ? (
            <View style={styles.saleBannerCard}>
              <View style={styles.saleBannerHeaderRow}>
                <View style={styles.saleIconBox}>
                  <Crown size={24} color="#f59e0b" />
                </View>
                <View style={styles.saleTextCol}>
                  <View style={styles.saleBadgeRow}>
                    <View style={styles.saleTagPill}>
                      <Text style={styles.saleTagPillText}>SELECTION SALE</Text>
                    </View>
                    <Text style={styles.saleHeading} numberOfLines={1}>
                      {currentExam?.title} Full Test Series
                    </Text>
                  </View>
                  <Text style={styles.saleSubheading}>
                    Unlock all mock tests, sectionals, and previous year papers.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Alert.alert(
                    'Unlock Test Series',
                    `Unlock full ${currentExam?.title} test series for ₹${currentExam?.price}. Please use the website to purchase, or contact support.`
                  );
                }}
                style={styles.saleUnlockBtn}
              >
                <Text style={styles.saleUnlockBtnText}>
                  ₹{currentExam?.price} Unlock Now
                </Text>
                <ChevronRight size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.unlockedHeaderCard}>
              <View style={styles.examLogoTitleRow}>
                {currentExam?.logoUrl ? (
                  <Image
                    source={{ uri: currentExam.logoUrl }}
                    style={styles.examLogoImg}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                ) : (
                  <View style={styles.examLogoPlaceholder}>
                    <Crown size={22} color="#059669" />
                  </View>
                )}
                <View style={styles.examTitleCol}>
                  <Text style={styles.examMainTitle} numberOfLines={1}>
                    {currentExam?.title?.toUpperCase() || 'MOCK TEST'}
                  </Text>
                  <Text style={styles.examSubtitle}>
                    Practice full sets, sectionals, and previous year question papers.
                  </Text>
                </View>
              </View>

              <View style={styles.unlockedBadgeRow}>
                <View style={styles.unlockedBadge}>
                  <CheckCircle2 size={13} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.unlockedBadgeText}>Package Unlocked</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ==================================================== */}
        {/* 2. MAIN TABS: Mock Tests vs PYPs (Matches screenshot) */}
        {/* ==================================================== */}
        <View style={styles.mainTabsCard}>
          <View style={styles.tabsRow}>
            {/* Mock Tests Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveMainTab('Mock Tests');
                setActiveFolder(null);
              }}
              style={[
                styles.tabBtn,
                activeMainTab === 'Mock Tests' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeMainTab === 'Mock Tests' && styles.tabBtnTextActive,
                ]}
              >
                Mock Tests
              </Text>
              {mockTestsCount > 0 && (
                <View
                  style={[
                    styles.tabCountPill,
                    activeMainTab === 'Mock Tests' && styles.tabCountPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeMainTab === 'Mock Tests' && styles.tabCountTextActive,
                    ]}
                  >
                    {mockTestsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PYPs Tab */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveMainTab('PYPs');
                setActiveFolder(null);
              }}
              style={[
                styles.tabBtn,
                activeMainTab === 'PYPs' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeMainTab === 'PYPs' && styles.tabBtnTextActive,
                ]}
              >
                PYPs (Previous Year Papers)
              </Text>
              {pypsCount > 0 && (
                <View
                  style={[
                    styles.tabCountPill,
                    activeMainTab === 'PYPs' && styles.tabCountPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeMainTab === 'PYPs' && styles.tabCountTextActive,
                    ]}
                  >
                    {pypsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ==================================================== */}
          {/* 3. CONTENT AREA: FOLDER DIRECTORY vs DRILL-DOWN TESTS */}
          {/* ==================================================== */}
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Loading test series...</Text>
            </View>
          ) : !activeFolder ? (
            /* ================================================ */
            /* VIEW A: FOLDER LIST VIEW (Matches screenshot!)   */
            /* ================================================ */
            <View style={styles.foldersListWrap}>
              {categoryFolders.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconCircle}>
                    <Folder size={32} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyHeading}>
                    No {activeMainTab} Available Yet
                  </Text>
                  <Text style={styles.emptyDesc}>
                    Tests for this section are being prepared and will be live shortly.
                  </Text>
                </View>
              ) : (
                categoryFolders.map((folder, idx) => {
                  const meta = getFolderMeta(folder.name);
                  const Icon = meta.icon;
                  const isLast = idx === categoryFolders.length - 1;

                  return (
                    <TouchableOpacity
                      key={folder.name || idx}
                      activeOpacity={0.7}
                      onPress={() => setActiveFolder(folder.name)}
                      style={[styles.folderItemRow, !isLast && styles.folderBorderBottom]}
                    >
                      {/* Left: Themed Rounded Folder Icon */}
                      <View style={styles.folderLeftContent}>
                        <View
                          style={[
                            styles.folderIconBox,
                            {
                              backgroundColor: meta.bgColor,
                              borderColor: meta.borderColor,
                            },
                          ]}
                        >
                          <Icon size={18} color={meta.iconColor} />
                        </View>

                        {/* Middle: Count + Folder Name + Subtitle */}
                        <View style={styles.folderTextCol}>
                          <View style={styles.folderTitleLine}>
                            <Text style={styles.folderCountNum}>
                              {folder.tests.length}{' '}
                            </Text>
                            <Text style={styles.folderNameText} numberOfLines={1}>
                              {folder.name}
                            </Text>

                            {folder.freeCount > 0 && (
                              <View style={styles.folderFreeBadge}>
                                <Text style={styles.folderFreeBadgeText}>
                                  {folder.freeCount} Free
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.folderSubText}>
                            {folder.tests.length === 1
                              ? '1 Test available'
                              : `${folder.tests.length} Tests available`}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Explore > */}
                      <View style={styles.exploreActionWrap}>
                        <Text style={styles.exploreText}>Explore</Text>
                        <ChevronRight size={16} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : (
            /* ================================================ */
            /* VIEW B: DRILL-DOWN TESTS VIEW (Inside Folder)    */
            /* ================================================ */
            <View style={styles.drillDownWrap}>
              {/* Breadcrumb Header */}
              <View style={styles.drillBreadcrumbBar}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setActiveFolder(null)}
                  style={styles.allSectionsBackBtn}
                >
                  <ArrowLeft size={14} color="#0f172a" style={{ marginRight: 4 }} />
                  <Text style={styles.allSectionsBackText}>All Sections</Text>
                </TouchableOpacity>

                <View style={styles.drillTitleWrap}>
                  <Text style={styles.breadcrumbSlash}>/</Text>
                  <Text style={styles.drillFolderName} numberOfLines={1}>
                    {activeFolder}
                  </Text>
                  <View style={styles.drillCountPill}>
                    <Text style={styles.drillCountText}>
                      {currentFolderQuizzes.length} Tests
                    </Text>
                  </View>
                </View>
              </View>

              {/* Individual Quiz Cards */}
              <View style={styles.quizCardsList}>
                {currentFolderQuizzes.map((quiz, qIdx) => {
                  const qId = quiz._id?.toString();
                  const attempted = attemptedQuizMap[qId];
                  const isFree =
                    quiz.quizType === 'Free' ||
                    quiz.isFreeDemo ||
                    Number(quiz.price || 0) <= 0;
                  const canAccess = isFree || isCurrentExamPurchased;

                  return (
                    <View key={quiz._id || qIdx} style={styles.quizCard}>
                      {/* Top Badges Row */}
                      <View style={styles.quizCardHeaderRow}>
                        <View style={styles.quizBadgeGroup}>
                          {isFree ? (
                            <View style={styles.freeBadge}>
                              <Sparkles size={11} color="#059669" />
                              <Text style={styles.freeBadgeText}>FREE DEMO</Text>
                            </View>
                          ) : isCurrentExamPurchased ? (
                            <View style={styles.unlockedQuizBadge}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.unlockedQuizBadgeText}>UNLOCKED</Text>
                            </View>
                          ) : (
                            <View style={styles.premiumQuizBadge}>
                              <Crown size={11} color="#b45309" />
                              <Text style={styles.premiumQuizBadgeText}>PREMIUM</Text>
                            </View>
                          )}

                          {attempted && (
                            <View style={styles.attemptedBadge}>
                              <CheckCircle size={11} color="#2563eb" />
                              <Text style={styles.attemptedBadgeText}>ATTEMPTED</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.quizSubCatLabel} numberOfLines={1}>
                          {quiz.subCategory || 'Mock Test'}
                        </Text>
                      </View>

                      {/* Quiz Title */}
                      <Text style={styles.quizCardTitle}>
                        {quiz.quizName || quiz.nameOfExam || quiz.title || 'Full Length Mock'}
                      </Text>

                      {/* Meta Pill Row */}
                      <View style={styles.quizMetaBox}>
                        <View style={styles.metaStatItem}>
                          <FileText size={13} color="#64748b" />
                          <Text style={styles.metaStatText}>
                            {quiz.totalNoOfQueation || quiz.totalQuestions || 100} Qs
                          </Text>
                        </View>
                        <Text style={styles.metaPipe}>|</Text>
                        <View style={styles.metaStatItem}>
                          <Clock size={13} color="#64748b" />
                          <Text style={styles.metaStatText}>
                            {quiz.duration || 60} Mins
                          </Text>
                        </View>
                        <Text style={styles.metaPipe}>|</Text>
                        <View style={styles.metaStatItem}>
                          <Award size={13} color="#64748b" />
                          <Text style={styles.metaStatText}>
                            {quiz.totalMarks || 100} Marks
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.quizActionsRow}>
                        {attempted ? (
                          <View style={styles.attemptedActionBtns}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() =>
                                onViewResult &&
                                onViewResult(quiz._id, attempted, quiz)
                              }
                              style={styles.viewResultBtn}
                            >
                              <Text style={styles.viewResultBtnText}>
                                View Result
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() =>
                                onStartQuiz && onStartQuiz(quiz)
                              }
                              style={styles.reAttemptBtn}
                            >
                              <Text style={styles.reAttemptBtnText}>
                                Re-attempt
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : canAccess ? (
                          <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() =>
                              onStartQuiz && onStartQuiz(quiz)
                            }
                            style={[
                              styles.startTestBtn,
                              isFree ? styles.freeStartBtn : styles.unlockedStartBtn,
                            ]}
                          >
                            <Play size={15} color="#ffffff" fill="#ffffff" />
                            <Text style={styles.startTestBtnText}>
                              {isFree ? 'Start Free Demo' : 'Start Now'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() => {
                              Alert.alert(
                                'Exam Package Required',
                                `This test is part of ${currentExam?.title}. Unlock the package to access all tests.`
                              );
                            }}
                            style={styles.lockedBtn}
                          >
                            <LockKeyhole size={15} color="#ffffff" />
                            <Text style={styles.lockedBtnText}>
                              Unlock Exam (₹{currentExam?.price || 0})
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Footer: Languages & Marking */}
                      <View style={styles.quizCardFooter}>
                        <Text style={styles.footerLangText}>
                          {quiz.language || 'English, Hindi'}
                        </Text>
                        <Text style={styles.footerNegText}>
                          {quiz.negativeMark
                            ? `-${quiz.negativeMark} Negative`
                            : 'No Negative'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
    gap: 14,
  },

  // 1. Exam Header Card
  examBannerContainer: {},
  unlockedHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    ...shadows.sm,
  },
  examLogoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  examLogoImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitleCol: {
    flex: 1,
  },
  examMainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  examSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  unlockedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  unlockedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },

  // Sale Banner
  saleBannerCard: {
    backgroundColor: '#e11d48',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    ...shadows.md,
  },
  saleBannerHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  saleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleTextCol: {
    flex: 1,
  },
  saleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  saleTagPill: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saleTagPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0f172a',
  },
  saleHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  saleSubheading: {
    fontSize: 11,
    color: '#ffe4e6',
    lineHeight: 15,
  },
  saleUnlockBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saleUnlockBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },

  // 2. Main Tabs Card
  mainTabsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...shadows.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#059669',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  tabBtnTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  tabCountPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: '#d1fae5',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  tabCountTextActive: {
    color: '#047857',
  },

  // 3. Folder Directory List View
  foldersListWrap: {
    paddingVertical: 4,
  },
  folderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  folderBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  folderLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  folderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTextCol: {
    flex: 1,
  },
  folderTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  folderCountNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  folderNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  folderFreeBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  folderFreeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  folderSubText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
  },
  exploreActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  // 4. Drill-Down Tests View
  drillDownWrap: {
    padding: 14,
  },
  drillBreadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  allSectionsBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  allSectionsBackText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  drillTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 8,
  },
  breadcrumbSlash: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  drillFolderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    maxWidth: '55%',
  },
  drillCountPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  drillCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  // Quiz Card
  quizCardsList: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    ...shadows.sm,
  },
  quizCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 3,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  unlockedQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 3,
  },
  unlockedQuizBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  premiumQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 3,
  },
  premiumQuizBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  attemptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 3,
  },
  attemptedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  quizSubCatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  quizCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 20,
  },
  quizMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
    marginBottom: 10,
  },
  metaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  metaPipe: {
    fontSize: 11,
    color: '#cbd5e1',
  },

  // Actions
  quizActionsRow: {
    marginBottom: 8,
  },
  attemptedActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  viewResultBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewResultBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  reAttemptBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0d9488',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reAttemptBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d9488',
  },
  startTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  freeStartBtn: {
    backgroundColor: '#0284c7',
  },
  unlockedStartBtn: {
    backgroundColor: '#059669',
  },
  startTestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  lockedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Footer
  quizCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLangText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0d9488',
  },
  footerNegText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
  },

  // Loading & Empty States
  loadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyWrap: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default React.memo(QuizList);
