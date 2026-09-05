import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createExamApi,
  getExamsApi,
  getExamByIdApi,
  updateExamApi,
  deleteExamApi,
  toggleExamLockApi,
} from "../../api/quize/exam.api.js";

export const useGetExamsHook = (params = {}) => {
  return useQuery({
    queryFn: () => getExamsApi(params),
    queryKey: ["getExams", params],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetExamByIdHook = (id) => {
  return useQuery({
    queryFn: () => getExamByIdApi(id),
    queryKey: ["getExamById", id],
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateExamHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExamApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Exam created successfully");
      queryClient.invalidateQueries(["getExams"]);
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || "Failed to create exam";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateExamHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExamApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Exam updated successfully");
      queryClient.invalidateQueries(["getExams"]);
      queryClient.invalidateQueries(["getExamById"]);
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || "Failed to update exam";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteExamHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExamApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Exam deleted successfully");
      queryClient.invalidateQueries(["getExams"]);
      queryClient.invalidateQueries(["getQuizzes"]);
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || "Failed to delete exam";
      toast.error(errorMessage);
    },
  });
};

export const useToggleExamLockHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleExamLockApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Exam lock status updated");
      queryClient.invalidateQueries(["getExams"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update exam status");
    },
  });
};
