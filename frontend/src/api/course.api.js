import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const createCourseApi = async (payload) => {
  const res = await axios.post(`${baseUrl}/course/createCourse`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const getCourseApi = async (search) => {
  const res = await axios.get(`${baseUrl}/course/getCourse`, {
    params: search ? { search } : {},
    headers: { "Content-Type": "Application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const getSingleCourseApi = async (id) => {
  const res = await axios.get(`${baseUrl}/course/getSingleCourse/${id}`, {
    headers: { "Content-Type": "Application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const getSinglePurchaseCourseApi = async (courseId) => {
  const res = await axios.get(
    `${baseUrl}/course/getSinglePurchasedCourse/${courseId}`,
    {
      headers: { "Content-Type": "Application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const getAllPurchasedCourseApi = async () => {
  const res = await axios.get(`${baseUrl}/course/getAllPurchasedCourse`, {
    headers: { "Content-Type": "Application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const deleteCourseApi = async (courseId) => {
  const res = await axios.delete(
    `${baseUrl}/course/deleteCourse/${courseId}`,
    {
      headers: { "Content-Type": "Application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const editCourseApi = async ({ courseId, formData }) => {
  const res = await axios.put(
    `${baseUrl}/course/editCourse/${courseId}`,
    formData,
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const addTopicApi = async ({ courseId, topicName }) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/topic`,
    { topicName },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const deleteTopicApi = async ({ courseId, topicId }) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/topic/${topicId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const addPdfToTopicApi = async ({ courseId, topicId, formData }) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/topic/${topicId}/pdf`,
    formData,
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const deletePdfFromTopicApi = async ({ courseId, topicId, pdfId }) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/topic/${topicId}/pdf/${pdfId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const addVideoToTopicApi = async ({
  courseId,
  topicId,
  formData,
  onUploadProgress,
}) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/topic/${topicId}/video`,
    formData,
    {
      withCredentials: true,
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress,
    }
  );
  return res.data;
};

export const deleteVideoFromTopicApi = async ({
  courseId,
  topicId,
  videoId,
}) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/topic/${topicId}/video/${videoId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

// ==========================================
// SUBJECT & CHAPTER APIS
// ==========================================

export const addSubjectApi = async ({ courseId, subjectName }) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/subject`,
    { subjectName },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const deleteSubjectApi = async ({ courseId, subjectId }) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/subject/${subjectId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const addChapterApi = async ({ courseId, subjectId, chapterName }) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter`,
    { chapterName },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const deleteChapterApi = async ({ courseId, subjectId, chapterId }) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter/${chapterId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const addPdfToChapterApi = async ({
  courseId,
  subjectId,
  chapterId,
  formData,
}) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter/${chapterId}/pdf`,
    formData,
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const deletePdfFromChapterApi = async ({
  courseId,
  subjectId,
  chapterId,
  pdfId,
}) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter/${chapterId}/pdf/${pdfId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const addVideoToChapterApi = async ({
  courseId,
  subjectId,
  chapterId,
  formData,
  onUploadProgress,
}) => {
  const res = await axios.post(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter/${chapterId}/video`,
    formData,
    {
      withCredentials: true,
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress,
    }
  );
  return res.data;
};

export const deleteVideoFromChapterApi = async ({
  courseId,
  subjectId,
  chapterId,
  videoId,
}) => {
  const res = await axios.delete(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/chapter/${chapterId}/video/${videoId}`,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

// ==========================================
// ADMIN COURSE GRANT & ENROLLMENT APIS
// ==========================================

export const searchUsersForEnrollmentApi = async ({ query, courseId }) => {
  const res = await axios.get(
    `${baseUrl}/course/admin/users/search?query=${encodeURIComponent(query || "")}&courseId=${courseId || ""}`,
    { withCredentials: true }
  );
  return res.data;
};

export const grantCourseAccessApi = async (payload) => {
  const res = await axios.post(
    `${baseUrl}/course/admin/grant-access`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const revokeCourseAccessApi = async ({ courseId, userId }) => {
  const res = await axios.post(
    `${baseUrl}/course/admin/revoke-access`,
    { courseId, userId },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const getCourseEnrolledStudentsApi = async (courseId) => {
  const res = await axios.get(
    `${baseUrl}/course/admin/${courseId}/enrolled-students`,
    { withCredentials: true }
  );
  return res.data;
};

export const copyCourseApi = async (formData) => {
  const res = await axios.post(`${baseUrl}/course/copy-course`, formData, {
    withCredentials: true,
  });
  return res.data;
};

export const reorderChaptersApi = async ({ courseId, subjectId, chapterIds }) => {
  const res = await axios.put(
    `${baseUrl}/course/${courseId}/subject/${subjectId}/reorder-chapters`,
    { chapterIds },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const reorderSubjectsApi = async ({ courseId, subjectIds }) => {
  const res = await axios.put(
    `${baseUrl}/course/${courseId}/reorder-subjects`,
    { subjectIds },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

export const reorderTopicsApi = async ({ courseId, topicIds }) => {
  const res = await axios.put(
    `${baseUrl}/course/${courseId}/reorder-topics`,
    { topicIds },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};



