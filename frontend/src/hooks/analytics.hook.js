import { useQuery } from "@tanstack/react-query";
import { getAdminAnalyticsApi } from "../api/analytics.api";

export const useGetAdminAnalyticsHook = () => {
  return useQuery({
    queryKey: ["adminAnalyticsOverview"],
    queryFn: getAdminAnalyticsApi,
    staleTime: 60 * 1000, // 1 minute stale time
    refetchOnWindowFocus: true,
  });
};
