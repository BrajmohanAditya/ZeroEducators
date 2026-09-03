import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEbookApi,
  getEbooksApi,
  getSingleEbookApi,
  deleteEbookApi,
  editEbookApi,
} from "../../api/eBook.jsx/ebook.api.js";
import { toast } from "sonner";

export const useCreateEbookHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbookApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["getEbooks"] });
      toast.success(data.message || "eBook created successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create eBook");
    },
  });
};

export const useGetEbooksHook = () => {
  return useQuery({
    queryKey: ["getEbooks"],
    queryFn: getEbooksApi,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetSingleEbookHook = (id) => {
  return useQuery({
    queryKey: ["getSingleEbook", id],
    queryFn: () => getSingleEbookApi(id),
    enabled: !!id,
  });
};

export const useDeleteEbookHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbookApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["getEbooks"] });
      toast.success(data.message || "eBook deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete eBook");
    },
  });
};

export const useEditEbookHook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editEbookApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["getEbooks"] });
      toast.success(data.message || "eBook updated successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update eBook");
    },
  });
};
