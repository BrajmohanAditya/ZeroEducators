import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createQuizQuestionApi,
  getQuizQuestionsApi,
  updateQuizQuestionApi,
  deleteQuizQuestionApi,
} from "../../api/quize/quiz.createQuest.api.js";

export const useCreateQuizQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuizQuestionApi,
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Question created successfully");
      queryClient.invalidateQueries({ queryKey: ["quizQuestions", variables.quizId] });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to create question";
      toast.error(errorMessage);
      console.log("Error creating quiz question:", err);
    },
  });
};

export const useGetQuizQuestionsHook = (quizId) => {
  return useQuery({
    queryKey: ["quizQuestions", quizId],
    queryFn: () => getQuizQuestionsApi(quizId),
    enabled: !!quizId, // Only fetch if quizId is provided
    onError: (err) => {
      console.log("Error fetching quiz questions:", err);
    },
  });
};

export const useUpdateQuizQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuizQuestionApi,
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Question updated successfully");
      // Variables has { id, payload } - we can't directly read quizId from variables if not passed,
      // but invalidating all keys starting with quizQuestions is safe.
      queryClient.invalidateQueries({ queryKey: ["quizQuestions"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update question");
      console.log("Error updating quiz question:", err);
    },
  });
};

export const useDeleteQuizQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuizQuestionApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["quizQuestions"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete question");
      console.log("Error deleting quiz question:", err);
    },
  });
};
