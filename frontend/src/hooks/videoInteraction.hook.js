import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVideoInteractionsApi,
  toggleVideoLikeApi,
  addVideoCommentApi,
  deleteVideoCommentApi,
  rateVideoApi,
} from "../api/videoInteraction.api.js";
import { toast } from "sonner";

/**
 * Fetch video likes and comments
 */
export const useGetVideoInteractionsHook = (videoId) => {
  return useQuery({
    queryKey: ["videoInteractions", videoId],
    queryFn: () => getVideoInteractionsApi(videoId),
    enabled: Boolean(videoId),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to toggle like on a video
 */
export const useToggleVideoLikeHook = (videoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleVideoLikeApi,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["videoInteractions", videoId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["videoInteractions", videoId]);

      // Optimistically update like state
      if (previousData) {
        queryClient.setQueryData(["videoInteractions", videoId], (old) => {
          if (!old) return old;
          const willBeLiked = !old.isLiked;
          return {
            ...old,
            isLiked: willBeLiked,
            likeCount: willBeLiked ? old.likeCount + 1 : Math.max(0, old.likeCount - 1),
          };
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert if error
      if (context?.previousData) {
        queryClient.setQueryData(["videoInteractions", videoId], context.previousData);
      }
      toast.error(err.response?.data?.message || "Failed to update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["videoInteractions", videoId] });
    },
  });
};

/**
 * Hook to add a comment
 */
export const useAddVideoCommentHook = (videoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addVideoCommentApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Comment posted successfully");
      queryClient.invalidateQueries({ queryKey: ["videoInteractions", videoId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to post comment");
    },
  });
};

/**
 * Hook to delete a comment
 */
export const useDeleteVideoCommentHook = (videoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVideoCommentApi,
    onSuccess: (data) => {
      toast.success(data?.message || "Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["videoInteractions", videoId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    },
  });
};

/**
 * Hook to submit or update video rating
 */
export const useRateVideoHook = (videoId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rateVideoApi,
    onMutate: async (newRatingPayload) => {
      await queryClient.cancelQueries({ queryKey: ["videoInteractions", videoId] });
      const previousData = queryClient.getQueryData(["videoInteractions", videoId]);

      if (previousData) {
        const prevTotal = previousData.totalRatings || 0;
        const prevAvg = previousData.averageRating || 0;
        const hadRated = previousData.userRating != null;
        const newRatingVal = newRatingPayload.rating;

        let updatedTotal = hadRated ? prevTotal : prevTotal + 1;
        let updatedSum = hadRated
          ? prevAvg * prevTotal - previousData.userRating + newRatingVal
          : prevAvg * prevTotal + newRatingVal;
        let updatedAvg = updatedTotal > 0 ? Number((updatedSum / updatedTotal).toFixed(1)) : newRatingVal;

        queryClient.setQueryData(["videoInteractions", videoId], (old) => {
          if (!old) return old;
          return {
            ...old,
            userRating: newRatingVal,
            averageRating: updatedAvg,
            totalRatings: updatedTotal,
          };
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["videoInteractions", videoId], context.previousData);
      }
      toast.error(err.response?.data?.message || "Failed to submit rating");
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Rating submitted successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["videoInteractions", videoId] });
    },
  });
};
