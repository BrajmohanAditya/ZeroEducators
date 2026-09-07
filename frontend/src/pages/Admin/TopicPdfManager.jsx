import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSingleCourseHook,
  useAddSubjectHook,
  useDeleteSubjectHook,
  useAddChapterHook,
  useDeleteChapterHook,
  useAddPdfToChapterHook,
  useDeletePdfFromChapterHook,
  useAddVideoToChapterHook,
  useDeleteVideoFromChapterHook,
  useDeleteTopicHook,
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
  BookOpen,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Film,
  Layers,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import GrantCourseAccessDialog from "@/components/Admin/GrantCourseAccessDialog";
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

  // Subject mutations
  const { mutate: addSubject, isPending: isAddingSubject } = useAddSubjectHook(courseId);
  const { mutate: deleteSubject, isPending: isDeletingSubject } = useDeleteSubjectHook(courseId);

  // Chapter mutations
  const { mutate: addChapter, isPending: isAddingChapter } = useAddChapterHook(courseId);
  const { mutate: deleteChapter, isPending: isDeletingChapter } = useDeleteChapterHook(courseId);

  // PDF inside Chapter mutations
  const { mutate: addPdfToChapter, isPending: isAddingPdf } = useAddPdfToChapterHook(courseId);
  const { mutate: deletePdfFromChapter, isPending: isDeletingPdf } = useDeletePdfFromChapterHook(courseId);

  // Video inside Chapter mutations
  const { mutate: addVideoToChapter, isPending: isAddingVideo } = useAddVideoToChapterHook(courseId);
  const { mutate: deleteVideoFromChapter, isPending: isDeletingVideo } = useDeleteVideoFromChapterHook(courseId);

  // Legacy Topic delete mutation
  const { mutate: deleteTopic, isPending: isDeletingTopic } = useDeleteTopicHook(courseId);

  // Custom Delete Alert Box State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  // Chapter Modal State
  const [activeSubjectForChapter, setActiveSubjectForChapter] = useState(null);
  const [chapterName, setChapterName] = useState("");

  // PDF Upload Modal State
  const [activeChapterForPdfUpload, setActiveChapterForPdfUpload] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // Video Upload Modal State
  const [activeChapterForVideoUpload, setActiveChapterForVideoUpload] = useState(null);
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

  // Grant Access Dialog State
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);

  // Accordion toggle states
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLegacyTopics, setExpandedLegacyTopics] = useState(false);

  const toggleSubjectExpand = (subjectId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: prev[subjectId] === undefined ? false : !prev[subjectId],
    }));
  };

  const toggleChapterExpand = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId] === undefined ? false : !prev[chapterId],
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

  // Handle Add Subject
  const handleAddSubjectSubmit = (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    addSubject(
      { courseId, subjectName: subjectName.trim() },
      {
        onSuccess: () => {
          setSubjectName("");
          setIsSubjectModalOpen(false);
        },
      }
    );
  };

  // Handle Add Chapter
  const handleAddChapterSubmit = (e) => {
    e.preventDefault();
    if (!chapterName.trim()) {
      toast.error("Please enter a chapter name");
      return;
    }
    if (!activeSubjectForChapter) return;

    addChapter(
      {
        courseId,
        subjectId: activeSubjectForChapter._id,
        chapterName: chapterName.trim(),
      },
      {
        onSuccess: () => {
          setChapterName("");
          setActiveSubjectForChapter(null);
        },
      }
    );
  };

  // Handle Upload PDF to Chapter
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
    if (!activeChapterForPdfUpload) return;

    const formData = new FormData();
    formData.append("title", pdfTitle.trim());
    formData.append("pdf", pdfFile);

    addPdfToChapter(
      {
        courseId,
        subjectId: activeChapterForPdfUpload.subjectId,
        chapterId: activeChapterForPdfUpload.chapterId,
        formData,
      },
      {
        onSuccess: () => {
          setPdfTitle("");
          setPdfFile(null);
          setActiveChapterForPdfUpload(null);
        },
      }
    );
  };

  // Handle Upload Video to Chapter
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
    if (!activeChapterForVideoUpload) return;

    const uploadId = "up_chap_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
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
                setActiveChapterForVideoUpload(null);
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

    addVideoToChapter(
      {
        courseId,
        subjectId: activeChapterForVideoUpload.subjectId,
        chapterId: activeChapterForVideoUpload.chapterId,
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
            setActiveChapterForVideoUpload(null);
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

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "subject") {
      deleteSubject(
        { courseId, subjectId: deleteConfirm.id },
        { onSuccess: () => setDeleteConfirm(null) }
      );
    } else if (deleteConfirm.type === "chapter") {
      deleteChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.id,
        },
        { onSuccess: () => setDeleteConfirm(null) }
      );
    } else if (deleteConfirm.type === "video") {
      deleteVideoFromChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.chapterId,
          videoId: deleteConfirm.id,
        },
        { onSuccess: () => setDeleteConfirm(null) }
      );
    } else if (deleteConfirm.type === "pdf") {
      deletePdfFromChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.chapterId,
          pdfId: deleteConfirm.id,
        },
        { onSuccess: () => setDeleteConfirm(null) }
      );
    } else if (deleteConfirm.type === "legacyTopic") {
      deleteTopic(
        { courseId, topicId: deleteConfirm.id },
        { onSuccess: () => setDeleteConfirm(null) }
      );
    }
  };

  const isDeletingAny =
    isDeletingSubject ||
    isDeletingChapter ||
    isDeletingVideo ||
    isDeletingPdf ||
    isDeletingTopic;

  // Counts across subjects & chapters
  const totalSubjects = course?.subjects?.length || 0;

  const totalChapters =
    course?.subjects?.reduce(
      (acc, s) => acc + (s.chapters?.length || 0),
      0
    ) || 0;

  const totalSubjectVideos =
    course?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce(
          (cAcc, c) => cAcc + (c.videos?.length || 0),
          0
        ) || 0),
      0
    ) || 0;

  const totalSubjectPdfs =
    course?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce(
          (cAcc, c) => cAcc + (c.pdfs?.length || 0),
          0
        ) || 0),
      0
    ) || 0;

  // Legacy counts
  const legacyTopicsCount = course?.topics?.length || 0;
  const legacyVideosCount =
    course?.topics?.reduce(
      (acc, t) => acc + (t.videos?.length || 0),
      0
    ) || 0;
  const legacyPdfsCount =
    course?.topics?.reduce(
      (acc, t) => acc + (t.pdfs?.length || 0),
      0
    ) || 0;

  const totalVideos = totalSubjectVideos + legacyVideosCount;
  const totalPdfs = totalSubjectPdfs + legacyPdfsCount;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/50 p-4 sm:p-6 lg:p-8 pb-32">
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
            <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">
                {totalSubjects} {totalSubjects === 1 ? "Subject" : "Subjects"}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                {totalChapters} {totalChapters === 1 ? "Chapter" : "Chapters"}
              </span>
              <span>•</span>
              <span>{totalVideos} Videos</span>
              <span>•</span>
              <span>{totalPdfs} PDF Documents</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAccessDialogOpen(true)}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-2 text-sm shadow-xs"
              title="Manage Enrolled Students and Grant Course Access"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" /> Students & Access
            </button>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-2 text-sm"
            >
              <FolderPlus className="w-4 h-4" /> Add Subject
            </button>
          </div>
        </div>
      </div>

      {/* Legacy Topics Warning & Section (if old topics exist) */}
      {legacyTopicsCount > 0 && (
        <div className="max-w-5xl mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Legacy Topics ({legacyTopicsCount})
                </p>
                <p className="text-xs text-amber-700">
                  These topics were created in the previous format. You can delete them or create new Subjects above.
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpandedLegacyTopics((prev) => !prev)}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer inline-flex items-center gap-1"
            >
              {expandedLegacyTopics ? "Hide" : "View"} ({legacyTopicsCount})
              {expandedLegacyTopics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {expandedLegacyTopics && (
            <div className="mt-4 pt-3 border-t border-amber-200/70 space-y-2">
              {course.topics.map((top, tIdx) => (
                <div
                  key={top._id || tIdx}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{top.topicName}</p>
                    <span className="text-xs text-slate-500">
                      {top.videos?.length || 0} Videos • {top.pdfs?.length || 0} PDFs
                    </span>
                  </div>
                  <button
                    disabled={isDeletingAny}
                    onClick={() => {
                      setDeleteConfirm({
                        type: "legacyTopic",
                        id: top._id,
                        title: top.topicName,
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Legacy Topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Subjects Container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {course?.subjects && course.subjects.length > 0 ? (
          course.subjects.map((subject, sIdx) => {
            const isSubjectExpanded = expandedSubjects[subject._id] !== false;
            const subjectChapters = subject.chapters || [];
            const subjectVideoCount = subjectChapters.reduce(
              (acc, c) => acc + (c.videos?.length || 0),
              0
            );
            const subjectPdfCount = subjectChapters.reduce(
              (acc, c) => acc + (c.pdfs?.length || 0),
              0
            );

            return (
              <div
                key={subject._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* Subject Header Bar */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <div
                    className="flex items-center gap-3.5 cursor-pointer flex-1 select-none"
                    onClick={() => toggleSubjectExpand(subject._id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 font-black text-base flex items-center justify-center shrink-0">
                      {sIdx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          Subject {sIdx + 1}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                        {subject.subjectName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{subjectChapters.length} Chapters</span>
                        <span>•</span>
                        <span>{subjectVideoCount} Videos</span>
                        <span>•</span>
                        <span>{subjectPdfCount} PDFs</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Add Chapter Button */}
                    <button
                      onClick={() => setActiveSubjectForChapter(subject)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Add Chapter to this Subject"
                    >
                      <Plus className="w-4 h-4" /> Add Chapter
                    </button>

                    {/* Delete Subject Button */}
                    <button
                      disabled={isDeletingAny}
                      onClick={() => {
                        setDeleteConfirm({
                          type: "subject",
                          id: subject._id,
                          title: subject.subjectName,
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand/Collapse Subject */}
                    <button
                      onClick={() => toggleSubjectExpand(subject._id)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      {isSubjectExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Subject Content: Chapters List */}
                {isSubjectExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4">
                    {subjectChapters.length > 0 ? (
                      subjectChapters.map((chapter, cIdx) => {
                        const isChapterExpanded =
                          expandedChapters[chapter._id] !== false;
                        const chapterVideoCount = chapter.videos?.length || 0;
                        const chapterPdfCount = chapter.pdfs?.length || 0;

                        return (
                          <div
                            key={chapter._id}
                            className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                          >
                            {/* Chapter Header Strip */}
                            <div className="p-4 flex items-center justify-between bg-slate-100/70 border-b border-slate-200">
                              <div
                                className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                                onClick={() => toggleChapterExpand(chapter._id)}
                              >
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {cIdx + 1}
                                </div>
                                <div>
                                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                    {chapter.chapterName}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span className="inline-flex items-center gap-1 font-medium">
                                      <Video className="w-3.5 h-3.5 text-blue-600" />
                                      {chapterVideoCount} {chapterVideoCount === 1 ? "Video" : "Videos"}
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-medium">
                                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                                      {chapterPdfCount} {chapterPdfCount === 1 ? "PDF" : "PDFs"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Add Video Button */}
                                <button
                                  onClick={() =>
                                    setActiveChapterForVideoUpload({
                                      subjectId: subject._id,
                                      chapterId: chapter._id,
                                      chapterName: chapter.chapterName,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-2xs"
                                  title="Upload video to this chapter"
                                >
                                  <Video className="w-3.5 h-3.5" /> Add Video
                                </button>

                                {/* Add PDF Button */}
                                <button
                                  onClick={() =>
                                    setActiveChapterForPdfUpload({
                                      subjectId: subject._id,
                                      chapterId: chapter._id,
                                      chapterName: chapter.chapterName,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition cursor-pointer"
                                  title="Upload PDF notes to this chapter"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add PDF
                                </button>

                                {/* Delete Chapter Button */}
                                <button
                                  disabled={isDeletingAny}
                                  onClick={() => {
                                    setDeleteConfirm({
                                      type: "chapter",
                                      subjectId: subject._id,
                                      id: chapter._id,
                                      title: chapter.chapterName,
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete Chapter"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Expand/Collapse Chapter */}
                                <button
                                  onClick={() => toggleChapterExpand(chapter._id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                                >
                                  {isChapterExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Content Inside Chapter: Videos & PDFs */}
                            {isChapterExpanded && (
                              <div className="p-4 sm:p-5 space-y-5 bg-white">
                                {/* Lectures & Videos */}
                                <div>
                                  <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                      <Film className="w-4 h-4 text-blue-600" />
                                      Lectures & Videos ({chapterVideoCount})
                                    </span>
                                    <button
                                      onClick={() =>
                                        setActiveChapterForVideoUpload({
                                          subjectId: subject._id,
                                          chapterId: chapter._id,
                                          chapterName: chapter.chapterName,
                                        })
                                      }
                                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add another video
                                    </button>
                                  </div>

                                  {chapter.videos && chapter.videos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {chapter.videos.map((vid, vIdx) => (
                                        <div
                                          key={vid._id || vIdx}
                                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all bg-white group shadow-2xs"
                                        >
                                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                              <Video className="w-4 h-4" />
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
                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                              title="Play Video"
                                            >
                                              <PlayCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                              disabled={isDeletingAny}
                                              onClick={() => {
                                                setDeleteConfirm({
                                                  type: "video",
                                                  subjectId: subject._id,
                                                  chapterId: chapter._id,
                                                  id: vid._id,
                                                  title: vid.title,
                                                });
                                              }}
                                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                              title="Delete Video"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-5 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                                      <Video className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                                      <p className="text-xs text-slate-500 font-medium">
                                        No videos added to this chapter yet.
                                      </p>
                                      <button
                                        onClick={() =>
                                          setActiveChapterForVideoUpload({
                                            subjectId: subject._id,
                                            chapterId: chapter._id,
                                            chapterName: chapter.chapterName,
                                          })
                                        }
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Upload first video
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Study Notes & PDFs */}
                                <div>
                                  <div className="flex items-center justify-between mb-2.5 pt-2 border-t border-slate-100">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                      <FileText className="w-4 h-4 text-purple-600" />
                                      Study Notes & PDFs ({chapterPdfCount})
                                    </span>
                                    <button
                                      onClick={() =>
                                        setActiveChapterForPdfUpload({
                                          subjectId: subject._id,
                                          chapterId: chapter._id,
                                          chapterName: chapter.chapterName,
                                        })
                                      }
                                      className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Add PDF
                                    </button>
                                  </div>

                                  {chapter.pdfs && chapter.pdfs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {chapter.pdfs.map((pdf, pIdx) => (
                                        <div
                                          key={pdf._id || pIdx}
                                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all bg-white group shadow-2xs"
                                        >
                                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                              <FileText className="w-4 h-4" />
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
                                                  subjectId: subject._id,
                                                  chapterId: chapter._id,
                                                  id: pdf._id,
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
                                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/30">
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
                      <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300">
                        <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-70" />
                        <h4 className="text-sm font-bold text-slate-800">
                          No chapters in this subject yet
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                          Add chapters inside "{subject.subjectName}" (e.g. "Chapter 1: Overview", "Chapter 2: Core Concepts").
                        </p>
                        <button
                          onClick={() => setActiveSubjectForChapter(subject)}
                          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs shadow hover:bg-blue-700 transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add First Chapter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              No Subjects Created Yet
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
              Organize this course hierarchically: First create <strong>Subjects</strong> (e.g. "Retail Banking and Wealth Management"), then add <strong>Chapters</strong> inside each subject, and upload videos & study PDFs!
            </p>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Subject
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Subject */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-600" /> Add Subject
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a subject for this course (e.g. Retail Banking & Wealth Management, Principles of Banking, etc.)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubjectSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Retail Banking and Wealth Management"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingSubject}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingSubject && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Subject
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Chapter to Subject */}
      <Dialog
        open={Boolean(activeSubjectForChapter)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSubjectForChapter(null);
            setChapterName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Add Chapter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Adding chapter under subject:{" "}
              <strong className="text-slate-800">{activeSubjectForChapter?.subjectName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddChapterSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Chapter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 1: Introduction to Retail Banking"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSubjectForChapter(null);
                  setChapterName("");
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingChapter}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingChapter && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Chapter
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Upload Video to Chapter */}
      <Dialog
        open={Boolean(activeChapterForVideoUpload)}
        onOpenChange={(open) => {
          if (uploadPhase === "local" || uploadPhase === "cloud") {
            toast.warning("Video upload in progress. Please wait until it completes.");
            return;
          }
          if (!open) {
            cleanupPolling();
            setActiveChapterForVideoUpload(null);
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
              Adding video to chapter:{" "}
              <strong className="text-slate-800">{activeChapterForVideoUpload?.chapterName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadVideoSubmit} className="space-y-4 mt-2 text-left">
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
                  setActiveChapterForVideoUpload(null);
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

      {/* Modal: Upload PDF to Chapter */}
      <Dialog
        open={Boolean(activeChapterForPdfUpload)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveChapterForPdfUpload(null);
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
              Upload study notes to chapter:{" "}
              <strong className="text-slate-700">{activeChapterForPdfUpload?.chapterName}</strong>
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
                  setActiveChapterForPdfUpload(null);
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

      {/* Grant Course Access & Enrolled Students Dialog */}
      {isAccessDialogOpen && (
        <GrantCourseAccessDialog
          isOpen={isAccessDialogOpen}
          onClose={() => setIsAccessDialogOpen(false)}
          course={course}
        />
      )}
    </div>
  );
};

export default TopicPdfManager;
