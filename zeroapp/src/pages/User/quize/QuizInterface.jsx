import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  Grid,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Send,
} from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import { fetchQuizQuestions, submitQuizResultApi } from '../../../config/api';

export const QuizInterface = ({
  quiz,
  token,
  user,
  onSubmitSuccess,
  onExit,
}) => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeSection, setActiveSection] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: optionIndex }

  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const timerRef = useRef(null);

  // Load questions
  useEffect(() => {
    let isMounted = true;
    const loadQuestions = async () => {
      try {
        const qList = await fetchQuizQuestions(quiz?._id, token);
        if (!isMounted) return;

        if (qList && qList.length > 0) {
          setAllQuestions(qList);
        } else if (qList?.apiMessage) {
          setErrorMessage(qList.apiMessage);
        }

        const durationMins = quiz?.duration || 60;
        setTimeLeft(durationMins * 60);
      } catch (err) {
        console.warn('Error fetching questions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadQuestions();
    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz?._id]);

  // Derive Sections
  const quizSections = useMemo(() => {
    const list = [];
    const seen = new Set();

    (quiz?.section || []).forEach((sec) => {
      const name = sec?.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ _id: sec._id || name, name });
      }
    });

    (allQuestions || []).forEach((q) => {
      const qSec = q.sectionName?.trim();
      if (qSec && !seen.has(qSec.toLowerCase())) {
        seen.add(qSec.toLowerCase());
        list.push({ _id: qSec, name: qSec });
      }
    });

    return list;
  }, [quiz?.section, allQuestions]);

  // Auto-select first section
  useEffect(() => {
    if (quizSections.length > 0 && !activeSection) {
      setActiveSection(quizSections[0].name);
    }
  }, [quizSections, activeSection]);

  // Filter questions for active section
  const sectionQuestions = useMemo(() => {
    if (!activeSection || quizSections.length === 0) return allQuestions;
    const filtered = allQuestions.filter(
      (q) =>
        (q.sectionName || '').trim().toLowerCase() ===
        activeSection.trim().toLowerCase()
    );
    return filtered.length > 0 ? filtered : allQuestions;
  }, [allQuestions, activeSection, quizSections]);

  const currentQ = sectionQuestions[currentQuestionIndex] || null;
  const currentQId = currentQ?._id?.toString();
  const selectedOptionIndex = currentQId ? userAnswers[currentQId] : undefined;

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || isSubmitting) return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, isSubmitting]);

  // Hardware Back Button
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Exit Test?',
        'Are you sure you want to leave this test? Your answers will not be submitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit Test', style: 'destructive', onPress: onExit },
        ]
      );
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [onExit]);

  const formatTimer = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (index) => {
    if (!currentQId) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQId]: index,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Submit test
  const handleFinalSubmit = async () => {
    setConfirmModalVisible(false);
    setIsSubmitting(true);

    try {
      if (!token) {
        Alert.alert(
          'Login Required',
          'Please login to save your test scorecard and view ranking.',
          [{ text: 'OK', onPress: onExit }]
        );
        return;
      }

      const res = await submitQuizResultApi(
        {
          quizId: quiz._id,
          userAnswers,
        },
        token
      );

      if (onSubmitSuccess) {
        onSubmitSuccess({
          quizId: quiz._id,
          result: res?.result,
          quiz,
          questions: allQuestions,
          userAnswers,
        });
      }
    } catch (err) {
      console.warn('Submission error:', err);
      Alert.alert(
        'Submission Error',
        err?.message || 'Could not submit your test. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#158993" />
        <Text style={styles.loadingMsg}>Preparing your Mock Test...</Text>
      </View>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.emptyTitle}>
          {errorMessage ? 'Access Notice' : 'No Questions Available'}
        </Text>
        <Text style={styles.emptyDesc}>
          {errorMessage || 'Questions are being updated for this test. Please try again soon.'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onExit}
          style={styles.exitBtn}
        >
          <Text style={styles.exitBtnText}>Back to Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* 1. TOP HEADER: Back Button | Exam Title | Palette Button | Submit */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              'Exit Test?',
              'Are you sure you want to leave this test?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit Test', style: 'destructive', onPress: onExit },
              ]
            );
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.examTitleText} numberOfLines={1}>
          {quiz?.nameOfExam || quiz?.title || 'UIICL'}
        </Text>

        <View style={styles.topRightActions}>
          {/* Question Palette Drawer Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaletteVisible(true)}
            style={styles.paletteToggleBtn}
          >
            <Grid size={18} color="#158993" />
          </TouchableOpacity>

          {/* Quick Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setConfirmModalVisible(true)}
            style={styles.topSubmitBtn}
          >
            <Send size={13} color="#ffffff" />
            <Text style={styles.topSubmitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SECTIONS BAR (SECTIONS label + Teal active pill + other sections) */}
      {quizSections.length > 0 && (
        <View style={styles.sectionsBar}>
          <Text style={styles.sectionsPrefix}>SECTIONS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionsScroll}
          >
            {quizSections.map((sec) => {
              const isActive = activeSection === sec.name;
              return (
                <TouchableOpacity
                  key={sec._id || sec.name}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveSection(sec.name);
                    setCurrentQuestionIndex(0);
                  }}
                  style={[
                    styles.sectionTab,
                    isActive && styles.sectionTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      isActive && styles.sectionTabTextActive,
                    ]}
                  >
                    {sec.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 3. SUB-HEADER: Question Number | Time Left (Placed nicely below) | Marks */}
      <View style={styles.questionHeaderBar}>
        <Text style={styles.questionNoText}>
          Question No. {currentQuestionIndex + 1}
        </Text>

        {/* TIME LEFT TAG - Centered & highly visible */}
        <View style={styles.timeLeftContainer}>
          <Clock size={13} color="#dc2626" />
          <Text style={styles.timeLeftLabel}>Time Left:</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerBadgeText}>{formatTimer(timeLeft)}</Text>
          </View>
        </View>

        {/* Marks */}
        <View style={styles.headerRightInfo}>
          <View style={styles.marksContainer}>
            <View style={styles.marksBadgesRow}>
              <View style={styles.markBadgeGreen}>
                <Text style={styles.markBadgeGreenText}>
                  +{currentQ?.marks || 1}
                </Text>
              </View>
              <View style={styles.markBadgeRed}>
                <Text style={styles.markBadgeRedText}>
                  -{quiz?.negativeMark || 0.25}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 4. MAIN QUESTION BODY & OPTIONS (flex: 1 scrollable) */}
      <View style={styles.questionBodyContainer}>
        <ScrollView
          contentContainerStyle={styles.questionBodyScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Instruction if present */}
          {currentQ?.optionsInstruction ? (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                {currentQ.optionsInstruction}
              </Text>
            </View>
          ) : null}

          {/* Question Text */}
          <Text style={styles.questionText}>
            {currentQ?.questionText}
          </Text>

          {/* Multiple Choice Radio Options */}
          <View style={styles.optionsList}>
            {currentQ?.options?.map((opt, optIdx) => {
              const isSelected = selectedOptionIndex === optIdx;

              return (
                <TouchableOpacity
                  key={optIdx}
                  activeOpacity={0.75}
                  onPress={() => handleSelectOption(optIdx)}
                  style={styles.radioOptionRow}
                >
                  {/* Radio Circle */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>

                  {/* Option Text */}
                  <Text
                    style={[
                      styles.radioOptionText,
                      isSelected && styles.radioOptionTextSelected,
                    ]}
                  >
                    {opt.text || opt.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* 5. BOTTOM BAR (Permanently pinned & fully visible above system navigation bar) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePrev}
          disabled={currentQuestionIndex === 0}
          style={[
            styles.prevBtn,
            currentQuestionIndex === 0 && styles.prevBtnDisabled,
          ]}
        >
          <ChevronLeft
            size={18}
            color={currentQuestionIndex === 0 ? '#cbd5e1' : '#475569'}
          />
          <Text
            style={[
              styles.prevBtnText,
              currentQuestionIndex === 0 && styles.prevBtnTextDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        {/* Direct Submit Test button in bottom bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setConfirmModalVisible(true)}
          style={styles.bottomSubmitBtn}
        >
          <Send size={14} color="#ffffff" />
          <Text style={styles.bottomSubmitBtnText}>Submit Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (currentQuestionIndex < sectionQuestions.length - 1) {
              handleNext();
            } else {
              setConfirmModalVisible(true);
            }
          }}
          style={styles.saveNextBtn}
        >
          <Text style={styles.saveNextBtnText}>
            {currentQuestionIndex === sectionQuestions.length - 1
              ? 'Finish'
              : 'Save & Next'}
          </Text>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 6. QUESTION PALETTE MODAL / DRAWER */}
      <Modal
        visible={paletteVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaletteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paletteContainer}>
            {/* Header: SECTION : English */}
            <View style={styles.paletteHeader}>
              <View style={styles.paletteSectionTitleWrap}>
                <Text style={styles.paletteSectionLabel}>SECTION : </Text>
                <Text style={styles.paletteSectionValue}>{activeSection}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPaletteVisible(false)}
                style={styles.paletteCloseBtn}
              >
                <X size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Questions Grid with flex: 1 so it never pushes the footer off screen */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.paletteGrid}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              {sectionQuestions.map((q, idx) => {
                const qId = q._id?.toString();
                const isAnswered = userAnswers[qId] !== undefined;
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.75}
                    onPress={() => {
                      setCurrentQuestionIndex(idx);
                      setPaletteVisible(false);
                    }}
                    style={[
                      styles.paletteBox,
                      isAnswered && styles.paletteBoxAnswered,
                      isCurrent && styles.paletteBoxCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paletteBoxText,
                        isAnswered && styles.paletteBoxTextAnswered,
                        isCurrent && styles.paletteBoxTextCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom: Submit Test Button - Always pinned and visible */}
            <View style={styles.paletteFooter}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setPaletteVisible(false);
                  setConfirmModalVisible(true);
                }}
                style={styles.paletteSubmitBtn}
              >
                <Send size={15} color="#ffffff" />
                <Text style={styles.paletteSubmitBtnText}>Submit Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. CONFIRM SUBMIT MODAL */}
      <Modal
        visible={confirmModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Submit Mock Test?</Text>
            <Text style={styles.confirmSubtitle}>
              Please review your attempted questions before submitting:
            </Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Questions:</Text>
                <Text style={styles.summaryVal}>{allQuestions.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Answered:</Text>
                <Text style={[styles.summaryVal, { color: '#16a34a' }]}>
                  {answeredCount}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Unanswered:</Text>
                <Text style={[styles.summaryVal, { color: '#dc2626' }]}>
                  {allQuestions.length - answeredCount}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Time Remaining:</Text>
                <Text style={styles.summaryVal}>{formatTimer(timeLeft)}</Text>
              </View>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setConfirmModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
                style={styles.confirmSubmitBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmSubmitText}>Submit Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#158993',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  exitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#158993',
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // 1. Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  examTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paletteToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e6f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bce0f2',
  },
  topSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#158993',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  topSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // 2. Sections Bar
  sectionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingLeft: 16,
  },
  sectionsPrefix: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginRight: 10,
  },
  sectionsScroll: {
    paddingRight: 16,
    gap: 4,
  },
  sectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sectionTabActive: {
    backgroundColor: '#158993',
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  sectionTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // 3. Question Number & Marks Bar + Time Left
  questionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  questionNoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  timeLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 5,
  },
  timeLeftLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timerBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  timerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marksContainer: {
    alignItems: 'center',
  },
  marksBadgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  markBadgeGreen: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  markBadgeGreenText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  markBadgeRed: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  markBadgeRedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  // 4. Question Body Container & Scroll
  questionBodyContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  questionBodyScroll: {
    padding: 18,
    paddingBottom: 32,
  },
  instructionBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748b',
    lineHeight: 18,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 20,
  },

  // Radio Options List
  optionsList: {
    gap: 16,
  },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#158993',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#158993',
  },
  radioOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  radioOptionTextSelected: {
    color: '#158993',
    fontWeight: '700',
  },

  // 5. Bottom Navigation Bar (Always visible anchored above system navigation bar)
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 18 : 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    gap: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  prevBtnDisabled: {
    opacity: 0.5,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  prevBtnTextDisabled: {
    color: '#cbd5e1',
  },
  bottomSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    elevation: 2,
  },
  bottomSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  saveNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#24bcd4', // Exact cyan color matching web screenshot
    elevation: 2,
  },
  saveNextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // 6. Question Palette Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  paletteContainer: {
    backgroundColor: '#dcf0fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  paletteHeader: {
    backgroundColor: '#bce0f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paletteSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paletteSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  paletteSectionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  paletteCloseBtn: {
    padding: 2,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  paletteBox: {
    width: '17%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteBoxAnswered: {
    backgroundColor: '#2dd46c',
    borderColor: 'transparent',
  },
  paletteBoxCurrent: {
    borderWidth: 2,
    borderColor: '#158993',
  },
  paletteBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  paletteBoxTextAnswered: {
    color: '#ffffff',
  },
  paletteBoxTextCurrent: {
    color: '#158993',
    fontWeight: '900',
  },
  paletteFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    backgroundColor: '#dcf0fa',
    borderTopWidth: 1,
    borderTopColor: '#bce0f2',
  },
  paletteSubmitBtn: {
    backgroundColor: '#158993',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 3,
  },
  paletteSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Confirm Modal
  confirmCard: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...shadows.lg,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmSubmitBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#158993',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default QuizInterface;
