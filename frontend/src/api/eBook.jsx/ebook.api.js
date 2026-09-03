import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const createEbookApi = async (formData) => {
  const res = await axios.post(`${baseUrl}/ebook/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data;
};

export const getEbooksApi = async () => {
  const res = await axios.get(`${baseUrl}/ebook/all`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const getSingleEbookApi = async (id) => {
  const res = await axios.get(`${baseUrl}/ebook/single/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const deleteEbookApi = async (id) => {
  const res = await axios.delete(`${baseUrl}/ebook/delete/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

export const editEbookApi = async ({ id, formData }) => {
  const res = await axios.put(`${baseUrl}/ebook/edit/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data;
};
