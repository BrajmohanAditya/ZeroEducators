import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPremiumStudentApi,
  getPremiumStudentsApi,
  updatePremiumStudentApi,
  deletePremiumStudentApi,
} from "../api/premium.Student.api.js";

// Hook to Create a Premium Student
export const useCreatePremiumStudentHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPremiumStudentApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student created successfully");
      queryClient.invalidateQueries({ queryKey: ["getPremiumStudents"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to create student";
      toast.error(errorMessage);
      console.log("Error creating premium student:", err);
    },
  });
};

// Hook to Get All Premium Students
export const useGetPremiumStudentsHook = () => {
  return useQuery({
    queryFn: getPremiumStudentsApi,
    queryKey: ["getPremiumStudents"],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook to Update a Premium Student
export const useUpdatePremiumStudentHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePremiumStudentApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getPremiumStudents"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to update student";
      toast.error(errorMessage);
      console.log("Error updating premium student:", err);
    },
  });
};

// Hook to Delete a Premium Student
export const useDeletePremiumStudentHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePremiumStudentApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getPremiumStudents"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to delete student";
      toast.error(errorMessage);
      console.log("Error deleting premium student:", err);
    },
  });
};
