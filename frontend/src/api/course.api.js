import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const createCourseApi = async (payload) => {
  const res = await axios.post(`${baseUrl}/course/createCourse`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
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
      headers: { "Content-Type": "multipart/form-data" },
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
      headers: { "Content-Type": "multipart/form-data" },
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
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
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
