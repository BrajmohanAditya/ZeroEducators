import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  Search,
  User,
  BookOpen,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';

export const Navbar = ({
  user,
  onNavigate,
  onLogout,
  courses = [],
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNav = (screen, params = null) => {
    setMenuVisible(false);
    setIsSearchOpen(false);
    if (onNavigate) {
      onNavigate(screen, params);
    }
  };

  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <View style={styles.headerContainer}>
      {/* Top Main Bar */}
      <View style={styles.topRow}>
        {/* Brand Logo & Name */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleNav('Home')}
          style={styles.brandContainer}
        >
          <Image
            source={require('../../assets/logo3rd.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandMainText}>ZEROEDUCATORS</Text>
          </View>
        </TouchableOpacity>

        {/* Right Section: Search Icon + Avatar */}
        <View style={styles.rightActions}>
          {/* Search Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsSearchOpen(!isSearchOpen)}
            style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
          >
            {isSearchOpen ? (
              <X size={20} color={colors.primary} />
            ) : (
              <Search size={20} color="#0f172a" />
            )}
          </TouchableOpacity>

          {/* User Avatar Popover Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMenuVisible(true)}
            style={styles.avatarTrigger}
          >
            <View style={styles.avatarBorder}>
              {user?.name ? (
                <Text style={styles.avatarInitials}>
                  {user.name.slice(0, 2).toUpperCase()}
                </Text>
              ) : (
                <User size={16} color="#073b75" />
              )}
            </View>
            <ChevronDown size={14} color="#64748b" style={styles.chevron} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Live Search Bar (matching frontend SearchBar.jsx) */}
      {isSearchOpen && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputBox}>
            <Search size={16} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search courses, tests, topics..."
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Live Search Results Dropdown */}
          {filteredCourses.length > 0 && (
            <ScrollView
              style={styles.searchResultsDropdown}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCourses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={styles.searchResultItem}
                  onPress={() => handleNav('SingleCourse', { course })}
                >
                  <BookOpen size={16} color={colors.primary} />
                  <Text style={styles.searchResultText} numberOfLines={1}>
                    {course.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Popover User Menu Modal (matching frontend popover) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.popoverContent}>
                {/* Popover Header */}
                <View style={styles.popoverHeader}>
                  <Text style={styles.popoverUserName}>
                    {user?.name || 'Welcome back'}
                  </Text>
                  <Text style={styles.popoverSubText}>
                    {user ? 'Manage your account' : 'Sign in to access your courses'}
                  </Text>
                </View>

                <View style={styles.menuDivider} />

                {/* Nav Items (Identical to frontend navItems array) */}
                {user ? (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleNav('Profile')}
                    >
                      <User size={16} color="#64748b" />
                      <Text style={styles.menuItemLabel}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleNav('MyCourses')}
                    >
                      <BookOpen size={16} color="#64748b" />
                      <Text style={styles.menuItemLabel}>Your Courses</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        if (onLogout) onLogout();
                      }}
                    >
                      <LogOut size={16} color="#ef4444" />
                      <Text style={[styles.menuItemLabel, { color: '#ef4444' }]}>
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleNav('Login')}
                    >
                      <LogIn size={16} color={colors.primary} />
                      <Text style={[styles.menuItemLabel, { color: colors.primary, fontWeight: '700' }]}>
                        Log in
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleNav('Register')}
                    >
                      <UserPlus size={16} color="#0f172a" />
                      <Text style={styles.menuItemLabel}>Sign up</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 3,
    borderBottomColor: '#d4af37', // Signature frontend gold border
    ...shadows.md,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 60,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 44,
    height: 44,
    marginRight: 8,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandMainText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#073b75',
    letterSpacing: 0.8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  iconButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  avatarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.12)', // gold highlight hover matching web
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#d4af37', // Exact 3px gold border from web frontend
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#073b75',
  },
  chevron: {
    marginLeft: 4,
    marginRight: 4,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
  },
  searchResultsDropdown: {
    maxHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchResultText: {
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'flex-end',
    paddingTop: 65,
    paddingRight: 16,
  },
  popoverContent: {
    width: 230,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.lg,
    paddingVertical: 6,
  },
  popoverHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  popoverUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  popoverSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 12,
  },
});

export default Navbar;
