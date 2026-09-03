
import { createHeroSectionApi, getHeroSectionApi, deleteHeroSectionApi } from "../api/hero.api.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateHeroSectionHook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createHeroSectionApi,
    onSuccess: (data) => {
      toast.success(data.message || "Saved successfully!");
      queryClient.invalidateQueries(["getHeroSections"]);
    },

    onError: (err) => {
      const message = err.response?.data?.message || "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};

export const useGetHeroSectionHook = () => {
  return useQuery({
    queryFn: getHeroSectionApi,
    queryKey: ["getHeroSections"],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteHeroSectionHook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteHeroSectionApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(["getHeroSections"]);
    },

    onError: (err) => {
      const message = err.response?.data?.message;
      toast.error(message);
    },
  });
};
