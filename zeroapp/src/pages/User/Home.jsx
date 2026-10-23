import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import TrendingBar from '../../components/userComponent/TrendingBar';
import HeroSection from '../../components/userComponent/HeroSection/heroSection';
import StudyMaterial from './study.material';
import CourseSection from '../../components/userComponent/courseSection';
import Footer from '../../components/userComponent/footer';
import { colors } from '../../theme/colors';
import {
  fetchLiveCourses,
  fetchLiveHeroSection,
  refreshUserProfileApi,
} from '../../config/api';

import FloatingWhatsApp from '../../components/ui/FloatingWhatsApp';

export const Home = ({
  onNavigate,
  onCoursePress,
  onExamPress,
  user,
  onUserRefresh,
  initialCourses = [],
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState(initialCourses);
  const [heroData, setHeroData] = useState(null);

  // Sync if parent passes or updates initialCourses
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses);
    }
  }, [initialCourses]);

  const loadLiveData = async (isManualRefresh = false) => {
    try {
      const promises = [fetchLiveHeroSection()];
      // Only fetch courses if not already provided or if manual pull-to-refresh
      if (isManualRefresh || courses.length === 0) {
        promises.push(fetchLiveCourses());
      }
      if (isManualRefresh) {
        promises.push(refreshUserProfileApi());
      }

      const results = await Promise.all(promises);
      const liveHero = results[0];
      const liveCourses = results[1];
      const freshUser = results[2];

      if (liveHero) {
        setHeroData(liveHero);
      }
      if (liveCourses && liveCourses.length > 0) {
        setCourses(liveCourses);
      }
      if (freshUser && onUserRefresh) {
        onUserRefresh(freshUser);
      }
    } catch (err) {
      console.log('Error loading live data:', err);
    }
  };

  useEffect(() => {
    loadLiveData(false);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadLiveData(true);
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 1. Trending Bar */}
        <TrendingBar
          onLinkPress={(link) => {
            if (onNavigate) onNavigate('Courses');
          }}
        />

        {/* 2. Live Hero Section */}
        <HeroSection
          banners={heroData?.banners || []}
          upcomingExams={heroData?.upcomingExams || []}
        />

        {/* 3. Study Dashboard (Live Free/Paid Quizzes, eBooks, Study Materials, Follow Us) */}
        <StudyMaterial onNavigate={onNavigate} />

        {/* 4. Live Courses Section from AWS */}
        <CourseSection
          courses={courses}
          user={user}
          onCoursePress={(course) => {
            if (onCoursePress) {
              onCoursePress(course);
            } else if (onNavigate) {
              onNavigate('SingleCourse', { course });
            }
          }}
        />

        {/* 4. Footer matching web frontend */}
        <Footer
          onNavigate={onNavigate}
          onLinkPress={(policy) => {
            if (onNavigate) onNavigate('Terms');
          }}
        />
      </ScrollView>

      {/* 5. Floating WhatsApp Support Button */}
      <FloatingWhatsApp />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default Home;
