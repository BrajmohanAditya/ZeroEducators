import {
  createCourseApi,
  getAllPurchasedCourseApi,
  getCourseApi,
  getSinglePurchaseCourseApi,
  getSingleCourseApi,
  deleteCourseApi,
  editCourseApi,
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
