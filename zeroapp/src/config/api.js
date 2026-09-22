import { getUserSession, saveUserSession } from '../utils/storage';

// Live AWS Deployed Backend
export const BASE_URL = 'https://zeroeducators.com/api';

// Native fetch client (100% built into React Native - zero extra weight)
export const fetchLiveCourses = async (search = '') => {
  try {
    const url = search
      ? `${BASE_URL}/course/getCourse?search=${encodeURIComponent(search)}`
      : `${BASE_URL}/course/getCourse`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return data?.courses || [];
  } catch (err) {
    console.warn('[Live API] Error fetching courses:', err?.message || err);
    return [];
  }
};

export const fetchLiveSingleCourse = async (courseId) => {
  if (!courseId) return null;
  try {
    const res = await fetch(`${BASE_URL}/course/getSingleCourse/${courseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    return data?.course || null;
  } catch (err) {
    console.warn('[Live API] Error fetching single course:', err?.message || err);
    return null;
  }
};

export const fetchLiveHeroSection = async () => {
  try {
    const res = await fetch(`${BASE_URL}/hero`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    return data || null;
  } catch (err) {
    console.warn('[Live API] Error fetching hero section:', err?.message || err);
    return null;
  }
};

export const fetchLiveExams = async (params = {}) => {
  try {
    let url = `${BASE_URL}/exam/all`;
    const queryParts = [];
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (queryParts.length > 0) url += `?${queryParts.join('&')}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data?.exams || [];
  } catch (err) {
    console.warn('[Live API] Error fetching exams:', err?.message || err);
    return [];
  }
};

export const fetchLiveQuizzes = async (quizType = '') => {
  try {
    let url = `${BASE_URL}/quiz/getQuizzes`;
    if (quizType) url += `?quizType=${encodeURIComponent(quizType)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data?.quizzes || [];
  } catch (err) {
    console.warn('[Live API] Error fetching quizzes:', err?.message || err);
    return [];
  }
};

export const fetchLiveEbooks = async () => {
  try {
    const res = await fetch(`${BASE_URL}/ebook/all`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data?.ebooks || [];
  } catch (err) {
    console.warn('[Live API] Error fetching ebooks:', err?.message || err);
    return [];
  }
};

export const liveLoginApi = async (email, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Login failed');
  }
  return data;
};

export const liveRegisterApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Registration failed');
  }
  return data;
};

export const enrollCourseApi = async (payload) => {
  const session = await getUserSession();
  const token = session?.token;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/payment/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Enrollment failed');
  }
  return data;
};

export const checkoutSuccessApi = async (payload) => {
  const session = await getUserSession();
  const token = session?.token;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/payment/checkout-success`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Payment verification failed');
  }
  return data;
};

export const refreshUserProfileApi = async () => {
  try {
    const session = await getUserSession();
    const token = session?.token;
    if (!token) {
      console.warn('[Session] No auth token found in local storage. Please log in again to sync purchases.');
      return null;
    }
    const res = await fetch(`${BASE_URL}/getUser`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok && data?.user) {
      await saveUserSession(data.user, token);
      return data.user;
    }
  } catch (err) {
    console.warn('[Live API] Error refreshing user profile:', err);
  }
  return null;
};

export const validateCouponApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/coupon/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Invalid coupon code');
  }
  return data;
};

export default {
  BASE_URL,
  fetchLiveCourses,
  fetchLiveHeroSection,
  fetchLiveExams,
  fetchLiveQuizzes,
  liveLoginApi,
  liveRegisterApi,
  enrollCourseApi,
  checkoutSuccessApi,
  refreshUserProfileApi,
  validateCouponApi,
};

