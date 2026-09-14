import axios from "axios";

const baseUrl = import.meta.env.VITE_BASE_URL;

/**
 * Fetch like count, user's like state, and comments for a video
 */
export const getVideoInteractionsApi = async (videoId) => {
  const res = await axios.get(`${baseUrl}/video-interaction/${videoId}`, {
    withCredentials: true,
  });
  return res.data;
};

/**
 * Toggle like/unlike on a video
 */
export const toggleVideoLikeApi = async ({ videoId, courseId }) => {
  const res = await axios.post(
    `${baseUrl}/video-interaction/${videoId}/like`,
    { courseId },
    { withCredentials: true }
  );
  return res.data;
};

/**
 * Add a new comment on a video
 */
export const addVideoCommentApi = async ({ videoId, courseId, comment }) => {
  const res = await axios.post(
    `${baseUrl}/video-interaction/${videoId}/comment`,
    { courseId, comment },
    { withCredentials: true }
  );
  return res.data;
};

/**
 * Delete a comment
 */
export const deleteVideoCommentApi = async (commentId) => {
  const res = await axios.delete(`${baseUrl}/video-interaction/comment/${commentId}`, {
    withCredentials: true,
  });
  return res.data;
};
