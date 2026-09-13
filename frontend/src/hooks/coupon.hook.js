import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllCouponsApi,
  createCouponApi,
  updateCouponApi,
  toggleCouponStatusApi,
  deleteCouponApi,
  validateCouponApi,
} from "../api/coupon.api";
import { toast } from "sonner";

// ===================================
// ADMIN: Get All Coupons Query
// ===================================
export const useGetAllCouponsHook = () => {
  return useQuery({
    queryKey: ["getAllCoupons"],
    queryFn: getAllCouponsApi,
  });
};

// ===================================
// ADMIN: Create Coupon Mutation
// ===================================
export const useCreateCouponHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCouponApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getAllCoupons"]);
      toast.success(data?.message || "Coupon created successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    },
  });
};

// ===================================
// ADMIN: Update Coupon Mutation
// ===================================
export const useUpdateCouponHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCouponApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getAllCoupons"]);
      toast.success(data?.message || "Coupon updated successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update coupon");
    },
  });
};

// ===================================
// ADMIN: Toggle Coupon Active Status
// ===================================
export const useToggleCouponStatusHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleCouponStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getAllCoupons"]);
      toast.success(data?.message || "Coupon status updated!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update coupon status");
    },
  });
};

// ===================================
// ADMIN: Delete Coupon Mutation
// ===================================
export const useDeleteCouponHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCouponApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getAllCoupons"]);
      toast.success(data?.message || "Coupon deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete coupon");
    },
  });
};

// ===================================
// USER: Validate Coupon Mutation
// ===================================
export const useValidateCouponHook = () => {
  return useMutation({
    mutationFn: validateCouponApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Coupon applied successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Invalid coupon code");
    },
  });
};
