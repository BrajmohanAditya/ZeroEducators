import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
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
} from 'lucide-react-native';
import Svg, { Rect, Path, Line } from 'react-native-svg';

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
          Access curated study materials, eBooks, and official communities.
        </Text>
      </View>

      <View style={styles.cardsList}>
        {/* ==================================================== */}
        {/* 1. STUDY MATERIALS (Soft Blue Card)                  */}
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
        {/* 2. FOLLOW US & COMMUNITY (Warm Peach / Orange Card)  */}
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
  blueText: {
    color: '#1d4ed8',
  },
  orangeText: {
    color: '#c2410c',
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
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
