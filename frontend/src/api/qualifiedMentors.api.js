import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

// Create Qualified Mentor
export const createQualifiedMentorApi = async (formData) => {
  try {
    const response = await axios.post(`${baseUrl}/mentor/create`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get All Qualified Mentors
export const getQualifiedMentorsApi = async () => {
  try {
    const response = await axios.get(`${baseUrl}/mentor/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update Qualified Mentor
export const updateQualifiedMentorApi = async ({ id, data }) => {
  try {
    const isFormData = data instanceof FormData;
    const response = await axios.put(`${baseUrl}/mentor/${id}`, data, {
      withCredentials: true,
      headers: {
        "Content-Type": isFormData ? "multipart/form-data" : "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete Qualified Mentor
export const deleteQualifiedMentorApi = async (id) => {
  try {
    const response = await axios.delete(`${baseUrl}/mentor/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
