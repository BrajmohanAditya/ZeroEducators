import { createModuleApi } from "../api/module.api";
import { useMutation,useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateModuleHook = () => {
  return useMutation({
    mutationFn: createModuleApi,
    onSuccess: (data) => {
      toast.success(data.message);
    },

    onError: (err) => {
      const message = err.response?.data?.message || "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};

export const useGetModuleHook = (id)=>{
    return useQuery({
        queryFn:()=>getModuleApi(id),
        queryKey:['getModule',id]
    })
}

