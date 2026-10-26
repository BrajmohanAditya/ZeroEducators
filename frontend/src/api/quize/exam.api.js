import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const createExamApi = async (formData) => {
  const res = await axios.post(`${baseUrl}/exam/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data;
};

export const getExamsApi = async (params = {}) => {
  let url = `${baseUrl}/exam/all`;
  const queryParts = [];
  if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (queryParts.length > 0) {
    url += `?${queryParts.join("&")}`;
  }

  const res = await axios.get(url, {
    withCredentials: true,
  });
  return res.data;
};

export const getExamByIdApi = async (id) => {
  const res = await axios.get(`${baseUrl}/exam/single/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateExamApi = async ({ id, payload }) => {
  const res = await axios.put(`${baseUrl}/exam/update/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data;
};

export const deleteExamApi = async (id) => {
  const res = await axios.delete(`${baseUrl}/exam/delete/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

export const toggleExamLockApi = async (id) => {
  const res = await axios.patch(`${baseUrl}/exam/toggle-lock/${id}`, {}, {
    withCredentials: true,
  });
  return res.data;
};

export const getMyPurchasedExamsApi = async () => {
  try {
    const res = await axios.get(`${baseUrl}/exam/my-purchased-exams`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    return {
      success: true,
      purchasedExams: [],
      purchasedExamIds: [],
      isAdmin: false,
    };
  }
};

export const searchUsersForExamEnrollmentApi = async (query, examId) => {
  const url = `${baseUrl}/exam/admin/users/search?query=${encodeURIComponent(query || "")}${
    examId ? `&examId=${examId}` : ""
  }`;
  const res = await axios.get(url, { withCredentials: true });
  return res.data;
};

export const grantExamAccessApi = async (payload) => {
  const res = await axios.post(`${baseUrl}/exam/admin/grant-access`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const revokeExamAccessApi = async (payload) => {
  const res = await axios.post(`${baseUrl}/exam/admin/revoke-access`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const getExamEnrolledStudentsApi = async (examId) => {
  const res = await axios.get(`${baseUrl}/exam/admin/${examId}/enrolled-students`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateExamStudentExpiryApi = async (payload) => {
  const res = await axios.put(`${baseUrl}/exam/admin/update-student-expiry`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const getExamLinkedCoursesApi = async (examId) => {
  const res = await axios.get(`${baseUrl}/exam/admin/${examId}/linked-courses`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateExamLinkedCoursesApi = async (payload) => {
  const res = await axios.put(`${baseUrl}/exam/admin/link-courses`, payload, {
    withCredentials: true,
  });
  return res.data;
};



