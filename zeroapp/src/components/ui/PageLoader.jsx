import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const PageLoader = ({
  isLoading,
  isError,
  errorMessage = 'Something went wrong. Please try again.',
  children,
}) => {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading, please wait...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorExclamation}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorDescription}>{errorMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  errorIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.destructiveLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  errorExclamation: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.destructive,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.destructive,
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default PageLoader;
