import React from "react";
import { Film, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SecureVideoPlayer from "@/components/common/SecureVideoPlayer";

export const VideoPreviewModal = ({
  previewVideo,
  baseUrl,
  onClose,
  onDownload,
  downloadingVideoId,
}) => {
  if (!previewVideo) return null;

  return (
    <Dialog
      open={Boolean(previewVideo)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-slate-800">
        <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0 gap-3">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Film className="w-4 h-4 text-emerald-400 shrink-0" />
            <DialogTitle className="font-bold text-sm truncate text-white">
              {previewVideo?.title || "Video Preview"}
            </DialogTitle>
          </div>
          {previewVideo && onDownload && (
            <button
              type="button"
              onClick={() => onDownload(previewVideo)}
              disabled={downloadingVideoId === (previewVideo._id || previewVideo.moduleId || "direct")}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm disabled:opacity-50"
              title="Download this lecture video as MP4"
            >
              {downloadingVideoId === (previewVideo._id || previewVideo.moduleId || "direct") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download Video
            </button>
          )}
          <DialogDescription className="sr-only">
            Lecture video preview player
          </DialogDescription>
        </DialogHeader>

        <div className="w-full aspect-video bg-black flex items-center justify-center">
          <SecureVideoPlayer
            src={
              previewVideo.Video ||
              (previewVideo.moduleId || previewVideo._id
                ? `${baseUrl}/module/stream/${previewVideo.moduleId || previewVideo._id}`
                : "")
            }
            videoKey={previewVideo._id || previewVideo.moduleId}
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
