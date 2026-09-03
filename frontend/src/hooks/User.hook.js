import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  registerApi,
  loginApi,
  getUserApi,
  logOutApi,
  verifyOtpApi,
  googleLoginApi,
} from "../api/user.api";
import { toast } from "sonner";
import { useUserStore } from "../store/user.store";

export const userRegisterHook = () => {
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};

export const userLoginHook = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success(data.message);
      if (data?.user) {
        setUser(data.user);
        queryClient.setQueryData(["get-user"], data);
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};

export const userLogoutHook = () => {
  return useMutation({
    mutationFn: logOutApi,
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};

export const GetUserHook = () => {
  return useQuery({
    queryKey: ["get-user"],
    queryFn: getUserApi,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const userVerifyOtpHook = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  return useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
      toast.success(data.message);
      if (data?.user) {
        setUser(data.user);
        queryClient.setQueryData(["get-user"], data);
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message
      toast.error(message);
    },
  });
};

export const userGoogleLoginHook = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  return useMutation({
    mutationFn: googleLoginApi,
    onSuccess: (data) => {
      toast.success(data.message);
      if (data?.user) {
        setUser(data.user);
        queryClient.setQueryData(["get-user"], data);
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Something went wrong! Please check your connection.";
      toast.error(message);
    },
  });
};
