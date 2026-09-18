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
import { fetchLiveCourses, fetchLiveHeroSection } from '../../config/api';

import FloatingWhatsApp from '../../components/ui/FloatingWhatsApp';

export const Home = ({
  onNavigate,
  onCoursePress,
  onExamPress,
  user,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [heroData, setHeroData] = useState(null);

  const loadLiveData = async () => {
    try {
      const [liveCourses, liveHero] = await Promise.all([
        fetchLiveCourses(),
        fetchLiveHeroSection(),
      ]);
      if (liveCourses && liveCourses.length > 0) {
        setCourses(liveCourses);
      }
      if (liveHero) {
        setHeroData(liveHero);
      }
    } catch (err) {
      console.log('Error loading live data from AWS:', err);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadLiveData();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          onExamPress={(exam) => {
            if (onNavigate) onNavigate('Courses');
          }}
        />

        {/* 3. Study Dashboard (Live Free/Paid Quizzes, eBooks, Study Materials, Follow Us) */}
        <StudyMaterial onNavigate={onNavigate} />

        {/* 4. Live Courses Section from AWS */}
        <CourseSection
          courses={courses}
          onCoursePress={(course) => {
            if (onCoursePress) {
              onCoursePress(course);
            } else if (onNavigate) {
              onNavigate('SingleCourse', { course });
            }
          }}
        />

        {/* 4. Footer */}
        <Footer
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
