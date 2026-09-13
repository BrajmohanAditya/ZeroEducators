import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

// ===================================
// USER: Validate Coupon
// ===================================
export const validateCouponApi = async ({ code, courseId, planId, planDuration }) => {
  const res = await axios.post(
    `${baseUrl}/coupon/validate`,
    { code, courseId, planId, planDuration },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

// ===================================
// ADMIN: Get All Coupons
// ===================================
export const getAllCouponsApi = async () => {
  const res = await axios.get(`${baseUrl}/coupon/admin/all`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

// ===================================
// ADMIN: Create Coupon
// ===================================
export const createCouponApi = async (couponData) => {
  const res = await axios.post(`${baseUrl}/coupon/admin/create`, couponData, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

// ===================================
// ADMIN: Update Coupon
// ===================================
export const updateCouponApi = async ({ id, couponData }) => {
  const res = await axios.put(`${baseUrl}/coupon/admin/${id}`, couponData, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};

// ===================================
// ADMIN: Toggle Coupon Active Status
// ===================================
export const toggleCouponStatusApi = async (id) => {
  const res = await axios.patch(
    `${baseUrl}/coupon/admin/${id}/toggle`,
    {},
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );
  return res.data;
};

// ===================================
// ADMIN: Delete Coupon
// ===================================
export const deleteCouponApi = async (id) => {
  const res = await axios.delete(`${baseUrl}/coupon/admin/${id}`, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return res.data;
};
