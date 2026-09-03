import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  submitQuizApi,
  getMyQuizResultsApi,
  getAllQuizResultsApi,
} from "../../api/quize/quizResult.api.js";
import { useNavigate } from "react-router-dom";

export const useSubmitQuizHook = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: submitQuizApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Quiz submitted successfully");
      navigate(`/quiz-result/${data.result.quiz}`);
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || "Failed to submit quiz";
      toast.error(errorMessage);
    },
  });
};

export const useGetMyQuizResultsHook = (quizId) => {
  return useQuery({
    queryFn: () => getMyQuizResultsApi(quizId),
    queryKey: ["getMyQuizResults", quizId],
  });
};

export const useGetAllQuizResultsHook = (quizId) => {
  return useQuery({
    queryFn: () => getAllQuizResultsApi(quizId),
    queryKey: ["getAllQuizResults", quizId],
    enabled: !!quizId,
  });
};
