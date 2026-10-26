import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createExamApi,
  getExamsApi,
  getExamByIdApi,
  updateExamApi,
  deleteExamApi,
  toggleExamLockApi,
  getMyPurchasedExamsApi,
  searchUsersForExamEnrollmentApi,
  grantExamAccessApi,
  revokeExamAccessApi,
  getExamEnrolledStudentsApi,
  updateExamStudentExpiryApi,
  getExamLinkedCoursesApi,
  updateExamLinkedCoursesApi,
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
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
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
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
      queryClient.invalidateQueries({ queryKey: ["getExamById"] });
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
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
      queryClient.invalidateQueries({ queryKey: ["getQuizzes"] });
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
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update exam status");
    },
  });
};

export const useGetMyPurchasedExamsHook = () => {
  return useQuery({
    queryKey: ["getMyPurchasedExams"],
    queryFn: getMyPurchasedExamsApi,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
};

// Exam Grant & Enrollment Hooks
export const useSearchExamUsersHook = (query, examId) => {
  return useQuery({
    queryKey: ["searchExamUsers", query, examId],
    queryFn: () => searchUsersForExamEnrollmentApi(query, examId),
    enabled: Boolean(query && query.trim().length >= 1),
    staleTime: 30 * 1000,
  });
};

export const useGrantExamAccessHook = (examId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: grantExamAccessApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Access granted successfully!");
      queryClient.invalidateQueries({ queryKey: ["examEnrolledStudents", examId] });
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to grant access");
    },
  });
};

export const useRevokeExamAccessHook = (examId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeExamAccessApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Access revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["examEnrolledStudents", examId] });
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to revoke access");
    },
  });
};

export const useGetExamEnrolledStudentsHook = (examId) => {
  return useQuery({
    queryKey: ["examEnrolledStudents", examId],
    queryFn: () => getExamEnrolledStudentsApi(examId),
    enabled: Boolean(examId),
    staleTime: 60 * 1000,
  });
};

export const useUpdateExamStudentExpiryHook = (examId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExamStudentExpiryApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Student validity updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["examEnrolledStudents", examId] });
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update validity");
    },
  });
};

export const useGetExamLinkedCoursesHook = (examId) => {
  return useQuery({
    queryKey: ["examLinkedCourses", examId],
    queryFn: () => getExamLinkedCoursesApi(examId),
    enabled: Boolean(examId),
    staleTime: 30 * 1000,
  });
};

export const useUpdateExamLinkedCoursesHook = (examId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExamLinkedCoursesApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Linked courses updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["examLinkedCourses", examId] });
      queryClient.invalidateQueries({ queryKey: ["examEnrolledStudents", examId] });
      queryClient.invalidateQueries({ queryKey: ["getExams"] });
      queryClient.invalidateQueries({ queryKey: ["getMyPurchasedExams"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update linked courses");
    },
  });
};



