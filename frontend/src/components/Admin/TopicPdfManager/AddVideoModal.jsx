import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  UploadCloud,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { initiateBunnyVideoUploadApi } from "@/api/course.api";

// Helper function to format bytes into readable units
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const AddVideoModal = ({
  activeChapter,
  courseId,
  onClose,
  addVideoToChapter,
  isAddingVideo,
  onVideoAdded,
}) => {
  const [videoAddMode, setVideoAddMode] = useState("file"); // 'file' | 'link'
  const [videoTitle, setVideoTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [uploadPhase, setUploadPhase] = useState("idle"); // 'idle' | 'direct' | 'saving' | 'done'
  const [directProgress, setDirectProgress] = useState(0);
  const [directLoaded, setDirectLoaded] = useState(0);
  const [directTotal, setDirectTotal] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");

  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (e) {
      console.warn("Screen Wake Lock not supported or rejected:", e);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (_) {}
      wakeLockRef.current = null;
    }
  };

  const resetForm = () => {
    releaseWakeLock();
    setVideoTitle("");
    setVideoFile(null);
    setVideoUrl("");
    setVideoAddMode("file");
    setUploadPhase("idle");
    setDirectProgress(0);
    setDirectLoaded(0);
    setDirectTotal(0);
    setUploadSpeed("");
  };

  useEffect(() => {
    if (!activeChapter) {
      resetForm();
    }
  }, [activeChapter]);

  const handleModalClose = () => {
    if (uploadPhase === "direct" || uploadPhase === "saving") {
      toast.warning("Video upload in progress. Please wait until it completes.");
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      toast.error("Please enter a video title");
      return;
    }
    if (!activeChapter) return;

    // Direct Video Link Mode
    if (videoAddMode === "link") {
      if (!videoUrl.trim()) {
        toast.error("Please enter a valid video URL");
        return;
      }

      addVideoToChapter(
        {
          courseId,
          subjectId: activeChapter.subjectId,
          chapterId: activeChapter.chapterId,
          data: {
            title: videoTitle.trim(),
            videoUrl: videoUrl.trim(),
            videoId: videoUrl.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.success("Video linked to chapter successfully! ⚡ Zero upload wait.");
            resetForm();
            onVideoAdded(activeChapter.chapterId);
            onClose();
          },
          onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to link video");
          },
        }
      );
      return;
    }

    // Bunny Stream Direct Upload Mode
    if (!videoFile) {
      toast.error("Please choose a video file to upload");
      return;
    }

    const currentChapter = { ...activeChapter };
    const currentTitle = videoTitle.trim();
    const currentFile = videoFile;
    const fileSize = currentFile.size || 0;

    setUploadPhase("direct");
    setDirectProgress(0);
    setDirectLoaded(0);
    setDirectTotal(fileSize);
    setUploadSpeed("");
    requestWakeLock();

    try {
      // Step 1: Initialize Video Entry on Bunny Stream
      const bunnyInit = await initiateBunnyVideoUploadApi({
        title: currentTitle,
      });

      if (!bunnyInit?.data?.uploadUrl || !bunnyInit?.data?.videoId) {
        throw new Error(bunnyInit?.message || "Failed to initialize video upload with Bunny");
      }

      const { uploadUrl, videoId: bunnyVideoId, apiKey, hlsUrl } = bunnyInit.data;

      // Step 2: Upload directly to Bunny Stream with real-time progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("AccessKey", apiKey);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        let lastTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000;
            if (timeDiff >= 0.5) {
              const bytesDiff = e.loaded - lastLoaded;
              const speedBps = bytesDiff / timeDiff;
              setUploadSpeed(`${formatFileSize(speedBps)}/s`);
              lastTime = now;
              lastLoaded = e.loaded;
            }

            const pct = Math.round((e.loaded / e.total) * 100);
            setDirectProgress(pct);
            setDirectLoaded(e.loaded);
            setDirectTotal(e.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during video upload"));
        xhr.onabort = () => reject(new Error("Upload aborted"));

        xhr.send(currentFile);
      });

      // Step 3: Register Video in Course Database with Bunny Stream HLS Playlist
      setUploadPhase("saving");
      addVideoToChapter(
        {
          courseId,
          subjectId: currentChapter.subjectId,
          chapterId: currentChapter.chapterId,
          data: {
            title: currentTitle,
            videoUrl: hlsUrl,
            videoId: bunnyVideoId,
            bunnyGuid: bunnyVideoId,
            isBunny: true,
          },
        },
        {
          onSuccess: () => {
            releaseWakeLock();
            setUploadPhase("done");
            setDirectProgress(100);
            toast.success("Video uploaded to Bunny Stream! Automatic multi-quality transcoding started.");
            setTimeout(() => {
              resetForm();
              onVideoAdded(currentChapter.chapterId);
              onClose();
            }, 1000);
          },
          onError: (err) => {
            releaseWakeLock();
            setUploadPhase("idle");
            toast.error(err?.response?.data?.message || "Failed to register video in chapter");
          },
        }
      );
    } catch (uploadErr) {
      console.error("[Bunny Stream Direct Upload Failed]:", uploadErr);
      releaseWakeLock();
      setUploadPhase("idle");
      const errorMsg =
        uploadErr?.response?.data?.message ||
        uploadErr?.message ||
        "Upload failed. Please check your internet connection and retry.";
      toast.error(errorMsg, { duration: 7000 });
    }
  };

  return (
    <Dialog open={Boolean(activeChapter)} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" /> Add Video Lecture
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Adding video to chapter:{" "}
            <strong className="text-slate-800">{activeChapter?.chapterName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mt-1 gap-1">
          <button
            type="button"
            disabled={uploadPhase === "direct" || uploadPhase === "saving"}
            onClick={() => setVideoAddMode("file")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              videoAddMode === "file"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Upload Video ⚡
          </button>
          <button
            type="button"
            disabled={uploadPhase === "direct" || uploadPhase === "saving"}
            onClick={() => setVideoAddMode("link")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              videoAddMode === "link"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Paste Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Video Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lecture 1: Core Concepts & Practice"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              required
              disabled={uploadPhase === "direct" || uploadPhase === "saving"}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {videoAddMode === "file" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select Video File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="video/*,video/mp4,video/quicktime,video/x-m4v,video/webm,.mp4,.mov,.m4v,.mkv"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required={videoAddMode === "file"}
                disabled={uploadPhase === "direct" || uploadPhase === "saving"}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:bg-slate-100"
              />
              {videoFile && (
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  File Size: {formatFileSize(videoFile.size)} • Type: {videoFile.type || "Video"}
                </p>
              )}
              <p className="text-[11px] text-blue-600 mt-1.5 font-medium">
                ⚡ <strong>Bunny Stream:</strong> Direct upload without local conversion! Bunny automatically generates adaptive resolutions.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Video URL / Direct Link <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://... (paste existing video link or .m3u8)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required={videoAddMode === "link"}
                  disabled={isAddingVideo}
                  className="w-full p-2.5 pr-20 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setVideoUrl(text.trim());
                        toast.success("Pasted video link from clipboard!");
                      }
                    } catch {
                      toast.error("Could not read clipboard. Please paste manually (Ctrl+V)");
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer transition"
                >
                  Paste
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress Status Indicator */}
          {uploadPhase !== "idle" && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    {directProgress >= 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    )}
                    {uploadPhase === "saving"
                      ? "Finalizing in Course..."
                      : directProgress >= 100
                      ? "Upload Complete!"
                      : "⚡ Direct Fast Upload"}
                  </span>
                  <div className="flex items-center gap-2">
                    {uploadSpeed && directProgress < 100 && (
                      <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {uploadSpeed}
                      </span>
                    )}
                    <span className="text-slate-600 font-semibold">
                      {formatFileSize(directLoaded)} / {formatFileSize(directTotal)} ({directProgress}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                    style={{ width: `${directProgress}%` }}
                  />
                </div>
              </div>

              {uploadPhase === "saving" && (
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Finalizing lecture in course...
                </p>
              )}

              {uploadPhase === "done" && (
                <p className="text-xs font-bold text-emerald-700 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Video uploaded and saved successfully!
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={uploadPhase === "direct" || uploadPhase === "saving" || isAddingVideo}
              onClick={handleModalClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {videoAddMode === "link" ? (
              <button
                type="submit"
                disabled={isAddingVideo || !videoUrl.trim() || !videoTitle.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {isAddingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Attaching Video...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Link Video Instantly
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  uploadPhase === "direct" ||
                  uploadPhase === "saving" ||
                  !videoFile ||
                  !videoTitle.trim()
                }
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {uploadPhase === "direct" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Cloud...
                  </>
                ) : uploadPhase === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Upload to Bunny Stream ⚡
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
