import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, X } from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import { Button } from '../../../components/ui/button';

const sampleQuestions = [
  {
    id: 1,
    question: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
    options: ['65 seconds', '89 seconds', '100 seconds', '150 seconds', 'None of these'],
    correct: 1,
  },
  {
    id: 2,
    question: 'What should come in place of question mark (?) in the following series? 12, 14, 21, 45, 112, (?)',
    options: ['285', '302', '312', '335', '340'],
    correct: 3,
  },
  {
    id: 3,
    question: 'The ratio of the speed of a boat in still water to the speed of the stream is 8:1. If boat covers 63 km downstream in 7 hours, find its speed in still water.',
    options: ['8 km/h', '10 km/h', '16 km/h', '18 km/h', '24 km/h'],
    correct: 0,
  },
];

export const QuizeInterface = ({ quiz, onExit, onSubmitSuccess }) => {
  const questions = sampleQuestions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(60 * 20); // 20 mins

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: optIndex,
    });
  };

  const handleClearResponse = () => {
    const updated = { ...selectedAnswers };
    delete updated[currentIdx];
    setSelectedAnswers(updated);
  };

  const handleSubmitTest = () => {
    Alert.alert(
      'Submit Mock Test',
      'Are you sure you want to submit? You will receive immediate score analysis.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Now',
          onPress: () => {
            if (onSubmitSuccess) {
              onSubmitSuccess({
                total: questions.length,
                attempted: Object.keys(selectedAnswers).length,
                answers: selectedAnswers,
              });
            } else if (onExit) {
              onExit();
            }
          },
        },
      ]
    );
  };

  const q = questions[currentIdx];

  return (
    <View style={styles.container}>
      {/* Top Test Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} style={styles.exitBtn}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <Clock size={16} color="#dc2626" />
          <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
        </View>

        <Button size="sm" onPress={handleSubmitTest} style={styles.submitBtn}>
          Submit Test
        </Button>
      </View>

      {/* Horizontal Question Number Palette */}
      <View style={styles.paletteContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {questions.map((item, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentIdx(idx)}
                style={[
                  styles.paletteItem,
                  isAnswered && styles.paletteItemAnswered,
                  isCurrent && styles.paletteItemCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.paletteText,
                    (isAnswered || isCurrent) && styles.paletteTextActive,
                  ]}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Question Scroll */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {currentIdx + 1} of {questions.length}</Text>
          <Text style={styles.marksBadge}>+1.0 / -0.25</Text>
        </View>

        <Text style={styles.questionText}>{q.question}</Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {q.options.map((opt, optIdx) => {
            const isSelected = selectedAnswers[currentIdx] === optIdx;
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];

            return (
              <TouchableOpacity
                key={optIdx}
                activeOpacity={0.8}
                onPress={() => handleSelectOption(optIdx)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.optionLetterCircle,
                    isSelected && styles.optionLetterCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      isSelected && styles.optionLetterTextSelected,
                    ]}
                  >
                    {optionLetters[optIdx]}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleClearResponse}
          disabled={selectedAnswers[currentIdx] === undefined}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

        <View style={styles.navRow}>
          <Button
            size="sm"
            variant="outline"
            disabled={currentIdx === 0}
            onPress={() => setCurrentIdx(currentIdx - 1)}
            style={styles.navBtn}
          >
            Previous
          </Button>

          <Button
            size="sm"
            onPress={() => {
              if (currentIdx < questions.length - 1) {
                setCurrentIdx(currentIdx + 1);
              } else {
                handleSubmitTest();
              }
            }}
            style={styles.navBtn}
          >
            {currentIdx === questions.length - 1 ? 'Review & Submit' : 'Save & Next'}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  exitBtn: {
    padding: 6,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
    marginLeft: 6,
  },
  submitBtn: {
    paddingHorizontal: 14,
  },
  paletteContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paletteItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paletteItemAnswered: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  paletteItemCurrent: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  paletteText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  paletteTextActive: {
    color: '#ffffff',
  },
  questionScroll: {
    flex: 1,
  },
  questionContent: {
    padding: 18,
    paddingBottom: 40,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  marksBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionLetterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterCircleSelected: {
    backgroundColor: colors.primary,
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  optionLetterTextSelected: {
    color: '#ffffff',
  },
  optionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#ffffff',
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 16,
  },
});

export default QuizeInterface;
