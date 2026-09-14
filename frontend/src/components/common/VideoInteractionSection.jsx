import React, { useState } from "react";
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  ShieldCheck,
  User,
  CornerDownRight,
} from "lucide-react";
import {
  useGetVideoInteractionsHook,
  useToggleVideoLikeHook,
  useAddVideoCommentHook,
  useDeleteVideoCommentHook,
} from "../../hooks/videoInteraction.hook.js";
import { toast } from "sonner";

// Helper for relative time formatting
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

const VideoInteractionSection = ({ video, courseId, currentUser }) => {
  const videoId = video?._id || video?.Video_id;
  const [commentText, setCommentText] = useState("");
  const [isDeletingId, setIsDeletingId] = useState(null);

  const { data, isLoading } = useGetVideoInteractionsHook(videoId);
  const { mutate: toggleLike, isPending: isLiking } = useToggleVideoLikeHook(videoId);
  const { mutate: addComment, isPending: isPosting } = useAddVideoCommentHook(videoId);
  const { mutate: deleteComment } = useDeleteVideoCommentHook(videoId);

  if (!videoId) return null;

  const likeCount = data?.likeCount ?? 0;
  const isLiked = data?.isLiked ?? false;
  const comments = data?.comments || [];
  const commentsCount = data?.commentsCount ?? comments.length;

  const handleLike = () => {
    if (!currentUser) {
      toast.error("Please log in to like this video");
      return;
    }
    toggleLike({ videoId, courseId });
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in to post a comment");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    addComment(
      { videoId, courseId, comment: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
        },
      }
    );
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeletingId(commentId);
      deleteComment(commentId, {
        onSettled: () => setIsDeletingId(null),
      });
    }
  };

  const userInitial = currentUser?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 lg:p-7 space-y-6">
      {/* ── Top Bar: Video Title & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Lecture Discussion
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {video?.title || "Course Video Lecture"}
          </h2>
        </div>

        {/* Like and Stats Row */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 ${
              isLiked
                ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
            }`}
            title={isLiked ? "Unlike video" : "Like video"}
          >
            <ThumbsUp
              className={`w-4 h-4 transition-transform duration-200 ${
                isLiked ? "fill-current scale-110" : ""
              }`}
            />
            <span>{isLiked ? "Liked" : "Like"}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-xs ${
                isLiked ? "bg-emerald-700/60 text-white" : "bg-white text-slate-700 shadow-2xs"
              }`}
            >
              {likeCount}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 text-xs sm:text-sm font-semibold">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>{commentsCount}</span>
            <span className="hidden sm:inline text-slate-400">Comments</span>
          </div>
        </div>
      </div>

      {/* ── Add Comment Section ── */}
      <div className="flex gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
          {userInitial}
        </div>

        <form onSubmit={handlePostComment} className="flex-1 space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                currentUser
                  ? "Ask a doubt, share key takeaways, or discuss this lecture..."
                  : "Please log in to join the discussion..."
              }
              disabled={!currentUser || isPosting}
              className="w-full p-3 sm:p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Be respectful and constructive in student discussions.
            </span>
            <button
              type="submit"
              disabled={!currentUser || isPosting || !commentText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Comments List ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Comments & Questions ({commentsCount})
          </h3>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {comments.map((c) => {
              const authorName = c.user?.name || "Student";
              const authorInitial = authorName.charAt(0).toUpperCase();
              const isAdmin = c.user?.role === "admin";
              const isOwner =
                currentUser && c.user && (c.user._id === currentUser._id || c.user === currentUser._id);
              const canDelete = isOwner || currentUser?.role === "admin";

              return (
                <div key={c._id} className="py-3.5 flex gap-3 group">
                  <div
                    className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                      isAdmin
                        ? "bg-slate-900 text-emerald-400 ring-2 ring-emerald-500/30"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {authorInitial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {authorName}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-slate-900 text-emerald-400 rounded-md border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Instructor
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {formatTimeAgo(c.createdAt)}
                        </span>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c._id)}
                          disabled={isDeletingId === c._id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete comment"
                        >
                          {isDeletingId === c._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                      {c.comment}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No comments yet on this lecture</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Have a doubt or feedback? Be the first to start the discussion!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInteractionSection;
