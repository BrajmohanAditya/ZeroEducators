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
} from "lucide-react";
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

    // Check if course has topics with videos
    if (data.topics && data.topics.length > 0) {
      let foundVideo = false;
      let foundPdf = false;

      for (const topic of data.topics) {
        if (!foundVideo && topic.videos && topic.videos.length > 0) {
          if (!module) {
            setModule(topic.videos[0]);
            setOpenTopics((prev) => ({ ...prev, [topic._id]: true }));
          }
          foundVideo = true;
        }

        if (!foundPdf && topic.pdfs && topic.pdfs.length > 0) {
          if (!activePdf) {
            setActivePdf(topic.pdfs[0]);
            setOpenTopics((prev) => ({ ...prev, [topic._id]: true }));
          }
          foundPdf = true;
        }
      }
    }

    // Fallback for legacy flat modules
    if (!module && data.modules && data.modules.length > 0) {
      setModule(data.modules[0]);
    }
  }, [data, module, activePdf]);

  // Keyboard shortcut protection (disable Ctrl+S, Ctrl+U, etc.)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "S", "u", "U"].includes(e.key)
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const videoHandler = (item) => {
    setModule(item);
    setActiveContentType("video");
  };

  const pdfHandler = (pdfItem) => {
    setActivePdf(pdfItem);
    setActiveContentType("pdf");
  };

  const toggleTopicAccordion = (topicId) => {
    setOpenTopics((prev) => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId],
    }));
  };

  const totalTopicVideos =
    data?.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0;
  const totalVideos =
    totalTopicVideos > 0 ? totalTopicVideos : data?.modules?.length || 0;

  const totalPdfs =
    data?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;

  const hasTopics = data?.topics && data.topics.length > 0;

  return (
    <div
      className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-slate-50 overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Left Content (Video Player OR PDF Viewer) ── */}
      <div className="w-full lg:w-2/3 flex flex-col bg-slate-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Soft background glows */}
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-blue-400/10 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-3/4 h-3/4 bg-purple-400/10 blur-[120px] pointer-events-none rounded-full"></div>

        {activeContentType === "pdf" ? (
          /* ── PDF Viewer Container ── */
          <div className="flex-1 flex flex-col relative z-10 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200">
            {activePdf ? (
              <div className="flex flex-col h-full w-full">
                {/* PDF Top Bar */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h2
                      className="text-sm sm:text-base font-bold truncate text-slate-100"
                      title={activePdf.title}
                    >
                      {activePdf.title}
                    </h2>
                  </div>

                  <a
                    href={activePdf.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-xs shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Fullscreen
                  </a>
                </div>

                {/* PDF Document Frame */}
                <div className="flex-1 w-full bg-slate-100 relative">
                  <iframe
                    key={activePdf._id || activePdf.pdfUrl}
                    src={`${activePdf.pdfUrl}#toolbar=0`}
                    className="w-full h-full border-none"
                    title={activePdf.title}
                  />

                  {/* Watermark */}
                  {user && (
                    <div className="absolute bottom-3 right-4 pointer-events-none select-none z-20 opacity-40 text-[11px] font-mono text-slate-700 bg-white/70 px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1.5 shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                      <span>{user.email || user.name || "ZeroEducators"}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center p-12 bg-white w-full h-full">
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
          /* ── Video Player Container ── */
          <div
            className="flex-1 flex items-center justify-center relative z-10 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-black shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
            onContextMenu={(e) => e.preventDefault()}
          >
            {module?.Video || module?.Video_id ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black group">
                <video
                  key={module._id || module.Video_id}
                  className="h-full w-full object-contain bg-black select-none pointer-events-auto"
                  src={
                    module.moduleId || module._id
                      ? `${baseUrl}/module/stream/${module.moduleId || module._id}`
                      : module.Video
                  }
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  disableRemotePlayback
                  playsInline
                  preload="auto"
                  autoPlay
                  crossOrigin="use-credentials"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    if (module?.Video && e.currentTarget.src !== module.Video) {
                      e.currentTarget.src = module.Video;
                    }
                  }}
                />

                {/* Anti-Piracy Watermark */}
                {user && (
                  <div className="absolute top-3 right-4 pointer-events-none select-none z-20 opacity-30 group-hover:opacity-60 transition-opacity text-[11px] font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{user.email || user.name || "ZeroEducators"}</span>
                  </div>
                )}
              </div>
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
              {hasTopics ? "Course Curriculum" : isPdfCourse ? "Topics & Notes" : "Course Content"}
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

          {/* If course has topics/chapters */}
          {hasTopics ? (
            <div className="space-y-4">
              {data.topics.map((topic, tIdx) => {
                const isExpanded = openTopics[topic._id] !== false; // expanded by default
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
