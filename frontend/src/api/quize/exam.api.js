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
