import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSingleCourseHook,
  useAddTopicHook,
  useDeleteTopicHook,
  useAddPdfToTopicHook,
  useDeletePdfFromTopicHook,
  useAddVideoToTopicHook,
  useDeleteVideoFromTopicHook,
} from "../../hooks/course.hook";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Video,
  PlayCircle,
  ExternalLink,
  Loader2,
  FolderPlus,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Film,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { getModuleUploadProgressApi } from "@/api/module.api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TopicPdfManager = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const { data, isLoading } = useGetSingleCourseHook(courseId);
  const course = data?.course;
  const isVideoCourse = course?.courseType !== "pdf";

  // Mutation hooks
  const { mutate: addTopic, isPending: isAddingTopic } = useAddTopicHook(courseId);
  const { mutate: deleteTopic, isPending: isDeletingTopic } = useDeleteTopicHook(courseId);
  const { mutate: addPdfToTopic, isPending: isAddingPdf } = useAddPdfToTopicHook(courseId);
  const { mutate: deletePdfFromTopic, isPending: isDeletingPdf } = useDeletePdfFromTopicHook(courseId);
  const { mutate: addVideoToTopic, isPending: isAddingVideo } = useAddVideoToTopicHook(courseId);
  const { mutate: deleteVideoFromTopic, isPending: isDeletingVideo } = useDeleteVideoFromTopicHook(courseId);

  // Custom Delete Alert Box State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicName, setTopicName] = useState("");

  // PDF Upload Modal State
  const [activeTopicForPdfUpload, setActiveTopicForPdfUpload] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // Video Upload Modal State
  const [activeTopicForVideoUpload, setActiveTopicForVideoUpload] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploadPhase, setUploadPhase] = useState("idle"); // 'idle' | 'local' | 'cloud' | 'done'
  const [localProgress, setLocalProgress] = useState(0);
  const [localLoaded, setLocalLoaded] = useState(0);
  const [localTotal, setLocalTotal] = useState(0);
  const [cloudProgress, setCloudProgress] = useState(0);
  const [cloudLoaded, setCloudLoaded] = useState(0);
  const [cloudTotal, setCloudTotal] = useState(0);
  const pollIntervalRef = useRef(null);

  // Video Preview Dialog State
  const [previewVideo, setPreviewVideo] = useState(null);

  // Accordion toggle state: topicId -> boolean
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopicExpand = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId],
    }));
  };

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

  // Handle Add Topic
  const handleAddTopicSubmit = (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      toast.error("Please enter a chapter / topic name");
      return;
    }

    addTopic(
      { courseId, topicName: topicName.trim() },
      {
        onSuccess: () => {
          setTopicName("");
          setIsTopicModalOpen(false);
        },
      }
    );
  };

  // Handle Upload PDF to Topic
  const handleUploadPdfSubmit = (e) => {
    e.preventDefault();
    if (!pdfTitle.trim()) {
      toast.error("Please enter a title for the PDF");
      return;
    }
    if (!pdfFile) {
      toast.error("Please choose a PDF file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("title", pdfTitle.trim());
    formData.append("pdf", pdfFile);

    addPdfToTopic(
      { courseId, topicId: activeTopicForPdfUpload._id, formData },
      {
        onSuccess: () => {
          setPdfTitle("");
          setPdfFile(null);
          setActiveTopicForPdfUpload(null);
        },
      }
    );
  };

  // Handle Upload Video to Topic
  const handleUploadVideoSubmit = (e) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      toast.error("Please enter a video title");
      return;
    }
    if (!videoFile) {
      toast.error("Please choose a video file to upload");
      return;
    }

    const uploadId = "up_topic_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const formData = new FormData();
    formData.append("title", videoTitle.trim());
    formData.append("video", videoFile);
    formData.append("uploadId", uploadId);

    const fileSize = videoFile.size || 0;
    setUploadPhase("local");
    setLocalProgress(0);
    setLocalLoaded(0);
    setLocalTotal(fileSize);
    setCloudProgress(0);
    setCloudLoaded(0);
    setCloudTotal(fileSize);

    cleanupPolling();

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
              queryClient.invalidateQueries(["getSingleCourse", courseId]);
              queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
              queryClient.invalidateQueries(["getCourse"]);
              toast.success("Video uploaded to chapter successfully!");
              setTimeout(() => {
                setActiveTopicForVideoUpload(null);
                setVideoTitle("");
                setVideoFile(null);
                setUploadPhase("idle");
              }, 1200);
            }
          }
        } catch (err) {
          console.error("Error polling cloud progress:", err);
        }
      }, 1000);
    };

    addVideoToTopic(
      {
        courseId,
        topicId: activeTopicForVideoUpload._id,
        formData,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setLocalProgress(percentCompleted);
            setLocalLoaded(progressEvent.loaded);
            setLocalTotal(progressEvent.total);

            if (percentCompleted >= 100) {
              startCloudPolling();
            }
          }
        },
      },
      {
        onSuccess: () => {
          cleanupPolling();
          setUploadPhase("done");
          setCloudProgress(100);
          queryClient.invalidateQueries(["getSingleCourse", courseId]);
          queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
          queryClient.invalidateQueries(["getCourse"]);
          setTimeout(() => {
            setActiveTopicForVideoUpload(null);
            setVideoTitle("");
            setVideoFile(null);
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

  // Custom Delete Confirm Execution
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "topic") {
      deleteTopic(
        { courseId, topicId: deleteConfirm.id },
        {
          onSuccess: () => setDeleteConfirm(null),
        }
      );
    } else if (deleteConfirm.type === "video") {
      deleteVideoFromTopic(
        { courseId, topicId: deleteConfirm.topicId, videoId: deleteConfirm.id },
        {
          onSuccess: () => setDeleteConfirm(null),
        }
      );
    } else if (deleteConfirm.type === "pdf") {
      deletePdfFromTopic(
        { courseId, topicId: deleteConfirm.topicId, pdfId: deleteConfirm.id },
        {
          onSuccess: () => setDeleteConfirm(null),
        }
      );
    }
  };

  const isDeletingAny = isDeletingTopic || isDeletingVideo || isDeletingPdf;

  // Counts
  const totalVideos =
    course?.topics?.reduce(
      (acc, topic) => acc + (topic.videos?.length || 0),
      0
    ) || 0;

  const totalPdfs =
    course?.topics?.reduce(
      (acc, topic) => acc + (topic.pdfs?.length || 0),
      0
    ) || 0;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 pb-32">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => navigate("/admindashboard/dashboardProduct")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {course?.title}
              </h1>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  isVideoCourse
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {isVideoCourse ? "Video Course" : "PDF Course"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {course?.topics?.length || 0} Chapters / Topics • {totalVideos} Videos • {totalPdfs} PDF Documents
            </p>
          </div>

          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-2 text-sm shrink-0"
          >
            <FolderPlus className="w-4 h-4" /> Add Chapter / Topic
          </button>
        </div>
      </div>

      {/* Topics List Container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {course?.topics && course.topics.length > 0 ? (
          course.topics.map((topic, index) => {
            const isExpanded = expandedTopics[topic._id] !== false; // expanded by default
            const topicVideoCount = topic.videos?.length || 0;
            const topicPdfCount = topic.pdfs?.length || 0;

            return (
              <div
                key={topic._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Topic Header Strip */}
                <div className="p-5 flex items-center justify-between bg-slate-50/90 border-b border-slate-200">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                    onClick={() => toggleTopicExpand(topic._id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {topic.topicName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                          {topicVideoCount} {topicVideoCount === 1 ? "Video" : "Videos"}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          {topicPdfCount} {topicPdfCount === 1 ? "PDF" : "PDFs"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Add Video Button */}
                    <button
                      onClick={() => setActiveTopicForVideoUpload(topic)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                      title="Upload video to this chapter"
                    >
                      <Video className="w-3.5 h-3.5" /> Add Video
                    </button>

                    {/* Add PDF Button */}
                    <button
                      onClick={() => setActiveTopicForPdfUpload(topic)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition cursor-pointer"
                      title="Upload PDF notes to this chapter"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add PDF
                    </button>

                    {/* Delete Topic Button */}
                    <button
                      disabled={isDeletingAny}
                      onClick={() => {
                        setDeleteConfirm({
                          type: "topic",
                          id: topic._id,
                          title: topic.topicName,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Chapter / Topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleTopicExpand(topic._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Inside Topic */}
                {isExpanded && (
                  <div className="p-5 space-y-6">
                    {/* Videos Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-blue-600" />
                          Lectures & Videos ({topicVideoCount})
                        </span>
                        <button
                          onClick={() => setActiveTopicForVideoUpload(topic)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add another video
                        </button>
                      </div>

                      {topic.videos && topic.videos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {topic.videos.map((vid, vIdx) => (
                            <div
                              key={vid._id || vIdx}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all bg-white group shadow-2xs"
                            >
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Video className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden flex-1 pr-2">
                                  <p
                                    className="text-sm font-bold text-slate-900 truncate"
                                    title={vid.title}
                                  >
                                    {vid.title}
                                  </p>
                                  <span className="text-[11px] text-slate-400">
                                    Video {vIdx + 1} • {vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : "Uploaded"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setPreviewVideo(vid)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Play / Preview Video"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                </button>
                                <button
                                  disabled={isDeletingAny}
                                  onClick={() => {
                                    setDeleteConfirm({
                                      type: "video",
                                      id: vid._id,
                                      topicId: topic._id,
                                      title: vid.title,
                                    });
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                          <Video className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-500 font-medium">
                            No videos added to this chapter yet.
                          </p>
                          <button
                            onClick={() => setActiveTopicForVideoUpload(topic)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Upload first video
                          </button>
                        </div>
                      )}
                    </div>

                    {/* PDFs Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-600" />
                          Study Notes & PDFs ({topicPdfCount})
                        </span>
                        <button
                          onClick={() => setActiveTopicForPdfUpload(topic)}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add PDF
                        </button>
                      </div>

                      {topic.pdfs && topic.pdfs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {topic.pdfs.map((pdf, pIdx) => (
                            <div
                              key={pdf._id || pIdx}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all bg-white group shadow-2xs"
                            >
                              <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden flex-1 pr-2">
                                  <p
                                    className="text-sm font-bold text-slate-800 truncate"
                                    title={pdf.title}
                                  >
                                    {pdf.title}
                                  </p>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(pdf.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={pdf.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Open PDF"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  disabled={isDeletingAny}
                                  onClick={() => {
                                    setDeleteConfirm({
                                      type: "pdf",
                                      id: pdf._id,
                                      topicId: topic._id,
                                      title: pdf.title,
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete PDF"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/30">
                          <p className="text-xs text-slate-400">
                            Optional: Add PDF notes or worksheets for this chapter.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <FolderPlus className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Chapters / Topics Created Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Create chapters or topics first (e.g. "Chapter 1: Reasoning Basics"), then upload 2, 4 or more videos under each chapter!
            </p>
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-700 transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Chapter
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Topic / Chapter */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Add New Chapter / Topic
            </DialogTitle>

          </DialogHeader>

          <form onSubmit={handleAddTopicSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Chapter / Topic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 1: Number Systems & Arithmetic"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingTopic}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingTopic && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Chapter
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Upload Video to Topic */}
      <Dialog
        open={Boolean(activeTopicForVideoUpload)}
        onOpenChange={(open) => {
          if (uploadPhase === "local" || uploadPhase === "cloud") {
            toast.warning("Video upload in progress. Please wait until it completes.");
            return;
          }
          if (!open) {
            cleanupPolling();
            setActiveTopicForVideoUpload(null);
            setVideoTitle("");
            setVideoFile(null);
            setUploadPhase("idle");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" /> Upload Video Lecture
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Adding video to:{" "}
              <strong className="text-slate-800">{activeTopicForVideoUpload?.topicName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadVideoSubmit} className="space-y-4 mt-2 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Video Lecture Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Lecture 1: Concept, Formulas & Solved Examples"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                required
                disabled={uploadPhase !== "idle"}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select Video File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
                disabled={uploadPhase !== "idle"}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:bg-slate-100"
              />
              {videoFile && (
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  File Size: {formatFileSize(videoFile.size)} • Type: {videoFile.type || "Video"}
                </p>
              )}
            </div>

            {/* Upload Progress Status Indicator */}
            {uploadPhase !== "idle" && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
                {/* Phase 1: Browser to Server */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {localProgress >= 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      )}
                      1. Uploading to Server
                    </span>
                    <span>
                      {formatFileSize(localLoaded)} / {formatFileSize(localTotal)} ({localProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${localProgress}%` }}
                    />
                  </div>
                </div>

                {/* Phase 2: Server to S3 Cloud */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {cloudProgress >= 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : uploadPhase === "cloud" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                      2. Storing safely in Cloud (S3)
                    </span>
                    <span>
                      {uploadPhase === "cloud" || cloudProgress > 0
                        ? `${cloudProgress}%`
                        : "Waiting..."}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cloudProgress}%` }}
                    />
                  </div>
                </div>

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
                disabled={uploadPhase === "local" || uploadPhase === "cloud"}
                onClick={() => {
                  cleanupPolling();
                  setActiveTopicForVideoUpload(null);
                  setVideoTitle("");
                  setVideoFile(null);
                  setUploadPhase("idle");
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadPhase !== "idle" || !videoFile || !videoTitle.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {uploadPhase !== "idle" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading Video...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Start Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Upload PDF to Topic */}
      <Dialog
        open={Boolean(activeTopicForPdfUpload)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveTopicForPdfUpload(null);
            setPdfTitle("");
            setPdfFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Upload PDF Document
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload study material to:{" "}
              <strong className="text-slate-700">{activeTopicForPdfUpload?.topicName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadPdfSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                PDF Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 1 Hand-written Notes"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select PDF File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                required
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTopicForPdfUpload(null);
                  setPdfTitle("");
                  setPdfFile(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingPdf}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading PDF...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Video Preview Player */}
      <Dialog
        open={Boolean(previewVideo)}
        onOpenChange={(open) => {
          if (!open) setPreviewVideo(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h3 className="font-bold text-sm truncate">{previewVideo?.title}</h3>
          </div>
          {previewVideo && (
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={
                  previewVideo.moduleId || previewVideo._id
                    ? `${baseUrl}/module/stream/${previewVideo.moduleId || previewVideo._id}`
                    : previewVideo.Video
                }
                controls
                autoPlay
                className="w-full h-full"
                onError={(e) => {
                  if (previewVideo.Video && e.currentTarget.src !== previewVideo.Video) {
                    e.currentTarget.src = previewVideo.Video;
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Delete Alert Box with Loader */}
      <DeleteAlertbox
        isOpen={Boolean(deleteConfirm)}
        itemName={deleteConfirm?.title}
        isDeleting={isDeletingAny}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TopicPdfManager;
