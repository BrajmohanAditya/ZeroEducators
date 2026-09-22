import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StatusBar, BackHandler, ToastAndroid, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserLayout from './src/layout/userLayout';
import Home from './src/pages/User/Home';
import CourseSection from './src/components/userComponent/courseSection';
import SingleCourse from './src/pages/User/SingleCourse';
import YourAllPurchasedCourse from './src/pages/User/yourAllPurchasedCourse';
import SinglePurchasedCourse from './src/pages/User/SinglePurchasedCourse';
import AllEbooks from './src/pages/User/eBooks/All.eBook';
import Login from './src/pages/Auth/Login';
import Register from './src/pages/Auth/Register';
import StudyMaterial from './src/pages/User/study.material';
import { fetchLiveCourses } from './src/config/api';
import { getUserSession, clearUserSession } from './src/utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenParams, setScreenParams] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [liveCourses, setLiveCourses] = useState([]);

  // Hardware Back button & navigation history
  const exitToastRef = useRef(null);
  const [history, setHistory] = useState([{ screen: 'Home', params: null, tab: 'Home' }]);

  const goBack = () => {
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const prev = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params);
      if (prev.tab) setActiveTab(prev.tab);
      return true;
    } else if (currentScreen !== 'Home') {
      setHistory([{ screen: 'Home', params: null, tab: 'Home' }]);
      setCurrentScreen('Home');
      setScreenParams(null);
      setActiveTab('Home');
      return true;
    }
    return false;
  };

  const navigate = (screenName, params = null) => {
    setScreenParams(params);
    setCurrentScreen(screenName);

    // Sync tab if matching
    const tabMap = {
      Home: 'Home',
      eBooks: 'eBooks',
      MyCourses: 'MyCourses',
      Profile: 'MyCourses',
    };
    const targetTab = tabMap[screenName] || activeTab;
    if (tabMap[screenName]) {
      setActiveTab(tabMap[screenName]);
    }

    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.screen === screenName && JSON.stringify(last.params) === JSON.stringify(params)) {
        return prev;
      }
      return [...prev, { screen: screenName, params, tab: targetTab }];
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1 || currentScreen !== 'Home') {
        goBack();
        return true;
      }

      if (Platform.OS === 'android') {
        const now = Date.now();
        if (exitToastRef.current && now - exitToastRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        exitToastRef.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [history, currentScreen]);

  useEffect(() => {
    // Restore user session on app launch from AsyncStorage
    getUserSession().then((session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
    }).catch((err) => {
      console.log('Error restoring user session:', err);
    });

    fetchLiveCourses().then((data) => {
      if (data && data.length > 0) setLiveCourses(data);
    });
  }, []);

  const handleLogout = async () => {
    await clearUserSession();
    setCurrentUser(null);
    navigate('Home');
  };

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
    // Prioritize liveCourses matching purchased IDs to ensure full thumbnails and metadata
    const fromLive = liveCourses.filter((c) => isCoursePurchased(c));
    if (fromLive.length > 0) return fromLive;

    const directList = (currentUser.purchasedCourse || currentUser.purchasedCourses || []).filter(
      (item) => item && typeof item === 'object' && item.title
    );
    return directList;
  }, [currentUser, liveCourses]);

  const handleCoursePress = (course) => {
    if (isCoursePurchased(course)) {
      navigate('CoursePlayer', { course });
    } else {
      navigate('SingleCourse', { course });
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'MyCourses' || tabName === 'Profile') {
      if (currentUser) {
        navigate('MyCourses');
      } else {
        navigate('Login');
      }
    } else {
      navigate(tabName);
    }
  };


  if (currentScreen === 'SingleCourse') {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SingleCourse
          course={screenParams?.course}
          user={currentUser}
          onBack={goBack}
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
          user={currentUser}
          onBack={goBack}
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
          onBack={goBack}
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
          onBack={goBack}
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
        onLogout={handleLogout}
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
            onExploreCourses={() => navigate('Home')}
          />
        )}

        {currentScreen === 'eBooks' && (
          <AllEbooks
            onSelectEbook={(ebook) => navigate('Courses')}
            onBack={() => navigate('Home')}
          />
        )}

        {currentScreen === 'Quizzes' && (
          <CourseSection
            courses={liveCourses}
            user={currentUser}
            onCoursePress={handleCoursePress}
          />
        )}
      </UserLayout>
    </SafeAreaProvider>
  );
}

export default App;
