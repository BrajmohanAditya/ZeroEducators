import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createQualifiedMentorApi,
  getQualifiedMentorsApi,
  updateQualifiedMentorApi,
  deleteQualifiedMentorApi,
} from "../api/qualifiedMentors.api.js";

// Hook to Create a Qualified Mentor
export const useCreateQualifiedMentorHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQualifiedMentorApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Mentor added successfully!");
      queryClient.invalidateQueries({ queryKey: ["getQualifiedMentors"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to add mentor";
      toast.error(errorMessage);
      console.error("Error creating qualified mentor:", err);
    },
  });
};

// Hook to Get All Qualified Mentors
export const useGetQualifiedMentorsHook = () => {
  return useQuery({
    queryFn: getQualifiedMentorsApi,
    queryKey: ["getQualifiedMentors"],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook to Update a Qualified Mentor
export const useUpdateQualifiedMentorHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQualifiedMentorApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Mentor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getQualifiedMentors"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to update mentor";
      toast.error(errorMessage);
      console.error("Error updating qualified mentor:", err);
    },
  });
};

// Hook to Delete a Qualified Mentor
export const useDeleteQualifiedMentorHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQualifiedMentorApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Mentor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getQualifiedMentors"] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to delete mentor";
      toast.error(errorMessage);
      console.error("Error deleting qualified mentor:", err);
    },
  });
};
