import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createQuizApi,
  getQuizzesApi,
  deleteQuizApi,
  getQuizByIdApi,
  toggleQuizLockApi,
  toggleQuizTypeApi,
  updateQuizApi,
} from "../../api/quize/quiz.api.js";

export const useCreateQuizHook = () => {
  return useMutation({
    mutationFn: createQuizApi,

    onSuccess: (data) => {
      toast.success(data?.message);
    },

    onError: (err) => {
      const errorMessage = err.response?.data?.message;
      toast.error(errorMessage);
      console.log("Error creating quiz:", err);
    },
  });
};

export const useGetQuizzesHook = (quizType) => {
  return useQuery({
    queryFn: () => getQuizzesApi(quizType),
    queryKey: ["getQuizzes", quizType], // Include quizType in queryKey for proper caching
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteQuizHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuizApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Quiz deleted successfully");
      // This immediately refreshes the table so the deleted quiz disappears!
      queryClient.invalidateQueries(["getQuizzes"]);
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to delete quiz";
      toast.error(errorMessage);
    },
  });
};

export const useGetQuizByIdHook = (id) => {
  return useQuery({
    queryFn: () => getQuizByIdApi(id),
    queryKey: ["getQuizById", id],
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

// Upar se toggleQuizLockApi import karna mat bhoolna!

export const useToggleQuizLockHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleQuizLockApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Quiz status updated");
      queryClient.invalidateQueries(["getQuizzes"]); // Table refresh karega
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });
};

export const useToggleQuizTypeHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleQuizTypeApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Quiz type changed successfully");
      queryClient.invalidateQueries(["getQuizzes"]); // Table refresh karega
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to change quiz type");
    },
  });
};

export const useUpdateQuizHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuizApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Quiz updated successfully");
      queryClient.invalidateQueries(["getQuizzes"]); // Table refresh karega
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update quiz");
    },
  });
};
