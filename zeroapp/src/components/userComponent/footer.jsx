import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme/colors';

export const Footer = ({ onLinkPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo3rd.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>ZEROEDUCATORS</Text>
      </View>
      <Text style={styles.tagline}>
        Empowering aspirants with structured banking coaching, live test series, and personalized mentor guidance.
      </Text>

      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => onLinkPress && onLinkPress('Terms')}>
          <Text style={styles.linkText}>Terms & Conditions</Text>
        </TouchableOpacity>
        <Text style={styles.dot}>•</Text>
        <TouchableOpacity onPress={() => onLinkPress && onLinkPress('Privacy')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.dot}>•</Text>
        <TouchableOpacity onPress={() => onLinkPress && onLinkPress('Refund')}>
          <Text style={styles.linkText}>Refund Policy</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>
        © {new Date().getFullYear()} ZeroEducators. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a', // slate-900
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#d4af37',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 320,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  dot: {
    marginHorizontal: 8,
    color: '#475569',
  },
  copyright: {
    fontSize: 11,
    color: '#64748b',
  },
});

export default Footer;
