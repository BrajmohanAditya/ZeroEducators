import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

// Create Premium Student
export const createPremiumStudentApi = async (formData) => {
  try {
    const response = await axios.post(`${baseUrl}/premiumStudent/create`, formData, {
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

// Get All Premium Students
export const getPremiumStudentsApi = async () => {
  try {
    const response = await axios.get(`${baseUrl}/premiumStudent/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update Premium Student
export const updatePremiumStudentApi = async ({ id, data }) => {
  try {
    // If data contains a file, we use multipart/form-data, otherwise application/json
    const isFormData = data instanceof FormData;
    const response = await axios.put(`${baseUrl}/premiumStudent/${id}`, data, {
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

// Delete Premium Student
export const deletePremiumStudentApi = async (id) => {
  try {
    const response = await axios.delete(`${baseUrl}/premiumStudent/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
