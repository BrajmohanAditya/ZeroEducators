import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const createModuleApi = async (payload, onUploadProgress) => {
  let data = payload;
  let progressCallback = onUploadProgress;

  if (payload && payload.formData) {
    data = payload.formData;
    progressCallback = payload.onUploadProgress || onUploadProgress;
  }

  const res = await axios.post(`${baseUrl}/module/createModule`, data, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
    timeout: 0, // No client-side timeout for 2GB+ videos
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: progressCallback,
  });

  return res.data;
};

export const getModuleApi = async (id) => {
  const res = await axios.get(`${baseUrl}/module/getModuel/${id}`, {
    headers: { "Content-Type": "Application/json" },
    withCredentials: true,
  });

  return res.data;
};

export const getModuleUploadProgressApi = async (uploadId) => {
  const res = await axios.get(`${baseUrl}/module/progress/${uploadId}`, {
    withCredentials: true,
  });
  return res.data;
};

