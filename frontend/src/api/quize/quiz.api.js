import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

// This function takes our perfectly formatted data and POSTs it to your backend
export const createQuizApi = async (payload) => {
    const res = await axios.post(`${baseUrl}/quiz/create`, 
        payload, 
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        }
    );
    return res.data;
};

export const getQuizzesApi = async (quizType) => {
    // Construct the URL with query parameters if quizType is provided
    let url = `${baseUrl}/quiz/getQuizzes`;
    if (quizType) {
        url += `?quizType=${quizType}`;
    }

    const res = await axios.get(url, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
    });
    return res.data;
};

export const deleteQuizApi = async (id) => {
    const res = await axios.delete(`${baseUrl}/quiz/delete/${id}`, {
        withCredentials: true
    });
    return res.data;
};

export const getQuizByIdApi = async (id) => {
    const res = await axios.get(`${baseUrl}/quiz/getQuiz/${id}`, {
        withCredentials: true
    });
    return res.data;
};

export const toggleQuizLockApi = async (id) => {
    const res = await axios.patch(`${baseUrl}/quiz/toggle-lock/${id}`, {}, {
        withCredentials: true
    });
    return res.data;
};

export const toggleQuizTypeApi = async (id) => {
    const res = await axios.patch(`${baseUrl}/quiz/quizType/${id}`, {}, {
        withCredentials: true
    });
    return res.data;
};

export const updateQuizApi = async ({ id, payload }) => {
    const res = await axios.put(`${baseUrl}/quiz/update/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
    });
    return res.data;
};
