import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSingleCourseHook,
  useAddSubjectHook,
  useUpdateSubjectHook,
  useDeleteSubjectHook,
  useAddChapterHook,
  useUpdateChapterHook,
  useDeleteChapterHook,
  useAddPdfToChapterHook,
  useDeletePdfFromChapterHook,
  useAddVideoToChapterHook,
  useDeleteVideoFromChapterHook,
  useDeleteTopicHook,
  useReorderChaptersHook,
  useReorderSubjectsHook,
  useReorderTopicsHook,
} from "../../hooks/course.hook";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FileText,
  Video,
  PlayCircle,
  Download,
  ExternalLink,
  Loader2,
  FolderPlus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Film,
  Layers,
  UserPlus,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import GrantCourseAccessDialog from "@/components/Admin/GrantCourseAccessDialog";
import ReorderModal from "@/components/Admin/ReorderModal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Modularized Dialog Subcomponents
import { AddSubjectModal, EditSubjectModal } from "@/components/Admin/TopicPdfManager/SubjectModals";
import { AddChapterModal, EditChapterModal } from "@/components/Admin/TopicPdfManager/ChapterModals";
import { AddPdfModal } from "@/components/Admin/TopicPdfManager/AddPdfModal";
import { AddVideoModal } from "@/components/Admin/TopicPdfManager/AddVideoModal";
import { VideoPreviewModal } from "@/components/Admin/TopicPdfManager/VideoPreviewModal";
import { ImportChaptersModal } from "@/components/Admin/TopicPdfManager/ImportChaptersModal";

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
  const { mutate: updateSubject, isPending: isUpdatingSubject } = useUpdateSubjectHook(courseId);
  const { mutate: deleteSubject, isPending: isDeletingSubject } = useDeleteSubjectHook(courseId);

  // Chapter mutations
  const { mutate: addChapter, isPending: isAddingChapter } = useAddChapterHook(courseId);
  const { mutate: updateChapter, isPending: isUpdatingChapter } = useUpdateChapterHook(courseId);
  const { mutate: deleteChapter, isPending: isDeletingChapter } = useDeleteChapterHook(courseId);

  // PDF inside Chapter mutations
  const { mutate: addPdfToChapter, isPending: isAddingPdf } = useAddPdfToChapterHook(courseId);
  const { mutate: deletePdfFromChapter, isPending: isDeletingPdf } = useDeletePdfFromChapterHook(courseId);

  // Video inside Chapter mutations
  const { mutate: addVideoToChapter, isPending: isAddingVideo } = useAddVideoToChapterHook(courseId);
  const { mutate: deleteVideoFromChapter, isPending: isDeletingVideo } = useDeleteVideoFromChapterHook(courseId);

  // Legacy Topic delete mutation
  const { mutate: deleteTopic, isPending: isDeletingTopic } = useDeleteTopicHook(courseId);

  // Reorder mutations
  const { mutate: reorderChapters, isPending: isReorderingChapters } = useReorderChaptersHook(courseId);
  const { mutate: reorderSubjects, isPending: isReorderingSubjects } = useReorderSubjectsHook(courseId);
  const { mutate: reorderTopics, isPending: isReorderingTopics } = useReorderTopicsHook(courseId);

  // Reorder Modal State
  const [reorderConfig, setReorderConfig] = useState(null);

  // Custom Delete Alert Box State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Modal active states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [activeSubjectForChapter, setActiveSubjectForChapter] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [activeChapterForPdfUpload, setActiveChapterForPdfUpload] = useState(null);
  const [activeChapterForVideoUpload, setActiveChapterForVideoUpload] = useState(null);
  const [activeSubjectForImportChapters, setActiveSubjectForImportChapters] = useState(null);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);

  // Accordion toggle states
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLegacyTopics, setExpandedLegacyTopics] = useState(false);

  // Video Preview & Clipboard State
  const [previewVideo, setPreviewVideo] = useState(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState(null);
  const [copiedVideoId, setCopiedVideoId] = useState(null);

  const toggleSubjectExpand = (subjectId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const toggleChapterExpand = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleExpandAll = () => {
    const subjectsMap = {};
    const chaptersMap = {};
    course?.subjects?.forEach((s) => {
      subjectsMap[s._id] = true;
      s.chapters?.forEach((c) => {
        chaptersMap[c._id] = true;
      });
    });
    setExpandedSubjects(subjectsMap);
    setExpandedChapters(chaptersMap);
  };

  const handleCollapseAll = () => {
    setExpandedSubjects({});
    setExpandedChapters({});
  };

  const handleQuickMoveChapter = (subjectId, chapters, fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= chapters.length || fromIdx === toIdx) return;
    const newOrder = [...chapters];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    const chapterIds = newOrder.map((c) => c._id);

    reorderChapters({
      courseId,
      subjectId,
      chapterIds,
    });
  };

  const handleSaveReorder = (orderedItems) => {
    if (!reorderConfig) return;
    if (reorderConfig.type === "chapters") {
      const chapterIds = orderedItems.map((item) => item._id);
      reorderChapters(
        {
          courseId,
          subjectId: reorderConfig.subjectId,
          chapterIds,
        },
        {
          onSuccess: () => setReorderConfig(null),
        }
      );
    } else if (reorderConfig.type === "subjects") {
      const subjectIds = orderedItems.map((item) => item._id);
      reorderSubjects(
        {
          courseId,
          subjectIds,
        },
        {
          onSuccess: () => setReorderConfig(null),
        }
      );
    } else if (reorderConfig.type === "topics") {
      const topicIds = orderedItems.map((item) => item._id);
      reorderTopics(
        {
          courseId,
          topicIds,
        },
        {
          onSuccess: () => setReorderConfig(null),
        }
      );
    }
  };

  // Download video handler
  const handleDownloadVideo = (vid) => {
    if (!vid) return;
    const vId = vid._id || vid.moduleId || "direct";
    const videoUrl = vid.Video || "";
    const videoTitle = vid.title || "video_lecture";

    setDownloadingVideoId(vId);
    toast.info(`Preparing download for "${videoTitle}"...`);

    const identifier = vid.moduleId || vid._id || encodeURIComponent(vid.Video_id || "direct");
    const queryParams = new URLSearchParams({
      title: videoTitle,
      url: videoUrl,
    });

    const downloadEndpoint = `${baseUrl}/module/download/${identifier}?${queryParams.toString()}`;

    const link = document.createElement("a");
    link.href = downloadEndpoint;
    link.setAttribute("download", `${videoTitle.replace(/[^\w\s\-\.]/gi, "_")}.mp4`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingVideoId(null);
    }, 2000);
  };

  // Handle Add Subject submit
  const handleAddSubject = (subjectName) => {
    addSubject(
      { courseId, subjectName },
      {
        onSuccess: () => {
          setIsSubjectModalOpen(false);
        },
      }
    );
  };

  // Handle Edit Subject submit
  const handleEditSubject = (subjectName) => {
    if (!editingSubject) return;
    updateSubject(
      {
        courseId,
        subjectId: editingSubject.subjectId,
        subjectName,
      },
      {
        onSuccess: () => {
          setEditingSubject(null);
        },
      }
    );
  };

  // Handle Add Chapter submit
  const handleAddChapter = (chapterName) => {
    if (!activeSubjectForChapter) return;
    addChapter(
      {
        courseId,
        subjectId: activeSubjectForChapter._id,
        chapterName,
      },
      {
        onSuccess: () => {
          if (activeSubjectForChapter?._id) {
            setExpandedSubjects((prev) => ({
              ...prev,
              [activeSubjectForChapter._id]: true,
            }));
          }
          setActiveSubjectForChapter(null);
        },
      }
    );
  };

  // Handle Edit Chapter submit
  const handleEditChapter = (chapterName) => {
    if (!editingChapter) return;
    updateChapter(
      {
        courseId,
        subjectId: editingChapter.subjectId,
        chapterId: editingChapter.chapterId,
        chapterName,
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
        },
      }
    );
  };

  // Handle Upload PDF to Chapter
  const handleUploadPdf = ({ title, file }) => {
    if (!activeChapterForPdfUpload) return;
    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdf", file);

    addPdfToChapter(
      {
        courseId,
        subjectId: activeChapterForPdfUpload.subjectId,
        chapterId: activeChapterForPdfUpload.chapterId,
        formData,
      },
      {
        onSuccess: () => {
          if (activeChapterForPdfUpload?.chapterId) {
            setExpandedChapters((prev) => ({
              ...prev,
              [activeChapterForPdfUpload.chapterId]: true,
            }));
          }
          setActiveChapterForPdfUpload(null);
        },
      }
    );
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const callbacks = {
      onSuccess: () => setDeleteConfirm(null),
      onSettled: () => setDeleteConfirm(null),
    };

    if (deleteConfirm.type === "subject") {
      deleteSubject({ courseId, subjectId: deleteConfirm.id }, callbacks);
    } else if (deleteConfirm.type === "chapter") {
      deleteChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.id,
        },
        callbacks
      );
    } else if (deleteConfirm.type === "video") {
      deleteVideoFromChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.chapterId,
          videoId: deleteConfirm.id,
        },
        callbacks
      );
    } else if (deleteConfirm.type === "pdf") {
      deletePdfFromChapter(
        {
          courseId,
          subjectId: deleteConfirm.subjectId,
          chapterId: deleteConfirm.chapterId,
          pdfId: deleteConfirm.id,
        },
        callbacks
      );
    } else if (deleteConfirm.type === "legacyTopic") {
      deleteTopic({ courseId, topicId: deleteConfirm.id }, callbacks);
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
    course?.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) || 0;

  const totalSubjectVideos =
    course?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce((cAcc, c) => cAcc + (c.videos?.length || 0), 0) || 0),
      0
    ) || 0;

  const totalSubjectPdfs =
    course?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce((cAcc, c) => cAcc + (c.pdfs?.length || 0), 0) || 0),
      0
    ) || 0;

  // Legacy counts
  const legacyTopicsCount = course?.topics?.length || 0;
  const legacyVideosCount =
    course?.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0;
  const legacyPdfsCount =
    course?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;

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
        {course?.subjects && course.subjects.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Curriculum Structure ({course.subjects.length} Subjects)
            </h2>
            <div className="flex items-center gap-2">
              {course.subjects.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setReorderConfig({
                        type: "subjects",
                        title: "Rearrange Subjects",
                        subtitle: "Drag or select position numbers to rearrange the subjects in this course.",
                        items: course.subjects,
                      })
                    }
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                    title="Rearrange Subjects Order"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Rearrange Subjects
                  </button>
                  <span className="text-slate-300">|</span>
                </>
              )}
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}

        {course?.subjects && course.subjects.length > 0 ? (
          course.subjects.map((subject, sIdx) => {
            const isSubjectExpanded = Boolean(expandedSubjects[subject._id]);
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
                      <div className="flex items-center gap-2 mt-1">
                        <h2 className="text-lg sm:text-xl font-black text-white">
                          {subject.subjectName}
                        </h2>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubject({
                              subjectId: subject._id,
                              subjectName: subject.subjectName,
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-blue-300 hover:bg-white/10 rounded-md transition cursor-pointer"
                          title="Edit Subject Name"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    {/* Rearrange Chapters/Units Button */}
                    {subjectChapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setReorderConfig({
                            type: "chapters",
                            subjectId: subject._id,
                            title: `Rearrange Units - ${subject.subjectName}`,
                            subtitle: "Drag or choose position numbers to reorder the units/modules in this subject.",
                            items: subjectChapters,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-850 hover:bg-slate-750 text-indigo-300 border border-slate-700 hover:border-indigo-400/50 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                        title="Rearrange order of units in this subject"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Rearrange
                      </button>
                    )}

                    {/* Add Chapter Button */}
                    <button
                      onClick={() => setActiveSubjectForChapter(subject)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Add Chapter to this Subject"
                    >
                      <Plus className="w-4 h-4" /> Add Chapter
                    </button>

                    {/* Import Chapter from Another Course */}
                    <button
                      type="button"
                      onClick={() => setActiveSubjectForImportChapters(subject)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      title="Import chapters from another course into this subject"
                    >
                      <Download className="w-3.5 h-3.5" /> Import Chapter
                    </button>

                    {/* Edit Subject Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubject({
                          subjectId: subject._id,
                          subjectName: subject.subjectName,
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
                      title="Edit Subject Name"
                    >
                      <Edit className="w-4 h-4" />
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
                        const isChapterExpanded = Boolean(expandedChapters[chapter._id]);
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
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {cIdx + 1}
                                  </div>
                                  {/* Quick Move Up/Down Buttons */}
                                  <div className="flex flex-col -space-y-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      disabled={cIdx === 0 || isReorderingChapters}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickMoveChapter(subject._id, subjectChapters, cIdx, cIdx - 1);
                                      }}
                                      className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                      title="Move Up (Ek step upar karein)"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cIdx === subjectChapters.length - 1 || isReorderingChapters}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickMoveChapter(subject._id, subjectChapters, cIdx, cIdx + 1);
                                      }}
                                      className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                      title="Move Down (Ek step neeche karein)"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                      {chapter.chapterName}
                                    </h3>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingChapter({
                                          subjectId: subject._id,
                                          chapterId: chapter._id,
                                          chapterName: chapter.chapterName,
                                        });
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                      title="Edit Module / Chapter Name"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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

                                {/* Edit Chapter / Module Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingChapter({
                                      subjectId: subject._id,
                                      chapterId: chapter._id,
                                      chapterName: chapter.chapterName,
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Edit Module / Chapter Name"
                                >
                                  <Edit className="w-4 h-4" />
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
                                              type="button"
                                              onClick={() => handleDownloadVideo(vid)}
                                              disabled={downloadingVideoId === (vid._id || vid.moduleId || vIdx)}
                                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                              title="Download Video (.mp4)"
                                            >
                                              {downloadingVideoId === (vid._id || vid.moduleId || vIdx) ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                              ) : (
                                                <Download className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (vid.Video) {
                                                  navigator.clipboard.writeText(vid.Video);
                                                  setCopiedVideoId(vid._id || vIdx);
                                                  toast.success("Video link copied to clipboard!");
                                                  setTimeout(() => setCopiedVideoId(null), 2000);
                                                }
                                              }}
                                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                              title="Copy Video Link to Reuse"
                                            >
                                              {copiedVideoId === (vid._id || vIdx) ? (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                              ) : (
                                                <Copy className="w-4 h-4" />
                                              )}
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
      <AddSubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onAdd={handleAddSubject}
        isAdding={isAddingSubject}
      />

      {/* Modal: Edit Subject */}
      <EditSubjectModal
        editingSubject={editingSubject}
        onClose={() => setEditingSubject(null)}
        onUpdate={handleEditSubject}
        isUpdating={isUpdatingSubject}
      />

      {/* Modal: Add Chapter to Subject */}
      <AddChapterModal
        activeSubject={activeSubjectForChapter}
        onClose={() => setActiveSubjectForChapter(null)}
        onAdd={handleAddChapter}
        isAdding={isAddingChapter}
      />

      {/* Modal: Edit Chapter / Module */}
      <EditChapterModal
        editingChapter={editingChapter}
        onClose={() => setEditingChapter(null)}
        onUpdate={handleEditChapter}
        isUpdating={isUpdatingChapter}
      />

      {/* Modal: Upload PDF to Chapter */}
      <AddPdfModal
        activeChapter={activeChapterForPdfUpload}
        onClose={() => setActiveChapterForPdfUpload(null)}
        onUpload={handleUploadPdf}
        isAdding={isAddingPdf}
      />

      {/* Modal: Add/Upload Video to Chapter */}
      <AddVideoModal
        activeChapter={activeChapterForVideoUpload}
        courseId={courseId}
        onClose={() => setActiveChapterForVideoUpload(null)}
        addVideoToChapter={addVideoToChapter}
        isAddingVideo={isAddingVideo}
        onVideoAdded={(chapterId) => {
          if (chapterId) {
            setExpandedChapters((prev) => ({
              ...prev,
              [chapterId]: true,
            }));
          }
          queryClient.invalidateQueries(["getSingleCourse", courseId]);
          queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
        }}
      />

      {/* Modal: Video Preview Player */}
      <VideoPreviewModal
        previewVideo={previewVideo}
        baseUrl={baseUrl}
        onClose={() => setPreviewVideo(null)}
        onDownload={handleDownloadVideo}
        downloadingVideoId={downloadingVideoId}
      />

      {/* Modal: Import Chapters from Another Course (On-Demand Query Fetch) */}
      <ImportChaptersModal
        activeSubject={activeSubjectForImportChapters}
        courseId={courseId}
        onClose={() => setActiveSubjectForImportChapters(null)}
        onSuccess={() => {
          queryClient.invalidateQueries(["getSingleCourse", courseId]);
          queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
        }}
      />

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

      {/* Reorder Modal */}
      {reorderConfig && (
        <ReorderModal
          isOpen={Boolean(reorderConfig)}
          onClose={() => setReorderConfig(null)}
          title={reorderConfig.title}
          subtitle={reorderConfig.subtitle}
          items={reorderConfig.items}
          isLoading={isReorderingChapters || isReorderingSubjects || isReorderingTopics}
          onSave={handleSaveReorder}
        />
      )}
    </div>
  );
};

export default TopicPdfManager;
