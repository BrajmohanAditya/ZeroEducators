import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;

export const getAdminAnalyticsApi = async () => {
  const res = await axios.get(`${baseUrl}/analytics/overview`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};
