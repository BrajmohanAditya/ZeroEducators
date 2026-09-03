import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEbookQuestionApi,
  getEbookQuestionsApi,
  deleteEbookQuestionApi,
  updateEbookQuestionApi,
} from "../../api/eBook.jsx/ebookQuestion.api";
import { toast } from "sonner";

export const useCreateEbookQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbookQuestionApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Question added successfully");
      queryClient.invalidateQueries({ queryKey: ["get-ebook-questions"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to add question");
    },
  });
};

export const useGetEbookQuestionsHook = ({ ebookId, chapterNumber }) => {
  return useQuery({
    queryKey: ["get-ebook-questions", ebookId, chapterNumber],
    queryFn: () => getEbookQuestionsApi({ ebookId, chapterNumber }),
    enabled: !!ebookId,
  });
};

export const useDeleteEbookQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbookQuestionApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["get-ebook-questions"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to delete question",
      );
    },
  });
};

export const useUpdateEbookQuestionHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEbookQuestionApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["get-ebook-questions"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update question",
      );
    },
  });
};
