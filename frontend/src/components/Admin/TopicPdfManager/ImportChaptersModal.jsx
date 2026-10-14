import React, { useState, useMemo, useEffect } from "react";
import { Download, Video, FileText, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminVideoLibraryApi, importChaptersFromCourseApi } from "@/api/course.api";
import { toast } from "sonner";

export const ImportChaptersModal = ({
  activeSubject,
  courseId,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [importSourceCourseId, setImportSourceCourseId] = useState("");
  const [selectedImportChapterIds, setSelectedImportChapterIds] = useState([]);
  const [isImportingChapters, setIsImportingChapters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isOpen = Boolean(activeSubject);

  // ON-DEMAND FETCH: Only fetch video library when this modal is actually OPENED!
  const { data: libraryData, isLoading: isLoadingLibrary } = useQuery({
    queryKey: ["adminVideoLibrary"],
    queryFn: getAdminVideoLibraryApi,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isOpen) {
      setImportSourceCourseId("");
      setSelectedImportChapterIds([]);
      setSearchQuery("");
      setIsImportingChapters(false);
    }
  }, [isOpen]);

  // Source course selected for chapter import
  const selectedSourceCourse = useMemo(() => {
    if (!importSourceCourseId || !libraryData?.courses) return null;
    return libraryData.courses.find((c) => String(c._id) === String(importSourceCourseId));
  }, [importSourceCourseId, libraryData]);

  const filteredCourses = useMemo(() => {
    const courses = (libraryData?.courses || []).filter(
      (c) => String(c._id) !== String(courseId)
    );
    if (!searchQuery.trim()) return courses;
    return courses.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [libraryData, courseId, searchQuery]);

  const handleImportSubmit = async () => {
    if (!activeSubject) return;
    if (!importSourceCourseId) {
      toast.error("Please select a source course");
      return;
    }
    if (selectedImportChapterIds.length === 0) {
      toast.error("Please select at least one chapter to import");
      return;
    }

    setIsImportingChapters(true);
    try {
      const res = await importChaptersFromCourseApi({
        courseId,
        subjectId: activeSubject._id,
        sourceCourseId: importSourceCourseId,
        chapterIds: selectedImportChapterIds,
      });

      queryClient.invalidateQueries(["getSingleCourse", courseId]);
      queryClient.invalidateQueries(["getSinglePurchaseCourse", courseId]);
      toast.success(
        res?.message || `Successfully imported ${selectedImportChapterIds.length} chapter(s)!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to import chapters");
    } finally {
      setIsImportingChapters(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl p-0">
        <DialogHeader className="p-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Import Chapters from Another Course
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Target Subject:{" "}
                <span className="font-semibold text-emerald-700">
                  {activeSubject?.subjectName}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
          {/* Step 1: Select Source Course */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Source Course to Copy From <span className="text-red-500">*</span>
              </label>
              {isLoadingLibrary && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading courses...
                </span>
              )}
            </div>

            <select
              value={importSourceCourseId}
              onChange={(e) => {
                setImportSourceCourseId(e.target.value);
                setSelectedImportChapterIds([]);
              }}
              disabled={isLoadingLibrary}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800 cursor-pointer disabled:bg-slate-100"
            >
              <option value="">-- Choose Course --</option>
              {filteredCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Show Chapters of selected Source Course */}
          {selectedSourceCourse ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Chapters to Import
                </label>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedImportChapterIds.length} chapter(s) selected
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 max-h-72 overflow-y-auto bg-slate-50/50">
                {selectedSourceCourse.subjects?.length > 0 ? (
                  selectedSourceCourse.subjects.map((sub) => {
                    const chapterIdsInSub = (sub.chapters || []).map((ch) => String(ch._id));
                    const allSelectedInSub =
                      chapterIdsInSub.length > 0 &&
                      chapterIdsInSub.every((id) => selectedImportChapterIds.includes(id));

                    return (
                      <div key={sub._id} className="p-3 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {sub.subjectName} ({sub.chapters?.length || 0} chapters)
                          </span>
                          {chapterIdsInSub.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (allSelectedInSub) {
                                  setSelectedImportChapterIds((prev) =>
                                    prev.filter((id) => !chapterIdsInSub.includes(id))
                                  );
                                } else {
                                  setSelectedImportChapterIds((prev) => [
                                    ...prev,
                                    ...chapterIdsInSub.filter((id) => !prev.includes(id)),
                                  ]);
                                }
                              }}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                            >
                              {allSelectedInSub ? "Deselect All" : "Select All"}
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 pl-2">
                          {(sub.chapters || []).map((ch) => {
                            const isChecked = selectedImportChapterIds.includes(String(ch._id));
                            const vidCount = ch.videos?.length || 0;
                            const pdfCount = ch.pdfs?.length || 0;

                            return (
                              <label
                                key={ch._id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer select-none ${
                                  isChecked
                                    ? "bg-emerald-50/90 border-emerald-300 text-slate-900"
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const chIdStr = String(ch._id);
                                      if (e.target.checked) {
                                        setSelectedImportChapterIds((prev) => [...prev, chIdStr]);
                                      } else {
                                        setSelectedImportChapterIds((prev) =>
                                          prev.filter((id) => id !== chIdStr)
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-xs sm:text-sm font-semibold truncate">
                                    {ch.chapterName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 shrink-0 ml-2">
                                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                    <Video className="w-3 h-3 text-blue-600" /> {vidCount}
                                  </span>
                                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                    <FileText className="w-3 h-3 text-purple-600" /> {pdfCount}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="p-4 text-center text-xs text-slate-400">
                    This course has no subjects or chapters yet.
                  </p>
                )}
              </div>
            </div>
          ) : importSourceCourseId ? (
            <p className="text-center text-xs text-slate-400 py-4">Loading curriculum...</p>
          ) : null}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            ⚡ Videos & PDFs will be linked instantly (0 upload wait, 0 extra storage).
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedImportChapterIds.length === 0 || isImportingChapters}
              onClick={handleImportSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isImportingChapters ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Import {selectedImportChapterIds.length} Chapter(s)
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
