import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const createHeroSectionApi = async (formData) => {
    const res = await axios.post(`${baseUrl}/hero`, 
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        }
    );
    return res.data;
};

export const getHeroSectionApi = async () => {
    const res = await axios.get(`${baseUrl}/hero`, {
        withCredentials: true
    });
    return res.data;
};

export const deleteHeroSectionApi = async (id) => {
    const res = await axios.delete(`${baseUrl}/hero/${id}`, {
        withCredentials: true
    });
    return res.data;
};
