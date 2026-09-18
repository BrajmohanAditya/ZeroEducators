import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function Badge({
  children,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}) {
  return (
    <View style={[styles.base, styles[variant] || styles.default, sizeStyles[size], style]}>
      <Text style={[styles.text, textStyles[variant] || textStyles.default, sizeTextStyles[size], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: colors.primaryLight,
  },
  accent: {
    backgroundColor: colors.accentLight,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: colors.destructiveLight,
  },
  text: {
    fontWeight: '600',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  default: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});

const textStyles = StyleSheet.create({
  default: {
    color: colors.primary,
  },
  accent: {
    color: colors.accentForeground,
  },
  success: {
    color: colors.successForeground,
  },
  outline: {
    color: colors.textSecondary,
  },
  destructive: {
    color: colors.destructive,
  },
});

const sizeTextStyles = StyleSheet.create({
  sm: {
    fontSize: 11,
  },
  default: {
    fontSize: 12,
  },
  lg: {
    fontSize: 14,
  },
});

export default Badge;
