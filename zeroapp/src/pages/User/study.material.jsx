import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import {
  FileCheck,
  Book,
  FileBox,
  Calendar,
  MessageCircle,
  Send,
  Target,
  Megaphone,
  Crown,
  PlaySquare,
  Sparkles,
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
  const [freeExams, setFreeExams] = useState([]);
  const [paidExams, setPaidExams] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [exams, freeQ, paidQ] = await Promise.all([
          fetchLiveExams(),
          fetchLiveQuizzes('Free'),
          fetchLiveQuizzes('Paid'),
        ]);

        if (!isMounted) return;

        const freeMap = new Map();
        const paidMap = new Map();

        // 1. Map from Exams collection
        (exams || []).forEach((exam) => {
          const price = Number(exam.price) || 0;
          const item = {
            id: exam._id,
            name: exam.title || 'Exam',
            logoUrl: exam.logoUrl,
          };
          if (price > 0) {
            paidMap.set(exam._id.toString(), item);
          } else {
            freeMap.set(exam._id.toString(), item);
          }
        });

        // 2. Also map from Quizzes
        (freeQ || []).forEach((quiz) => {
          const examObj = quiz.examId;
          const price = examObj?.price ?? quiz.price ?? 0;
          if (price > 0) return;
          const key = (examObj?._id || quiz.examId || quiz.nameOfExam || '').toString();
          if (key && !freeMap.has(key)) {
            freeMap.set(key, {
              id: examObj?._id || quiz.examId,
              name: examObj?.title || quiz.nameOfExam || 'Free Quiz',
              logoUrl: examObj?.logoUrl || quiz.logoUrl,
            });
          }
        });

        (paidQ || []).forEach((quiz) => {
          const examObj = quiz.examId;
          const price = examObj?.price ?? quiz.price ?? 0;
          if (price <= 0) return;
          const key = (examObj?._id || quiz.examId || quiz.nameOfExam || '').toString();
          if (key && !paidMap.has(key)) {
            paidMap.set(key, {
              id: examObj?._id || quiz.examId,
              name: examObj?.title || quiz.nameOfExam || 'Premium Test',
              logoUrl: examObj?.logoUrl || quiz.logoUrl,
            });
          }
        });

        setFreeExams(Array.from(freeMap.values()));
        setPaidExams(Array.from(paidMap.values()));
      } catch (err) {
        console.warn('Error loading study material quiz exams:', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
          Access curated study materials, test series, and official communities.
        </Text>
      </View>

      <View style={styles.cardsList}>
        {/* ==================================================== */}
        {/* 1. TODAY LIVE TEST (Soft Purple Full-Width Card)     */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.purpleCard]}>
          {/* Top-Right Glowing Live Dot */}
          <View style={styles.topRightCorner}>
            <View style={styles.livePulseHalo}>
              <View style={styles.livePulseDot} />
            </View>
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.purpleText]}>Today Live Test</Text>

          {/* 2x2 Grid of Free Tests */}
          <View style={styles.itemsGrid}>
            {freeExams.slice(0, 3).map((exam, idx) => (
              <TouchableOpacity
                key={exam.id || idx}
                activeOpacity={0.8}
                onPress={() =>
                  onNavigate &&
                  onNavigate('Quizzes', {
                    type: 'Free',
                    examId: exam.id,
                    examTitle: exam.name,
                  })
                }
                style={styles.itemBox}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                  {exam.logoUrl ? (
                    <Image
                      source={{ uri: exam.logoUrl }}
                      style={styles.examIconImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <PlaySquare size={22} color="#7e22ce" />
                  )}
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {exam.name}
                </Text>
                <Text style={styles.itemSubText}>Free Demo Test</Text>
              </TouchableOpacity>
            ))}

            {/* Enter Now Box */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Quizzes', { type: 'Free' })}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#f5eeff' }]}>
                <Sparkles size={22} color="#7e22ce" />
              </View>
              <Text style={styles.itemName}>Enter Now</Text>
              <Text style={styles.itemSubText}>All Free Tests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 2. PREMIUM TEST (Soft Mint Green Full-Width Card)    */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.greenCard]}>
          {/* Top-Right Crown Icon */}
          <View style={styles.topRightCorner}>
            <Crown size={38} color="#059669" opacity={0.35} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.greenText]}>Premium Test</Text>

          {/* 2x2 Grid of Premium Tests */}
          <View style={styles.itemsGrid}>
            {paidExams.slice(0, 4).map((exam, idx) => (
              <TouchableOpacity
                key={exam.id || idx}
                activeOpacity={0.8}
                onPress={() =>
                  onNavigate &&
                  onNavigate('Quizzes', {
                    type: 'Paid',
                    examId: exam.id,
                    examTitle: exam.name,
                  })
                }
                style={styles.itemBox}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                  {exam.logoUrl ? (
                    <Image
                      source={{ uri: exam.logoUrl }}
                      style={styles.examIconImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Crown size={22} color="#059669" />
                  )}
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {exam.name}
                </Text>
                <Text style={styles.itemSubText}>Test Series</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ==================================================== */}
        {/* 3. STUDY MATERIALS (Soft Blue Full-Width Card)       */}
        {/* ==================================================== */}
        <View style={[styles.card, styles.blueCard]}>
          {/* Top-right Target Icon */}
          <View style={styles.topRightCorner}>
            <Target size={38} color="#3b82f6" opacity={0.35} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.blueText]}>Study Materials</Text>

          {/* 2x2 Grid of materials */}
          <View style={styles.itemsGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Courses')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <FileCheck size={22} color="#3b82f6" />
              </View>
              <Text style={styles.itemName}>Free PDFs</Text>
              <Text style={styles.itemSubText}>Curated Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('eBooks')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
                <Book size={22} color="#ec4899" />
              </View>
              <Text style={styles.itemName}>Practice Book</Text>
              <Text style={styles.itemSubText}>eBooks & Sets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Courses')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <FileBox size={22} color="#059669" />
              </View>
              <Text style={styles.itemName}>PYP</Text>
              <Text style={styles.itemSubText}>Solved Papers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Courses')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                <Calendar size={22} color="#9333ea" />
              </View>
              <Text style={styles.itemName}>Daily CA</Text>
              <Text style={styles.itemSubText}>Current Affairs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================== */}
        {/* 4. FOLLOW US & COMMUNITY (Warm Peach Full-Width Card)*/}
        {/* ==================================================== */}
        <View style={[styles.card, styles.orangeCard]}>
          {/* Top-right Megaphone Icon */}
          <View style={styles.topRightCorner}>
            <Megaphone size={38} color="#f97316" opacity={0.35} strokeWidth={1.5} />
          </View>

          {/* Card Title */}
          <Text style={[styles.cardTitle, styles.orangeText]}>Join Community</Text>

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
                <MessageCircle size={22} color="#22c55e" />
              </View>
              <Text style={styles.itemName}>WhatsApp</Text>
              <Text style={styles.itemSubText}>Channel Alerts</Text>
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
                <InstagramIcon size={22} color="#db2777" />
              </View>
              <Text style={styles.itemName}>Instagram</Text>
              <Text style={styles.itemSubText}>Daily Updates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openLink('https://t.me/zeroshivani')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <Send size={20} color="#3b82f6" />
              </View>
              <Text style={styles.itemName}>Telegram</Text>
              <Text style={styles.itemSubText}>Study Channel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openLink('https://t.me/zeroshivani21')}
              style={styles.itemBox}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                <Send size={20} color="#0284c7" />
              </View>
              <Text style={styles.itemName}>Discussion</Text>
              <Text style={styles.itemSubText}>Student Group</Text>
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
    color: '#0f172a',
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

  // Full-width Base card
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

  // Color Variants
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
    color: '#6b21a8',
  },
  greenText: {
    color: '#065f46',
  },
  blueText: {
    color: '#1d4ed8',
  },
  orangeText: {
    color: '#c2410c',
  },

  // Live Red Pulsing Badge
  livePulseHalo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  // 2x2 Grid inside cards
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  itemBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  examIconImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  itemSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default StudyMaterial;
