import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const submitQuizApi = async (data) => {
  const response = await axios.post(`${baseUrl}/quizResult/submit`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const getMyQuizResultsApi = async (quizId) => {
  const url = quizId ? `${baseUrl}/quizResult/my-results?quizId=${quizId}` : `${baseUrl}/quizResult/my-results`;
  const response = await axios.get(url, {
    withCredentials: true,
  });
  return response.data;
};

export const getAllQuizResultsApi = async (quizId) => {
  const response = await axios.get(`${baseUrl}/quizResult/all-results/${quizId}`, {
    withCredentials: true,
  });
  return response.data;
};
