import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
  GraduationCap,
  Star,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';

export const Footer = ({ onNavigate, onLinkPress }) => {
  const [emailInput, setEmailInput] = useState('');

  const handleSubscribe = () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address to subscribe.');
      return;
    }
    setEmailInput('');
    Alert.alert(
      'Subscribed 🎉',
      'Thank you for subscribing! You will receive daily current affairs, banking awareness, and exclusive study material.'
    );
  };

  const handleOpenUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.log('Error opening URL:', err);
    }
  };

  const quickLinks = [
    { label: 'Home', screen: 'Home' },
    { label: 'All Courses', screen: 'Courses' },
    { label: 'eBooks & Notes', screen: 'eBooks' },
    { label: 'Study Materials', screen: 'StudyMaterial' },
    { label: 'Terms & Conditions', screen: 'Terms' },
  ];

  const examLinks = [
    { label: 'SBI PO & Clerk Complete Batch', screen: 'Courses' },
    { label: 'IBPS PO / Clerk Target 2026', screen: 'Courses' },
    { label: 'RBI Grade B & Assistant Course', screen: 'Courses' },
    { label: 'IBPS RRB Officer Scale I & II', screen: 'Courses' },
    { label: 'Banking & Financial Awareness', screen: 'Courses' },
    { label: 'Quantitative Aptitude Special', screen: 'Courses' },
    { label: 'Reasoning Ability Masterclass', screen: 'Courses' },
    { label: 'English for Banking Exams', screen: 'Courses' },
    { label: 'Previous Year Solved Papers', screen: 'Courses' },
    { label: 'Daily Current Affairs & Editorial', screen: 'Courses' },
  ];

  const socialLinks = [
    {
      label: 'Facebook',
      url: 'https://facebook.com',
      d: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z',
    },
    {
      label: 'Instagram',
      url: 'https://www.instagram.com/mszero2infinity?stkn=MXZvdnZmZnE5dXhxNg==',
      d: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5.838a4.162 4.162 0 1 0 0 8.324 4.162 4.162 0 0 0 0-8.324zm0 6.915a2.753 2.753 0 1 1 0-5.506 2.753 2.753 0 0 1 0 5.506zm5.222-6.52a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z',
    },
    {
      label: 'YouTube',
      url: 'https://youtube.com',
      d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    },
    {
      label: 'WhatsApp Channel',
      url: 'https://whatsapp.com/channel/0029ValsT7m8qIzlvpGfRA1j',
      d: 'M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.476-.15-.677.15-.2.301-.777.98-.952 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.238-.244-.589-.493-.509-.677-.518l-.577-.01c-.2 0-.526.075-.802.376-.276.301-1.053 1.029-1.053 2.509s1.078 2.91 1.228 3.111c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.378.198 1.898.12.579-.087 1.781-.728 2.032-1.431.251-.703.251-1.305.176-1.431-.075-.125-.276-.2-.577-.351z M12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.178L2.05 21.95l4.898-1.364C8.423 21.49 10.158 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z',
    },
    {
      label: 'Telegram',
      url: 'https://t.me/zeroshivani',
      d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    },
  ];

  return (
    <View style={styles.footerContainer}>
      {/* ── 1. Top Newsletter CTA Strip (Navy with Gold Accents) ── */}
      <View style={styles.ctaStrip}>
        <View style={styles.ctaBadgeRow}>
          <GraduationCap size={18} color="#d4af37" />
          <Text style={styles.ctaBadgeText}>JOIN THE TOP 1%</Text>
        </View>

        <Text style={styles.ctaTitle}>Ready to Crack Banking & Govt. Exams?</Text>
        <Text style={styles.ctaSubtitle}>
          Subscribe for daily current affairs, banking awareness, and exclusive study material delivered straight to your inbox.
        </Text>

        <View style={styles.newsletterForm}>
          <TextInput
            style={styles.newsletterInput}
            placeholder="Enter your email"
            placeholderTextColor="#94a3b8"
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubscribe}
            style={styles.newsletterBtn}
          >
            <Text style={styles.newsletterBtnText}>Subscribe</Text>
            <ArrowRight size={15} color="#050f20" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Main Footer Body (Deep Midnight Slate) ── */}
      <View style={styles.mainBody}>
        {/* Brand Block with Official Logo */}
        <View style={styles.brandBlock}>
          <View style={styles.brandHeaderRow}>
            <View style={styles.brandLogoBox}>
              <Image
                source={require('../../assets/logo3rd.png')}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTitleBox}>
              <Text style={styles.brandName}>ZEROEDUCATORS</Text>
              <Text style={styles.brandSubtitle}>LEARNING PLATFORM</Text>
            </View>
          </View>

          <Text style={styles.brandDescription}>
            India's premier online learning platform for Banking, Insurance, and Competitive Exam preparation with top educators, full mock tests, and comprehensive study materials.
          </Text>

          {/* Social Icons Row */}
          <View style={styles.socialRow}>
            {socialLinks.map((s) => (
              <TouchableOpacity
                key={s.label}
                activeOpacity={0.7}
                onPress={() => handleOpenUrl(s.url)}
                style={styles.socialIconBtn}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d={s.d} fill="#cbd5e1" />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Links Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>QUICK LINKS</Text>
          <View style={styles.linksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.label}
                activeOpacity={0.7}
                onPress={() => {
                  if (link.screen === 'Terms' && onLinkPress) {
                    onLinkPress('Terms');
                  } else if (onNavigate) {
                    onNavigate(link.screen);
                  }
                }}
                style={styles.linkRowItem}
              >
                <ChevronRight size={14} color="#3b82f6" />
                <Text style={styles.linkRowText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Exams Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>POPULAR EXAMS</Text>
          <View style={styles.linksGrid}>
            {examLinks.map((exam) => (
              <TouchableOpacity
                key={exam.label}
                activeOpacity={0.7}
                onPress={() => {
                  if (onNavigate) onNavigate(exam.screen);
                }}
                style={styles.linkRowItem}
              >
                <ChevronRight size={14} color="#3b82f6" />
                <Text style={styles.linkRowText}>{exam.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact & Working Hours Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>CONTACT US</Text>

          <View style={styles.contactList}>
            {/* Address */}
            <View style={styles.contactItemRow}>
              <View style={styles.contactIconCircle}>
                <MapPin size={14} color="#60a5fa" />
              </View>
              <Text style={styles.contactItemText}>Jodhpur, Rajasthan, India</Text>
            </View>

            {/* Phone */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenUrl('tel:+919119202035')}
              style={styles.contactItemRow}
            >
              <View style={styles.contactIconCircle}>
                <Phone size={14} color="#60a5fa" />
              </View>
              <Text style={styles.contactItemLink}>+91 91192 02035</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenUrl('mailto:Mszero2infinity@gmail.com')}
              style={styles.contactItemRow}
            >
              <View style={styles.contactIconCircle}>
                <Mail size={14} color="#60a5fa" />
              </View>
              <Text style={styles.contactItemLink}>Mszero2infinity@gmail.com</Text>
            </TouchableOpacity>

            {/* Website */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenUrl('https://zeroeducators.com')}
              style={styles.contactItemRow}
            >
              <View style={styles.contactIconCircle}>
                <Globe size={14} color="#60a5fa" />
              </View>
              <Text style={styles.contactItemLink}>zeroeducators.com</Text>
            </TouchableOpacity>
          </View>

          {/* Support Hours Card */}
          <View style={styles.hoursCard}>
            <View style={styles.hoursHeaderRow}>
              <Clock size={13} color="#d4af37" />
              <Text style={styles.hoursHeaderText}>SUPPORT HOURS</Text>
            </View>
            <View style={styles.hoursContentRow}>
              <Text style={styles.hoursDaysText}>Mon – Sat</Text>
              <Text style={styles.hoursTimeText}>10:00 AM – 7:00 PM</Text>
            </View>
            <View style={styles.hoursContentRow}>
              <Text style={styles.hoursDaysText}>Sunday</Text>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>CLOSED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Decorative Divider with Stars & GraduationCap */}
        <View style={styles.decorativeDivider}>
          <View style={styles.dividerLine} />
          <View style={styles.starsWrapper}>
            <Star size={10} color="#d4af37" fill="#d4af37" />
            <GraduationCap size={16} color="#d4af37" />
            <Star size={10} color="#d4af37" fill="#d4af37" />
          </View>
          <View style={styles.dividerLine} />
        </View>
      </View>

      {/* ── 3. Bottom Copyright & Developer Info Bar ── */}
      <View style={styles.copyrightBar}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} Zero Educators. All rights reserved.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleOpenUrl('https://wa.me/919119202035')}
          style={styles.devRow}
        >
          <Text style={styles.devText}>
            Designed & Developed by <Text style={styles.devHighlight}>IITNS</Text> | Contact: WhatsApp
          </Text>
        </TouchableOpacity>

        <View style={styles.legalLinksRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenUrl('https://zeroeducators.com/terms-and-conditions')}
          >
            <Text style={styles.legalLinkText}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenUrl('https://zeroeducators.com/terms-and-conditions#refund-policy')}
          >
            <Text style={styles.legalLinkText}>No-Refund Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleOpenUrl('https://zeroeducators.com/privacy-policy')}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    backgroundColor: '#051024',
  },

  // 1. CTA Strip
  ctaStrip: {
    backgroundColor: '#071830',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
  },
  ctaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ctaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#d4af37',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  newsletterForm: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  newsletterInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  newsletterBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  newsletterBtnText: {
    color: '#050f20',
    fontWeight: '800',
    fontSize: 13,
  },

  // 2. Main Body
  mainBody: {
    backgroundColor: '#051024',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
  },
  brandBlock: {
    marginBottom: 32,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  brandLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0c2b57',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 38,
    height: 38,
  },
  brandTitleBox: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },
  brandDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 18,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#d4af37',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  linksGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  linkRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  linkRowText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },

  // Contact
  contactList: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 18,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 92, 184, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(11, 92, 184, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItemText: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  contactItemLink: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },

  // Working Hours Card
  hoursCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 92, 184, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  hoursHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  hoursHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#d4af37',
  },
  hoursContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hoursDaysText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  hoursTimeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  closedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 1,
  },

  // Divider
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  starsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // 3. Copyright Bar
  copyrightBar: {
    backgroundColor: '#01040a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  copyrightText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 6,
  },
  devRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  devText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
  devHighlight: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  legalLinkText: {
    fontSize: 11,
    color: '#64748b',
  },
  legalDot: {
    color: '#334155',
    fontSize: 11,
  },
});
