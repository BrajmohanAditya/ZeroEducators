import {
  createCourseApi,
  getAllPurchasedCourseApi,
  getCourseApi,
  getSinglePurchaseCourseApi,
  getSingleCourseApi,
  deleteCourseApi,
  editCourseApi,
  addTopicApi,
  deleteTopicApi,
  addPdfToTopicApi,
  deletePdfFromTopicApi,
  addVideoToTopicApi,
  deleteVideoFromTopicApi,
  addSubjectApi,
  deleteSubjectApi,
  addChapterApi,
  deleteChapterApi,
  addPdfToChapterApi,
  deletePdfFromChapterApi,
  addVideoToChapterApi,
  deleteVideoFromChapterApi,
  searchUsersForEnrollmentApi,
  grantCourseAccessApi,
  revokeCourseAccessApi,
  getCourseEnrolledStudentsApi,
  copyCourseApi,
} from "../api/course.api.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export const useCreateCourseHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourseApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getCourse"]);
    },

    onError: (err) => {
      console.log(err);
    },
  });
};

export const useGetCourseHook = (search) => {
  return useQuery({
    queryFn: () => getCourseApi(search),
    queryKey: ["getCourse", search],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetSingleCourseHook = (id) => {
  return useQuery({
    queryFn: () => getSingleCourseApi(id),
    queryKey: ["getSingleCourse", id],
  });
};

export const useGetSinglePurchasedCourseHook = (courseId) => {
  return useQuery({
    queryFn: () => getSinglePurchaseCourseApi(courseId),
    queryKey: ["getSinglePurchaseCourse", courseId],
  });
};

export const useGetAllPurchasedCourseHook = () => {
  return useQuery({
    queryFn: getAllPurchasedCourseApi,
    queryKey: ["getAllPurchasedCourseApi"],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteCourseHook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourseApi,
    onSuccess: (data) => {
      // This is the magic line! It tells React Query to instantly refresh the course list on your screen
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message);
    },
    onError: (err) => {
      console.log(err);
    },
  });
};

export const useEditCourseHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editCourseApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update course");
    },
  });
};

export const useAddTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      toast.success(data?.message || "Topic added successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add topic");
    },
  });
};

export const useDeleteTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      toast.success(data?.message || "Topic deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete topic");
    },
  });
};

export const useAddPdfToTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPdfToTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      toast.success(data?.message || "PDF uploaded successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to upload PDF");
    },
  });
};

export const useDeletePdfFromTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePdfFromTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      toast.success(data?.message || "PDF deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete PDF");
    },
  });
};

export const useAddVideoToTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVideoToTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Video added to topic successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add video to topic");
    },
  });
};

export const useDeleteVideoFromTopicHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideoFromTopicApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Video deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete video");
    },
  });
};

// ==========================================
// SUBJECT & CHAPTER HOOKS
// ==========================================

export const useAddSubjectHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSubjectApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Subject added successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add subject");
    },
  });
};

export const useDeleteSubjectHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubjectApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Subject deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete subject");
    },
  });
};

export const useAddChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Chapter added successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add chapter");
    },
  });
};

export const useDeleteChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Chapter deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete chapter");
    },
  });
};

export const useAddPdfToChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPdfToChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "PDF uploaded to chapter successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to upload PDF");
    },
  });
};

export const useDeletePdfFromChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePdfFromChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "PDF deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete PDF");
    },
  });
};

export const useAddVideoToChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVideoToChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Video added to chapter successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add video to chapter");
    },
  });
};

export const useDeleteVideoFromChapterHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideoFromChapterApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Video deleted successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete video");
    },
  });
};

// ==========================================
// ADMIN COURSE GRANT & ENROLLMENT HOOKS
// ==========================================

export const useSearchUsersHook = (query, courseId) => {
  return useQuery({
    queryKey: ["searchUsersForEnrollment", query, courseId],
    queryFn: () => searchUsersForEnrollmentApi({ query, courseId }),
    enabled: Boolean(query && query.trim().length >= 2),
    staleTime: 30 * 1000,
  });
};

export const useGetCourseEnrolledStudentsHook = (courseId) => {
  return useQuery({
    queryKey: ["getCourseEnrolledStudents", courseId],
    queryFn: () => getCourseEnrolledStudentsApi(courseId),
    enabled: Boolean(courseId),
    staleTime: 30 * 1000,
  });
};

export const useGrantCourseAccessHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: grantCourseAccessApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getCourseEnrolledStudents", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      queryClient.invalidateQueries(["searchUsersForEnrollment"]);
      toast.success(data?.message || "Course granted successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to grant course");
    },
  });
};

export const useRevokeCourseAccessHook = (courseId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeCourseAccessApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getCourseEnrolledStudents", courseId]);
      queryClient.invalidateQueries(["getCourse"]);
      queryClient.invalidateQueries(["searchUsersForEnrollment"]);
      toast.success(data?.message || "Access revoked successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to revoke course access");
    },
  });
};

export const useCopyCourseHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: copyCourseApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["getCourse"]);
      toast.success(data?.message || "Course copied successfully!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to copy course");
    },
  });
};




