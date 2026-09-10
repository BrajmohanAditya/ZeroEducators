import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetCourseHook,
  useGetSingleCourseHook,
  useCopyCourseHook,
} from "../../hooks/course.hook";
import {
  Copy,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Layers,
  Loader2,
  CheckCircle2,
  UploadCloud,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const CopyCourseDialog = ({ isOpen, onClose, initialCourse = null }) => {
  const navigate = useNavigate();
  const { data: coursesData, isLoading: isLoadingCourses } = useGetCourseHook();
  const courses = coursesData?.courses || [];

  const [selectedSourceId, setSelectedSourceId] = useState(initialCourse?._id || "");
  const [courseSearch, setCourseSearch] = useState("");

  // Target Course Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [courseType, setCourseType] = useState("video");
  const [pricingPlans, setPricingPlans] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // Selection Mode: 'all' | 'selective'
  const [copyMode, setCopyMode] = useState("all");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [selectedChapterIds, setSelectedChapterIds] = useState(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Fetch full details of selected source course (with subjects & chapters)
  const { data: sourceData, isLoading: isLoadingSource } = useGetSingleCourseHook(selectedSourceId);
  const sourceCourse = sourceData?.course;

  const { mutate: copyCourse, isPending: isCopying } = useCopyCourseHook();

  // Pre-fill when dialog opens or initialCourse changes
  useEffect(() => {
    if (initialCourse?._id) {
      setSelectedSourceId(initialCourse._id);
    }
  }, [initialCourse, isOpen]);

  // When source course is loaded, populate defaults
  useEffect(() => {
    if (sourceCourse) {
      setTitle(`Copy of ${sourceCourse.title}`);
      setDescription(sourceCourse.description || "");
      const isFree = sourceCourse.isFree || Number(sourceCourse.amount) === 0;
      setIsFreeMode(isFree);
      setAmount(isFree ? "0" : String(sourceCourse.amount || ""));
      setDuration(sourceCourse.duration || "");
      setCourseType(sourceCourse.courseType || "video");
      setThumbnailPreview(sourceCourse.thumbnail || "");
      setThumbnailFile(null);

      if (sourceCourse.pricingPlans && sourceCourse.pricingPlans.length > 0) {
        setPricingPlans(
          sourceCourse.pricingPlans.map((p) => ({
            duration: p.duration,
            price: String(p.price),
            label: p.label || "",
          }))
        );
      } else {
        setPricingPlans([]);
      }

      // Initialize all subjects and chapters as selected by default
      const subIds = new Set();
      const chapIds = new Set();
      sourceCourse.subjects?.forEach((s) => {
        subIds.add(String(s._id));
        s.chapters?.forEach((c) => {
          chapIds.add(String(c._id));
        });
      });
      setSelectedSubjectIds(subIds);
      setSelectedChapterIds(chapIds);
    }
  }, [sourceCourse]);

  // Subject Checkbox Toggle
  const toggleSubject = (subject) => {
    const sId = String(subject._id);
    const newSubs = new Set(selectedSubjectIds);
    const newChaps = new Set(selectedChapterIds);

    if (newSubs.has(sId)) {
      newSubs.delete(sId);
      subject.chapters?.forEach((c) => newChaps.delete(String(c._id)));
    } else {
      newSubs.add(sId);
      subject.chapters?.forEach((c) => newChaps.add(String(c._id)));
    }

    setSelectedSubjectIds(newSubs);
    setSelectedChapterIds(newChaps);
  };

  // Chapter Checkbox Toggle
  const toggleChapter = (subject, chapter) => {
    const cId = String(chapter._id);
    const sId = String(subject._id);
    const newChaps = new Set(selectedChapterIds);
    const newSubs = new Set(selectedSubjectIds);

    if (newChaps.has(cId)) {
      newChaps.delete(cId);
      const anyChapterSelected = subject.chapters?.some((c) =>
        String(c._id) !== cId && newChaps.has(String(c._id))
      );
      if (!anyChapterSelected) {
        newSubs.delete(sId);
      }
    } else {
      newChaps.add(cId);
      newSubs.add(sId);
    }

    setSelectedChapterIds(newChaps);
    setSelectedSubjectIds(newSubs);
  };

  const toggleExpand = (sId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [sId]: !prev[sId],
    }));
  };

  // Handle Submit
  const handleCopySubmit = (e) => {
    e.preventDefault();

    if (!selectedSourceId) {
      toast.error("Please select a source course to copy from");
      return;
    }

    if (!title.trim()) {
      toast.error("Please provide a title for the new course");
      return;
    }

    if (copyMode === "selective" && selectedChapterIds.size === 0 && selectedSubjectIds.size === 0) {
      toast.error("Please select at least one subject or chapter to copy");
      return;
    }

    const formData = new FormData();
    formData.append("sourceCourseId", selectedSourceId);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("isFree", String(isFreeMode));
    formData.append("amount", isFreeMode ? "0" : amount || "0");
    formData.append("duration", duration);
    formData.append("courseType", courseType);
    formData.append("copyAll", String(copyMode === "all"));

    if (pricingPlans.length > 0 && !isFreeMode) {
      formData.append("pricingPlans", JSON.stringify(pricingPlans));
    }

    if (copyMode === "selective") {
      formData.append("selectedSubjectIds", JSON.stringify(Array.from(selectedSubjectIds)));
      formData.append("selectedChapterIds", JSON.stringify(Array.from(selectedChapterIds)));
    }

    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    copyCourse(formData, {
      onSuccess: (data) => {
        onClose();
        if (data?.course?._id) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span>{data.message || "Course duplicated successfully!"}</span>
              <button
                onClick={() => navigate(`/admindashboard/course-topics/${data.course._id}`)}
                className="text-xs font-bold text-blue-600 underline text-left cursor-pointer"
              >
                Go to Curriculum & Manage Content &rarr;
              </button>
            </div>,
            { duration: 6000 }
          );
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                Copy Course <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">Clone & Reuse</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Create a new course from an existing one with instant media linking (no re-uploading needed).
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleCopySubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Step 1: Select Source Course */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                1. Select Source Course to Copy <span className="text-red-500">*</span>
              </label>

              {isLoadingCourses ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading active courses...
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    required
                  >
                    <option value="">-- Choose an existing course to copy --</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.courseType === "pdf" ? "PDF Course" : "Video Course"} • {c.duration || "Self-Paced"})
                      </option>
                    ))}
                  </select>

                  {sourceCourse && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3.5">
                      {sourceCourse.thumbnail ? (
                        <img
                          src={sourceCourse.thumbnail}
                          alt="Thumbnail"
                          className="w-16 h-11 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-11 bg-blue-200 rounded-lg flex items-center justify-center text-blue-700 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {sourceCourse.title}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-blue-700">
                            {sourceCourse.subjects?.length || 0} Subjects
                          </span>
                          <span>•</span>
                          <span>
                            {sourceCourse.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) || 0} Chapters
                          </span>
                          <span>•</span>
                          <span className="capitalize">{sourceCourse.courseType || "Video"} Course</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Steps 2 & 3 in a 2-Column Responsive Layout */}
            {selectedSourceId && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 border-t border-slate-200">
                {/* Left Column (5 Cols): New Course Details */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                      New Course Details
                    </label>
                  </div>

                  <div className="space-y-3.5 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Course Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g. RRB PO 2026 Batch 2"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Course Type
                        </label>
                        <select
                          value={courseType}
                          onChange={(e) => setCourseType(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="video">Video Course</option>
                          <option value="pdf">PDF Course</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Duration Label
                        </label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="e.g. 6 Months"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pricing Mode
                      </label>
                      <div className="flex items-center gap-2 h-9">
                        <button
                          type="button"
                          onClick={() => setIsFreeMode(false)}
                          className={`flex-1 h-full rounded-xl text-xs font-bold transition cursor-pointer border ${
                            !isFreeMode
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Paid Course
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFreeMode(true)}
                          className={`flex-1 h-full rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isFreeMode
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Free Course
                        </button>
                      </div>
                    </div>

                    {!isFreeMode && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required={!isFreeMode}
                          placeholder="e.g. 999"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Course Thumbnail
                      </label>
                      <div className="flex items-center gap-2.5">
                        {thumbnailPreview && (
                          <img
                            src={thumbnailPreview}
                            alt="Preview"
                            className="w-14 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setThumbnailFile(file);
                              setThumbnailPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (7 Cols): Select Curriculum Sections */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                        3
                      </span>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Select Curriculum to Copy
                      </label>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setCopyMode("all")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          copyMode === "all"
                            ? "bg-white text-blue-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Copy All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCopyMode("selective")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          copyMode === "selective"
                            ? "bg-white text-blue-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Select Sections
                      </button>
                    </div>
                  </div>

                  {isLoadingSource ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                      Loading curriculum structure...
                    </div>
                  ) : copyMode === "all" ? (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900 space-y-1">
                        <p className="font-bold">Full Course Cloning Active:</p>
                        <p>
                          All <strong>{sourceCourse?.subjects?.length || 0} Subjects</strong>,{" "}
                          <strong>
                            {sourceCourse?.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) || 0} Chapters
                          </strong>
                          , videos, and study PDFs will be linked automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Selective Tree View with Checkboxes */
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 max-h-[380px] overflow-y-auto space-y-2">
                      <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <span>
                          Selected: {selectedSubjectIds.size} Subjects • {selectedChapterIds.size} Chapters
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const subIds = new Set();
                              const chapIds = new Set();
                              sourceCourse?.subjects?.forEach((s) => {
                                subIds.add(String(s._id));
                                s.chapters?.forEach((c) => chapIds.add(String(c._id)));
                              });
                              setSelectedSubjectIds(subIds);
                              setSelectedChapterIds(chapIds);
                            }}
                            className="text-blue-600 hover:underline cursor-pointer font-bold"
                          >
                            Select All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubjectIds(new Set());
                              setSelectedChapterIds(new Set());
                            }}
                            className="text-slate-500 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {sourceCourse?.subjects && sourceCourse.subjects.length > 0 ? (
                        sourceCourse.subjects.map((subject, sIdx) => {
                          const sId = String(subject._id);
                          const isSubSelected = selectedSubjectIds.has(sId);
                          const isExpanded = expandedSubjects[sId];
                          const chapters = subject.chapters || [];

                          return (
                            <div
                              key={sId}
                              className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs"
                            >
                              {/* Subject Header */}
                              <div className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSubSelected}
                                    onChange={() => toggleSubject(subject)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                  />
                                  <div
                                    onClick={() => toggleExpand(sId)}
                                    className="flex-1 cursor-pointer select-none flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="text-xs font-bold text-slate-800">
                                        Subject {sIdx + 1}: {subject.subjectName}
                                      </span>
                                      <span className="text-[11px] text-slate-500 block">
                                        {chapters.length} Chapters
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(sId);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Chapter Subtree */}
                              {isExpanded && chapters.length > 0 && (
                                <div className="bg-slate-50 p-2 pl-7 border-t border-slate-100 space-y-1.5">
                                  {chapters.map((chapter) => {
                                    const cId = String(chapter._id);
                                    const isChapSelected = selectedChapterIds.has(cId);

                                    return (
                                      <label
                                        key={cId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer text-xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={isChapSelected}
                                            onChange={() => toggleChapter(subject, chapter)}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                          />
                                          <span className="font-semibold text-slate-800 truncate">
                                            {chapter.chapterName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                                          <span className="flex items-center gap-1">
                                            <Video className="w-3 h-3 text-blue-600" />
                                            {chapter.videos?.length || 0}
                                          </span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3 text-purple-600" />
                                            {chapter.pdfs?.length || 0}
                                          </span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No subjects found in this course.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Dialog Action Buttons */}
          <div className="shrink-0 flex justify-end gap-3 p-4 px-6 border-t border-slate-200 bg-slate-50/90">
            <button
              type="button"
              disabled={isCopying}
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCopying || !selectedSourceId || !title.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isCopying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Duplicating Course...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Create Copied Course
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CopyCourseDialog;
