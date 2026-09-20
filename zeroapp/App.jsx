import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserLayout from './src/layout/userLayout';
import Home from './src/pages/User/Home';
import CourseSection from './src/components/userComponent/courseSection';
import SingleCourse from './src/pages/User/SingleCourse';
import YourAllPurchasedCourse from './src/pages/User/yourAllPurchasedCourse';
import SinglePurchasedCourse from './src/pages/User/SinglePurchasedCourse';
import AllEbooks from './src/pages/User/eBooks/All.eBook';
import QuizeDetail from './src/pages/User/quize/quize.detail';
import QuizeInterface from './src/pages/User/quize/quize.interface';
import Login from './src/pages/Auth/Login';
import Register from './src/pages/Auth/Register';
import StudyMaterial from './src/pages/User/study.material';
import { fetchLiveCourses } from './src/config/api';

export function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenParams, setScreenParams] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [liveCourses, setLiveCourses] = useState([]);

  useEffect(() => {
    fetchLiveCourses().then((data) => {
      if (data && data.length > 0) setLiveCourses(data);
    });
  }, []);

  const isCoursePurchased = (course) => {
    if (!currentUser || !course?._id) return false;
    const cid = String(course._id);
    const list = currentUser.purchasedCourse || currentUser.purchasedCourses || [];
    return list.some((pc) => {
      if (!pc) return false;
      if (typeof pc === 'string') return pc === cid;
      return (
        String(pc._id || '') === cid ||
        String(pc.id || '') === cid ||
        String(pc.courseId || '') === cid ||
        String(pc.courseId?._id || '') === cid
      );
    });
  };

  const myPurchasedCourses = useMemo(() => {
    if (!currentUser) return [];
    const directList = (currentUser.purchasedCourse || currentUser.purchasedCourses || []).filter(
      (item) => item && typeof item === 'object' && item.title
    );
    if (directList.length > 0) return directList;
    return liveCourses.filter((c) => isCoursePurchased(c));
  }, [currentUser, liveCourses]);

  const handleCoursePress = (course) => {
    if (isCoursePurchased(course)) {
      navigate('CoursePlayer', { course });
    } else {
      navigate('SingleCourse', { course });
    }
  };

  const navigate = (screenName, params = null) => {
    setScreenParams(params);
    setCurrentScreen(screenName);

    // Sync tab if matching
    if (['Home', 'Courses', 'eBooks', 'Quizzes', 'Profile'].includes(screenName)) {
      setActiveTab(screenName);
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'Profile') {
      if (currentUser) {
        navigate('MyCourses');
      } else {
        navigate('Login');
      }
    } else {
      navigate(tabName);
    }
  };

  // Full screen views (without bottom navbar / layout)
  if (currentScreen === 'QuizInterface') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <QuizeInterface
          quiz={screenParams?.quiz}
          onExit={() => navigate('Quizzes')}
          onSubmitSuccess={() => navigate('Quizzes')}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'SingleCourse') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SingleCourse
          course={screenParams?.course}
          user={currentUser}
          onBack={() => navigate('Home')}
          onNavigate={navigate}
          onEnroll={(course) => {
            if (!currentUser) {
              navigate('Login');
            } else {
              navigate('CoursePlayer', { course });
            }
          }}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'CoursePlayer') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <SinglePurchasedCourse
          course={screenParams?.course}
          onBack={() => navigate('MyCourses')}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'Login') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#eef2ff" />
        <Login
          onNavigate={(target) => navigate(target)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            navigate('Home');
          }}
        />
      </SafeAreaProvider>
    );
  }

  if (currentScreen === 'Register') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#eef2ff" />
        <Register
          onNavigate={(target) => navigate(target)}
          onRegisterSuccess={(user) => {
            setCurrentUser(user);
            navigate('Home');
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Regular screens wrapped with UserLayout (Navbar + Bottom Tabs)
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <UserLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={currentUser}
        onNavigate={navigate}
        onLogout={() => setCurrentUser(null)}
        onSearchPress={() => navigate('Courses')}
      >
        {currentScreen === 'Home' && (
          <Home
            user={currentUser}
            onNavigate={navigate}
            onCoursePress={handleCoursePress}
          />
        )}

        {currentScreen === 'StudyMaterial' && (
          <StudyMaterial onNavigate={navigate} />
        )}

        {currentScreen === 'Courses' && (
          <CourseSection
            courses={liveCourses}
            user={currentUser}
            onCoursePress={handleCoursePress}
          />
        )}

        {currentScreen === 'MyCourses' && (
          <YourAllPurchasedCourse
            purchasedCourses={myPurchasedCourses}
            onOpenCourse={(course) => navigate('CoursePlayer', { course })}
            onExploreCourses={() => navigate('Courses')}
          />
        )}

        {currentScreen === 'eBooks' && (
          <AllEbooks
            onSelectEbook={(ebook) => navigate('Courses')}
            onBack={() => navigate('Home')}
          />
        )}

        {currentScreen === 'Quizzes' && (
          <QuizeDetail
            onStartQuiz={(quiz) => navigate('QuizInterface', { quiz })}
          />
        )}
      </UserLayout>
    </SafeAreaProvider>
  );
}

export default App;
