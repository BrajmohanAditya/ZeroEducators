import { useQuery } from "@tanstack/react-query";
import { getAdminAnalyticsApi } from "../api/analytics.api";

export const useGetAdminAnalyticsHook = () => {
  return useQuery({
    queryKey: ["adminAnalyticsOverview"],
    queryFn: getAdminAnalyticsApi,
    staleTime: 3 * 60 * 1000, // 3 minutes stale cache
    refetchOnWindowFocus: false, // Prevents lag when switching browser tabs
  });
};
