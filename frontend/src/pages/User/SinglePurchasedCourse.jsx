import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  PlayCircle,
  ShieldCheck,
  FileText,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Film,
  Maximize2,
  Minimize2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import SecurePdfViewer from "@/components/common/SecurePdfViewer";
import SecureVideoPlayer from "@/components/common/SecureVideoPlayer";
import { useGetSinglePurchasedCourseHook } from "@/hooks/course.hook";
import { useUserStore } from "@/store/user.store";

const SinglePurchasedCourse = () => {
  const { id } = useParams();
  const { data } = useGetSinglePurchasedCourseHook(id);
  const user = useUserStore((state) => state.user);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const isPdfCourse = data?.courseType === "pdf";

  // Active view: 'video' | 'pdf'
  const [activeContentType, setActiveContentType] = useState(
    isPdfCourse ? "pdf" : "video"
  );

  // State for video module
  const [module, setModule] = useState(null);

  // State for PDF document
  const [activePdf, setActivePdf] = useState(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [openSubjects, setOpenSubjects] = useState({});
  const [openChapters, setOpenChapters] = useState({});
  const [openTopics, setOpenTopics] = useState({});

  useEffect(() => {
    if (isPdfCourse) {
      setActiveContentType("pdf");
    } else {
      setActiveContentType("video");
    }
  }, [isPdfCourse]);

  // Auto-select first video or first PDF
  useEffect(() => {
    if (!data) return;

    // Check subjects hierarchy first (Subject -> Chapter -> Videos/PDFs)
    if (data.subjects && data.subjects.length > 0) {
      let foundVideo = false;
      let foundPdf = false;

      for (const subject of data.subjects) {
        if (subject.chapters && subject.chapters.length > 0) {
          for (const chapter of subject.chapters) {
            if (!foundVideo && chapter.videos && chapter.videos.length > 0) {
              if (!module) {
                setModule(chapter.videos[0]);
                if (!isPdfCourse) {
                  setOpenSubjects((prev) => ({ ...prev, [subject._id]: true }));
                  setOpenChapters((prev) => ({ ...prev, [chapter._id]: true }));
                }
              }
              foundVideo = true;
            }

            if (!foundPdf && chapter.pdfs && chapter.pdfs.length > 0) {
              if (!activePdf) {
                setActivePdf(chapter.pdfs[0]);
                if (isPdfCourse) {
                  setOpenSubjects((prev) => ({ ...prev, [subject._id]: true }));
                  setOpenChapters((prev) => ({ ...prev, [chapter._id]: true }));
                }
              }
              foundPdf = true;
            }
          }
        }
      }

      // If no video or pdf set open subjects yet, ensure the first subject is open
      setOpenSubjects((prev) => {
        if (Object.keys(prev).length === 0 && data.subjects[0]?._id) {
          return { [data.subjects[0]._id]: true };
        }
        return prev;
      });
    }

    // Check legacy topics with videos
    if ((!module || !activePdf) && data.topics && data.topics.length > 0) {
      let foundVideo = Boolean(module);
      let foundPdf = Boolean(activePdf);

      for (const topic of data.topics) {
        if (!foundVideo && topic.videos && topic.videos.length > 0) {
          if (!module) {
            setModule(topic.videos[0]);
            if (!isPdfCourse) {
              setOpenTopics((prev) => ({ ...prev, [topic._id]: true }));
            }
          }
          foundVideo = true;
        }

        if (!foundPdf && topic.pdfs && topic.pdfs.length > 0) {
          if (!activePdf) {
            setActivePdf(topic.pdfs[0]);
            if (isPdfCourse) {
              setOpenTopics((prev) => ({ ...prev, [topic._id]: true }));
            }
          }
          foundPdf = true;
        }
      }
    }

    // Fallback for legacy flat modules
    if (!module && data.modules && data.modules.length > 0) {
      setModule(data.modules[0]);
    }
  }, [data, module, activePdf, isPdfCourse]);

  // Keyboard shortcut protection (disable Ctrl+S, Ctrl+P, Ctrl+U, etc.)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPdfFullscreen) {
        setIsPdfFullscreen(false);
        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "S", "u", "U", "p", "P"].includes(e.key)
      ) {
        e.preventDefault();
        toast.error("Saving and printing are disabled to protect course content.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPdfFullscreen]);

  const videoHandler = (item) => {
    setModule(item);
    setActiveContentType("video");
  };

  const pdfHandler = (pdfItem) => {
    setActivePdf(pdfItem);
    setActiveContentType("pdf");
  };

  const toggleSubjectAccordion = (subjectId) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const toggleChapterAccordion = (chapterId) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleTopicAccordion = (topicId) => {
    setOpenTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const totalSubjectVideos =
    data?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce((cAcc, c) => cAcc + (c.videos?.length || 0), 0) || 0),
      0
    ) || 0;

  const totalTopicVideos =
    data?.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0;

  const totalVideos =
    totalSubjectVideos + totalTopicVideos > 0
      ? totalSubjectVideos + totalTopicVideos
      : data?.modules?.length || 0;

  const totalSubjectPdfs =
    data?.subjects?.reduce(
      (acc, s) =>
        acc +
        (s.chapters?.reduce((cAcc, c) => cAcc + (c.pdfs?.length || 0), 0) || 0),
      0
    ) || 0;

  const totalTopicPdfs =
    data?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;

  const totalPdfs = totalSubjectPdfs + totalTopicPdfs;

  const hasSubjects = data?.subjects && data.subjects.length > 0;
  const hasTopics = data?.topics && data.topics.length > 0;

  return (
    <div
      className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] bg-slate-50 overflow-y-auto lg:overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Left Content (Video Player OR PDF Viewer) ── */}
      <div className="w-full lg:w-2/3 flex flex-col bg-slate-50 p-2 sm:p-4 lg:p-8 relative overflow-hidden shrink-0">
        {/* Soft background glows */}
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-blue-400/10 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-3/4 h-3/4 bg-purple-400/10 blur-[120px] pointer-events-none rounded-full"></div>

        {activeContentType === "pdf" ? (
          /* ── PDF Viewer Container ── */
          <div
            className={
              isPdfFullscreen
                ? "fixed inset-0 z-[99999] bg-slate-950 flex flex-col w-screen h-screen overflow-hidden select-none"
                : "flex-1 min-h-[400px] flex flex-col relative z-10 w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-800 select-none"
            }
          >
            {activePdf ? (
              <SecurePdfViewer
                key={activePdf._id || activePdf.pdfUrl}
                pdfUrl={
                  id && activePdf._id
                    ? `${baseUrl}/course/stream-pdf/${id}/${activePdf._id}`
                    : activePdf.pdfUrl
                }
                title={activePdf.title}
                user={user}
                isFullscreen={isPdfFullscreen}
                onToggleFullscreen={() => setIsPdfFullscreen((prev) => !prev)}
              />
            ) : (
              <div className="text-center flex flex-col items-center justify-center p-12 bg-white w-full h-full rounded-3xl">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-purple-100">
                  <FileText className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Document Selected</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  Click on any topic or PDF in the right sidebar to start reading your study materials.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Video Player Container (16:9 Aspect ratio on Mobile, Full on Desktop) ── */
          <div
            className="w-full aspect-video lg:aspect-auto lg:flex-1 flex items-center justify-center relative z-10 max-w-5xl mx-auto rounded-xl sm:rounded-3xl overflow-hidden bg-black shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
            onContextMenu={(e) => e.preventDefault()}
          >
            {module?.Video || module?.Video_id ? (
              <SecureVideoPlayer
                videoKey={module._id || module.Video_id}
                src={
                  module.moduleId || module._id
                    ? `${baseUrl}/module/stream/${module.moduleId || module._id}`
                    : module.Video
                }
                user={user}
                onError={(e) => {
                  if (module?.Video && e.currentTarget.src !== module.Video) {
                    e.currentTarget.src = module.Video;
                  }
                }}
              />
            ) : (
              <div className="text-center flex flex-col items-center justify-center p-12 animate-in fade-in duration-500 bg-white w-full h-full">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 shadow-sm">
                  <PlayCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Ready to Learn?</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  Select a video lecture from the course content sidebar on the right to start watching.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Content List ── */}
      <div className="w-full lg:w-1/3 bg-white overflow-y-auto border-l border-slate-100 shadow-xl z-20 custom-scrollbar">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {hasSubjects || hasTopics ? "Course Curriculum" : isPdfCourse ? "Topics & Notes" : "Course Content"}
            </h2>
            <div className="flex items-center gap-2">
              {totalVideos > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {totalVideos} {totalVideos === 1 ? "Video" : "Videos"}
                </span>
              )}
              {totalPdfs > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
                  {totalPdfs} {totalPdfs === 1 ? "PDF" : "PDFs"}
                </span>
              )}
            </div>
          </div>

          {/* Subjects Hierarchy (Subject -> Chapter -> Content) */}
          {hasSubjects ? (
            <div className="space-y-4">
              {data.subjects.map((subject, sIdx) => {
                const isSubjectOpen = Boolean(openSubjects[subject._id]);
                const subjectChapters = subject.chapters || [];
                const sVideosCount = subjectChapters.reduce(
                  (acc, c) => acc + (c.videos?.length || 0),
                  0
                );
                const sPdfsCount = subjectChapters.reduce(
                  (acc, c) => acc + (c.pdfs?.length || 0),
                  0
                );

                return (
                  <div
                    key={subject._id || sIdx}
                    className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs bg-white"
                  >
                    {/* Subject Header Accordion */}
                    <button
                      type="button"
                      onClick={() => toggleSubjectAccordion(subject._id)}
                      className="w-full p-4 flex items-center justify-between bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer text-left select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-400/30">
                          {sIdx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-sm block text-white">
                            {subject.subjectName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {subjectChapters.length} {subjectChapters.length === 1 ? "chapter" : "chapters"} • {sVideosCount} videos • {sPdfsCount} PDFs
                          </span>
                        </div>
                      </div>

                      {isSubjectOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Chapters List Inside Subject */}
                    {isSubjectOpen && (
                      <div className="p-2 space-y-2 bg-slate-50/50">
                        {subjectChapters.length > 0 ? (
                          subjectChapters.map((chapter, cIdx) => {
                            const isChapterOpen = Boolean(openChapters[chapter._id]);
                            const chapVideos = chapter.videos || [];
                            const chapPdfs = chapter.pdfs || [];

                            return (
                              <div
                                key={chapter._id || cIdx}
                                className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs"
                              >
                                {/* Chapter Accordion Header */}
                                <button
                                  type="button"
                                  onClick={() => toggleChapterAccordion(chapter._id)}
                                  className="w-full p-3 flex items-center justify-between bg-slate-100 hover:bg-slate-150 transition cursor-pointer text-left select-none border-b border-slate-100"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                      {cIdx + 1}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 text-xs block">
                                        {chapter.chapterName}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {chapVideos.length} {chapVideos.length === 1 ? "video" : "videos"}
                                        {chapPdfs.length > 0 ? ` • ${chapPdfs.length} ${chapPdfs.length === 1 ? "PDF" : "PDFs"}` : ""}
                                      </span>
                                    </div>
                                  </div>

                                  {isChapterOpen ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>

                                {/* Videos & PDFs inside Chapter */}
                                {isChapterOpen && (
                                  <div className="p-2 space-y-1.5 bg-white">
                                    {/* Chapter Videos */}
                                    {chapVideos.map((vid, vIdx) => {
                                      const isActive =
                                        activeContentType === "video" &&
                                        (module?._id === vid._id ||
                                          module?.Video_id === vid.Video_id ||
                                          module?.moduleId === vid.moduleId);

                                      return (
                                        <button
                                          key={vid._id || vIdx}
                                          onClick={() => videoHandler(vid)}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                                            isActive
                                              ? "border-emerald-500 bg-emerald-50/80 shadow-xs"
                                              : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                                          }`}
                                        >
                                          <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                              isActive
                                                ? "bg-emerald-600 text-white"
                                                : "bg-blue-50 text-blue-600 border border-blue-100"
                                            }`}
                                          >
                                            <Video className="w-3.5 h-3.5" />
                                          </div>

                                          <div className="flex flex-col flex-1 overflow-hidden">
                                            <span
                                              className={`text-xs font-semibold truncate ${
                                                isActive ? "text-emerald-900" : "text-slate-800"
                                              }`}
                                              title={vid.title}
                                            >
                                              {vid.title}
                                            </span>
                                            {isActive && (
                                              <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                                Now Playing
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}

                                    {/* Chapter PDFs */}
                                    {chapPdfs.map((pdf, pIdx) => {
                                      const isActive =
                                        activeContentType === "pdf" && activePdf?._id === pdf._id;

                                      return (
                                        <button
                                          key={pdf._id || pIdx}
                                          onClick={() => pdfHandler(pdf)}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                                            isActive
                                              ? "border-purple-500 bg-purple-50/80 shadow-xs"
                                              : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                                          }`}
                                        >
                                          <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                              isActive
                                                ? "bg-purple-600 text-white"
                                                : "bg-purple-50 text-purple-600 border border-purple-100"
                                            }`}
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                          </div>

                                          <div className="flex flex-col flex-1 overflow-hidden">
                                            <span
                                              className={`text-xs font-semibold truncate ${
                                                isActive ? "text-purple-900" : "text-slate-800"
                                              }`}
                                              title={pdf.title}
                                            >
                                              {pdf.title}
                                            </span>
                                            {isActive && (
                                              <span className="text-[10px] text-purple-600 font-bold mt-0.5">
                                                Reading Now
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}

                                    {chapVideos.length === 0 && chapPdfs.length === 0 && (
                                      <p className="text-[11px] text-slate-400 py-2 text-center">
                                        No content uploaded in this chapter yet.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400 py-3 text-center">
                            No chapters added to this subject yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : hasTopics ? (
            /* Legacy Topics Fallback */
            <div className="space-y-4">
              {data.topics.map((topic, tIdx) => {
                const isExpanded = Boolean(openTopics[topic._id]);
                const topicVideos = topic.videos || [];
                const topicPdfs = topic.pdfs || [];

                return (
                  <div
                    key={topic._id || tIdx}
                    className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                  >
                    {/* Topic Header Accordion */}
                    <button
                      type="button"
                      onClick={() => toggleTopicAccordion(topic._id)}
                      className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 transition cursor-pointer text-left border-b border-slate-100 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {tIdx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {topic.topicName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {topicVideos.length} {topicVideos.length === 1 ? "lecture" : "lectures"}
                            {topicPdfs.length > 0 ? ` • ${topicPdfs.length} ${topicPdfs.length === 1 ? "PDF" : "PDFs"}` : ""}
                          </span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Content inside this Topic */}
                    {isExpanded && (
                      <div className="p-2 space-y-1.5 bg-white">
                        {/* Videos in this chapter */}
                        {topicVideos.map((vid, vIdx) => {
                          const isActive =
                            activeContentType === "video" &&
                            (module?._id === vid._id ||
                              module?.Video_id === vid.Video_id ||
                              module?.moduleId === vid.moduleId);

                          return (
                            <button
                              key={vid._id || vIdx}
                              onClick={() => videoHandler(vid)}
                              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left cursor-pointer ${
                                isActive
                                  ? "border-emerald-500 bg-emerald-50/80 shadow-xs"
                                  : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isActive
                                    ? "bg-emerald-600 text-white"
                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                                }`}
                              >
                                <Video className="w-4 h-4" />
                              </div>

                              <div className="flex flex-col flex-1 overflow-hidden">
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    isActive ? "text-emerald-900" : "text-slate-800"
                                  }`}
                                  title={vid.title}
                                >
                                  {vid.title}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                    Now Playing
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}

                        {/* PDFs in this chapter */}
                        {topicPdfs.map((pdf, pIdx) => {
                          const isActive =
                            activeContentType === "pdf" && activePdf?._id === pdf._id;

                          return (
                            <button
                              key={pdf._id || pIdx}
                              onClick={() => pdfHandler(pdf)}
                              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left cursor-pointer ${
                                isActive
                                  ? "border-purple-500 bg-purple-50/80 shadow-xs"
                                  : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isActive
                                    ? "bg-purple-600 text-white"
                                    : "bg-purple-50 text-purple-600 border border-purple-100"
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                              </div>

                              <div className="flex flex-col flex-1 overflow-hidden">
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    isActive ? "text-purple-900" : "text-slate-800"
                                  }`}
                                  title={pdf.title}
                                >
                                  {pdf.title}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] text-purple-600 font-bold mt-0.5">
                                    Reading Now
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}

                        {topicVideos.length === 0 && topicPdfs.length === 0 && (
                          <p className="text-xs text-slate-400 py-3 text-center">
                            No content uploaded in this chapter yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Legacy Flat Modules List (Fallback) ── */
            <div className="space-y-3">
              {data?.modules && data.modules.length > 0 ? (
                data.modules.map((item, index) => {
                  const isActive =
                    activeContentType === "video" && module?._id === item._id;

                  return (
                    <button
                      key={item._id || index}
                      onClick={() => videoHandler(item)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold line-clamp-2 ${
                            isActive ? "text-emerald-800" : "text-slate-900"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isActive && (
                          <span className="text-xs text-emerald-600 font-medium mt-1">
                            Now Playing
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">No lectures uploaded for this course yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SinglePurchasedCourse;
