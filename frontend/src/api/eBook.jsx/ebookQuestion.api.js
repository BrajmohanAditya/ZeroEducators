import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

const client = axios.create({
  baseURL: `${baseUrl}/ebookQuestion`,
  withCredentials: true,
});

export const createEbookQuestionApi = async (payload) => {
  const { data } = await client.post("/create", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const getEbookQuestionsApi = async ({ ebookId, chapterNumber }) => {
  const url = chapterNumber
    ? `/ebook/${ebookId}/chapter/${chapterNumber}`
    : `/ebook/${ebookId}`;
  const { data } = await client.get(url);
  return data;
};

export const deleteEbookQuestionApi = async (id) => {
  const { data } = await client.delete(`/delete/${id}`);
  return data;
};

export const updateEbookQuestionApi = async ({ id, payload }) => {
  const { data } = await client.put(`/update/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
