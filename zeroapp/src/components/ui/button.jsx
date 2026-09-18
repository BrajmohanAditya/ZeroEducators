import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  ...props
}) {
  const buttonStyles = [
    styles.base,
    styles[variant] || styles.default,
    sizeStyles[size] || sizeStyles.default,
    disabled && styles.disabled,
    style,
  ];

  const labelStyles = [
    styles.label,
    textStyles[variant] || textStyles.default,
    sizeTextStyles[size] || sizeTextStyles.default,
    disabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyles}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#ffffff'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {typeof children === 'string' ? (
            <Text style={labelStyles}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  default: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.destructive,
    ...shadows.sm,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  labelDisabled: {
    color: colors.textLight,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  default: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  lg: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  icon: {
    padding: 10,
    borderRadius: 10,
  },
});

const textStyles = StyleSheet.create({
  default: {
    color: '#ffffff',
  },
  outline: {
    color: colors.primary,
  },
  secondary: {
    color: colors.primary,
  },
  ghost: {
    color: colors.textPrimary,
  },
  destructive: {
    color: '#ffffff',
  },
});

const sizeTextStyles = StyleSheet.create({
  sm: {
    fontSize: 13,
  },
  default: {
    fontSize: 15,
  },
  lg: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Button;
