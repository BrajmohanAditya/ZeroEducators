import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSuccessBoardApi,
  getSuccessBoardApi,
  updateSuccessBoardApi,
  deleteSuccessBoardApi,
} from "../api/success.board.api.js";

// Hook to Create a Success Board Student
export const useCreateSuccessBoardHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSuccessBoardApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student added to success board!");
      queryClient.invalidateQueries({ queryKey: ["getSuccessBoard"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to add student";
      toast.error(errorMessage);
      console.error("Error creating success board student:", err);
    },
  });
};

// Hook to Get All Success Board Students
export const useGetSuccessBoardHook = () => {
  return useQuery({
    queryFn: getSuccessBoardApi,
    queryKey: ["getSuccessBoard"],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook to Update a Success Board Student
export const useUpdateSuccessBoardHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSuccessBoardApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getSuccessBoard"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to update student";
      toast.error(errorMessage);
      console.error("Error updating success board student:", err);
    },
  });
};

// Hook to Delete a Success Board Student
export const useDeleteSuccessBoardHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSuccessBoardApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getSuccessBoard"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to delete student";
      toast.error(errorMessage);
      console.error("Error deleting success board student:", err);
    },
  });
};
