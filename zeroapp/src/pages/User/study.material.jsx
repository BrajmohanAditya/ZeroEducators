import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Play,
  FileCheck,
  Book,
  FileBox,
  Calendar,
  MessageCircle,
  Send,
  Target,
  Megaphone,
  Crown,
} from 'lucide-react-native';
import Svg, { Rect, Path, Line } from 'react-native-svg';
import { fetchLiveExams, fetchLiveQuizzes } from '../../config/api';

// Custom Instagram SVG icon matching web frontend
const InstagramIcon = ({ size = 22, color = '#db2777' }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Svg>
);

export const StudyMaterial = ({ onNavigate }) => {
  const [exams, setExams] = useState([]);
  const [freeQuizzes, setFreeQuizzes] = useState([]);
  const [paidQuizzes, setPaidQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    setLoading(true);
    try {
      const [examsData, freeData, paidData] = await Promise.all([
        fetchLiveExams(),
        fetchLiveQuizzes('Free'),
        fetchLiveQuizzes('Paid'),
      ]);
      setExams(examsData || []);
      setFreeQuizzes(freeData || []);
      setPaidQuizzes(paidData || []);
    } catch (err) {
      console.warn('[StudyDashboard] Error fetching live study data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group Free & Paid Exams exactly as web frontend does
  const freeExamsMap = new Map();
  const paidExamsMap = new Map();

  exams.forEach((exam) => {
    const price = Number(exam.price) || 0;
    const item = {
      id: exam._id,
      name: exam.title,
      logoUrl: exam.logoUrl,
    };
    if (price > 0) {
      paidExamsMap.set(exam._id.toString(), item);
    } else {
      freeExamsMap.set(exam._id.toString(), item);
    }
  });

  freeQuizzes.forEach((quiz) => {
    const examObj = quiz.examId;
    const price = examObj?.price ?? quiz.price ?? 0;
    if (price > 0) return;
    const examKey = (examObj?._id || quiz.examId || quiz.nameOfExam || '').toString();
    if (examKey && !freeExamsMap.has(examKey)) {
      freeExamsMap.set(examKey, {
        id: examObj?._id || quiz.examId,
        name: examObj?.title || quiz.nameOfExam || 'Exam',
        logoUrl: examObj?.logoUrl || quiz.logoUrl,
      });
    }
  });

  paidQuizzes.forEach((quiz) => {
    const examObj = quiz.examId;
    const price = examObj?.price ?? quiz.price ?? 0;
    if (price <= 0) return;
    const examKey = (examObj?._id || quiz.examId || quiz.nameOfExam || '').toString();
    if (examKey && !paidExamsMap.has(examKey)) {
      paidExamsMap.set(examKey, {
        id: examObj?._id || quiz.examId,
        name: examObj?.title || quiz.nameOfExam || 'Exam',
        logoUrl: examObj?.logoUrl || quiz.logoUrl,
      });
    }
  });

  const freeExams = Array.from(freeExamsMap.values());
  const paidExams = Array.from(paidExamsMap.values());

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Cannot open link:', url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Study Dashboard</Text>
        <Text style={styles.subtitle}>
          Access your materials, tests, and community in one place.
        </Text>
      </View>

      <View style={styles.cardsList}>
        {/* ==================================================== */}
        {/* 1. TODAY LIVE TEST (Lavender / Purple Card)          */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.purpleCard]}>
          {/* Top-right pulsing Live indicator */}
          <View style={styles.topRightCorner}>
            <View style={styles.livePulseOuter}>
              <View style={styles.livePulseInner} />
            </View>
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.purpleText]}>
            Today Live Test
          </Text>

          {/* Items or Enter Now Button */}
          {freeExams && freeExams.length > 0 ? (
            <View style={styles.itemsGrid}>
              {freeExams.slice(0, 4).map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    onNavigate &&
                    onNavigate('Quizzes', { type: 'Free', examId: exam.id })
                  }
                  style={styles.itemBox}
                >
                  <View style={styles.itemIconContainer}>
                    {exam.logoUrl ? (
                      <Image
                        source={{ uri: exam.logoUrl }}
                        style={styles.examLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderIcon} />
                    )}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {exam.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigate && onNavigate('Quizzes', { type: 'Free' })}
              style={styles.enterNowBtn}
            >
              <Play size={18} color="#7e22ce" fill="#7e22ce" />
              <Text style={[styles.enterNowText, styles.purpleText]}>
                Enter Now
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ==================================================== */}
        {/* 2. PREMIUM TEST (Mint Green / Emerald Card)          */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.greenCard]}>
          {/* Top-right Crown Icon */}
          <View style={styles.topRightCorner}>
            <Crown size={38} color="#10b981" opacity={0.4} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.greenText]}>Premium Test</Text>

          {/* Items or Enter Now Button */}
          {paidExams && paidExams.length > 0 ? (
            <View style={styles.itemsGrid}>
              {paidExams.slice(0, 4).map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    onNavigate &&
                    onNavigate('Quizzes', { type: 'Paid', examId: exam.id })
                  }
                  style={styles.itemBox}
                >
                  <View style={styles.itemIconContainer}>
                    {exam.logoUrl ? (
                      <Image
                        source={{ uri: exam.logoUrl }}
                        style={styles.examLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderIcon} />
                    )}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {exam.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigate && onNavigate('Quizzes', { type: 'Paid' })}
              style={styles.enterNowBtn}
            >
              <Play size={18} color="#047857" fill="#047857" />
              <Text style={[styles.enterNowText, styles.greenText]}>
                Enter Now
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ==================================================== */}
        {/* 3. STUDY MATERIALS (Soft Blue Card)                  */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.blueCard]}>
          {/* Top-right Target Icon */}
          <View style={styles.topRightCorner}>
            <Target size={38} color="#3b82f6" opacity={0.35} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.blueText]}>
            Study Materials
          </Text>

          {/* 2x2 Grid of materials */}
          <View style={styles.itemsGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Courses')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <FileCheck size={20} color="#3b82f6" />
              </View>
              <Text style={styles.itemName}>Free PDFs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('eBooks')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
                <Book size={20} color="#ec4899" />
              </View>
              <Text style={styles.itemName}>Practice Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Quizzes')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <FileBox size={20} color="#059669" />
              </View>
              <Text style={styles.itemName}>PYP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Courses')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                <Calendar size={20} color="#9333ea" />
              </View>
              <Text style={styles.itemName}>Daily CA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 4. FOLLOW US (Warm Peach / Orange Card)              */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.orangeCard]}>
          {/* Top-right Megaphone Icon */}
          <View style={styles.topRightCorner}>
            <Megaphone size={38} color="#f97316" opacity={0.35} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.orangeText]}>Follow Us</Text>

          {/* 2x2 Grid of Social Channels */}
          <View style={styles.itemsGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openLink('https://whatsapp.com/channel/0029ValsT7m8qIzlvpGfRA1j')
              }
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                <MessageCircle size={20} color="#22c55e" />
              </View>
              <Text style={styles.itemName}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openLink(
                  'https://www.instagram.com/mszero2infinity?stkn=MXZvdnZmZnE5dXhxNg=='
                )
              }
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
                <InstagramIcon size={20} color="#db2777" />
              </View>
              <Text style={styles.itemName}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openLink('https://t.me/zeroshivani')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <Send size={18} color="#3b82f6" />
              </View>
              <Text style={styles.itemName}>Channel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openLink('https://t.me/zeroshivani21')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                <Send size={18} color="#0284c7" />
              </View>
              <Text style={styles.itemName}>Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a', // Bold dark title matching frontend
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  cardsList: {
    gap: 18,
  },
  // Card base styles
  card: {
    borderRadius: 28,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  topRightCorner: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  // Theme variants
  purpleCard: {
    backgroundColor: '#F3E8FF',
  },
  greenCard: {
    backgroundColor: '#E6F8EA',
  },
  blueCard: {
    backgroundColor: '#E6EFFF',
  },
  orangeCard: {
    backgroundColor: '#FFF4E5',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  purpleText: {
    color: '#7e22ce',
  },
  greenText: {
    color: '#047857',
  },
  blueText: {
    color: '#1d4ed8',
  },
  orangeText: {
    color: '#c2410c',
  },
  // Live indicator pulsing red dot
  livePulseOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  // Enter Now Button (Clean white pill button matching screenshot)
  enterNowBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  enterNowText: {
    fontSize: 16,
    fontWeight: '800',
  },
  // 2x2 Grid inside cards
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  itemBox: {
    width: '47.8%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  examLogo: {
    width: 44,
    height: 44,
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
});

export default StudyMaterial;
