import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

// Create Success Board Student
export const createSuccessBoardApi = async (formData) => {
  try {
    const response = await axios.post(`${baseUrl}/successBoard/create`, formData, {
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

// Get All Success Board Students
export const getSuccessBoardApi = async () => {
  try {
    const response = await axios.get(`${baseUrl}/successBoard/all`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update Success Board Student
export const updateSuccessBoardApi = async ({ id, data }) => {
  try {
    // If data contains a file, we use multipart/form-data, otherwise application/json
    const isFormData = data instanceof FormData;
    const response = await axios.put(`${baseUrl}/successBoard/${id}`, data, {
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

// Delete Success Board Student
export const deleteSuccessBoardApi = async (id) => {
  try {
    const response = await axios.delete(`${baseUrl}/successBoard/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
