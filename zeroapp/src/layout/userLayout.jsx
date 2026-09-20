import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, BookOpen, BookCheck, FileText, User } from 'lucide-react-native';
import Navbar from '../components/userComponent/Navbar';
import { colors, shadows } from '../theme/colors';

export const UserLayout = ({
  children,
  activeTab = 'Home',
  onTabChange,
  user,
  onNavigate,
  onLogout,
  onSearchPress,
  courses = [],
}) => {
  const tabs = [
    { name: 'Home', label: 'Home', icon: Home },
    { name: 'Courses', label: 'Courses', icon: BookOpen },
    { name: 'eBooks', label: 'eBooks', icon: FileText },
    { name: 'Quizzes', label: 'Tests', icon: BookCheck },
    { name: 'Profile', label: 'Account', icon: User },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Navbar */}
      <Navbar
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        courses={courses}
      />

      {/* Main Screen Content */}
      <View style={styles.contentContainer}>{children}</View>

      {/* Mobile Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={() => onTabChange && onTabChange(tab.name)}
              style={styles.tabItem}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Icon
                  size={20}
                  color={isActive ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingBottom: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadows.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
});

export default UserLayout;
