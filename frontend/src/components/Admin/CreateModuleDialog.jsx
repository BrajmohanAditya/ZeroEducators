import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Loader2, Video, CheckCircle2 } from "lucide-react";
import { useCreateModuleHook } from "@/hooks/module.hook";
import { useQueryClient } from "@tanstack/react-query";
import { getModuleUploadProgressApi } from "@/api/module.api";
import { toast } from "sonner";

const CreateModuleDialog = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm();
  const { mutate, isPending } = useCreateModuleHook();

  const [openModule, setOpenModule] = useState(false);

  // Upload stages & live progress states
  const [uploadPhase, setUploadPhase] = useState("idle"); // 'idle' | 'local' | 'cloud' | 'done'
  const [localProgress, setLocalProgress] = useState(0);
  const [localLoaded, setLocalLoaded] = useState(0);
  const [localTotal, setLocalTotal] = useState(0);

  const [cloudProgress, setCloudProgress] = useState(0);
  const [cloudLoaded, setCloudLoaded] = useState(0);
  const [cloudTotal, setCloudTotal] = useState(0);

  const pollIntervalRef = useRef(null);

  const selectedVideo = watch("video");
  const videoFile = selectedVideo && selectedVideo[0] ? selectedVideo[0] : null;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const cleanupPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupPolling();
  }, []);

  const moduleFormHandler = (data) => {
    const uploadId = "up_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("video", data.video[0]);
    formData.append("courseId", id);
    formData.append("uploadId", uploadId);

    const fileSize = data.video[0]?.size || 0;
    setUploadPhase("local");
    setLocalProgress(0);
    setLocalLoaded(0);
    setLocalTotal(fileSize);
    setCloudProgress(0);
    setCloudLoaded(0);
    setCloudTotal(fileSize);

    cleanupPolling();

    // Start polling S3 progress from backend
    const startCloudPolling = () => {
      setUploadPhase("cloud");
      if (pollIntervalRef.current) return;

      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await getModuleUploadProgressApi(uploadId);
          if (res) {
            if (res.loaded) setCloudLoaded(res.loaded);
            if (res.total) setCloudTotal(res.total);
            if (typeof res.percent === "number") {
              setCloudProgress(res.percent);
            }

            if (res.status === "completed") {
              cleanupPolling();
              setUploadPhase("done");
              setCloudProgress(100);
              queryClient.invalidateQueries({ queryKey: ["getSingleCourse", id] });
              queryClient.invalidateQueries({ queryKey: ["getCourseById", id] });
              queryClient.invalidateQueries({ queryKey: ["getModule", id] });
              toast.success("Module created successfully!");
              setTimeout(() => {
                setOpenModule(false);
                reset();
                setUploadPhase("idle");
              }, 1200);
            }
          }
        } catch (err) {
          console.error("Error polling S3 progress:", err);
        }
      }, 1000);
    };

    mutate(
      {
        formData,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setLocalProgress(percentCompleted);
            setLocalLoaded(progressEvent.loaded);
            setLocalTotal(progressEvent.total);

            // Once browser finished uploading to server, start polling cloud progress
            if (percentCompleted >= 100) {
              startCloudPolling();
            }
          }
        },
      },
      {
        onSuccess: () => {
          cleanupPolling();
          queryClient.invalidateQueries({ queryKey: ["getSingleCourse", id] });
          queryClient.invalidateQueries({ queryKey: ["getCourseById", id] });
          queryClient.invalidateQueries({ queryKey: ["getModule", id] });
          setUploadPhase("done");
          setCloudProgress(100);
          setTimeout(() => {
            setOpenModule(false);
            reset();
            setUploadPhase("idle");
          }, 800);
        },
        onError: () => {
          cleanupPolling();
          setUploadPhase("idle");
        },
      }
    );
  };

  const handleOpenChange = (open) => {
    setOpenModule(open);
    if (!open) {
      cleanupPolling();
      reset();
      setUploadPhase("idle");
      setLocalProgress(0);
      setCloudProgress(0);
    }
  };

  const isUploading = isPending || uploadPhase !== "idle";

  return (
    <div>
      {/* Create Module Button */}
      <Dialog open={openModule} onOpenChange={handleOpenChange}>
        <DialogTrigger className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Module
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              New Module
            </DialogTitle>

            <form
              onSubmit={handleSubmit(moduleFormHandler)}
              className="space-y-5 mt-4 text-left"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lecture 1: Introduction"
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all text-sm disabled:bg-slate-100"
                  {...register("title", { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Video File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  disabled={isUploading}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer text-sm disabled:opacity-50"
                  {...register("video", { required: true })}
                />

                {videoFile && (
                  <div className="mt-2 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">
                        {videoFile.name}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 shrink-0">
                      {formatFileSize(videoFile.size)}
                    </span>
                  </div>
                )}
              </div>

              {/* Computer to server upload progress (only shows while transferring from computer) */}
              {isUploading && localProgress < 100 && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      Uploading from Computer...
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {localProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-200"
                      style={{ width: `${localProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {formatFileSize(localLoaded)} / {formatFileSize(localTotal)}
                    </span>
                    <span className="text-emerald-700 font-medium">Transferring...</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {uploadPhase === "cloud"
                        ? `Saving to Cloud... ${cloudProgress}%`
                        : localProgress < 100
                        ? `Uploading... ${localProgress}%`
                        : `Saving to Cloud... ${cloudProgress}%`}
                    </span>
                  </>
                ) : (
                  "Create Module"
                )}
              </button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateModuleDialog;
