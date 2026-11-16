import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

// Public: Get active category items with populated courses
export const getActiveCategoryBarsApi = async () => {
  const res = await axios.get(`${baseUrl}/category-bar`, {
    withCredentials: true,
  });
  return res.data;
};

// Admin: Get all category items (including inactive)
export const getAllCategoryBarsAdminApi = async () => {
  const res = await axios.get(`${baseUrl}/category-bar/admin/all`, {
    withCredentials: true,
  });
  return res.data;
};

// Admin: Create category bar item
export const createCategoryBarApi = async (data) => {
  const res = await axios.post(`${baseUrl}/category-bar`, data, {
    withCredentials: true,
  });
  return res.data;
};

// Admin: Update category bar item
export const updateCategoryBarApi = async ({ id, data }) => {
  const res = await axios.put(`${baseUrl}/category-bar/${id}`, data, {
    withCredentials: true,
  });
  return res.data;
};

// Admin: Delete category bar item
export const deleteCategoryBarApi = async (id) => {
  const res = await axios.delete(`${baseUrl}/category-bar/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

