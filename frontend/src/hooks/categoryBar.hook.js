import {
  getActiveCategoryBarsApi,
  getAllCategoryBarsAdminApi,
  createCategoryBarApi,
  updateCategoryBarApi,
  deleteCategoryBarApi,
} from "../api/categoryBar.api.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetActiveCategoryBarsHook = () => {
  return useQuery({
    queryKey: ["activeCategoryBars"],
    queryFn: getActiveCategoryBarsApi,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetAllCategoryBarsAdminHook = () => {
  return useQuery({
    queryKey: ["adminCategoryBars"],
    queryFn: getAllCategoryBarsAdminApi,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateCategoryBarHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategoryBarApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Category created successfully!");
      queryClient.invalidateQueries(["adminCategoryBars"]);
      queryClient.invalidateQueries(["activeCategoryBars"]);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to create category.";
      toast.error(msg);
    },
  });
};

export const useUpdateCategoryBarHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategoryBarApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Category updated successfully!");
      queryClient.invalidateQueries(["adminCategoryBars"]);
      queryClient.invalidateQueries(["activeCategoryBars"]);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to update category.";
      toast.error(msg);
    },
  });
};

export const useDeleteCategoryBarHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategoryBarApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Category deleted successfully!");
      queryClient.invalidateQueries(["adminCategoryBars"]);
      queryClient.invalidateQueries(["activeCategoryBars"]);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to delete category.";
      toast.error(msg);
    },
  });
};

