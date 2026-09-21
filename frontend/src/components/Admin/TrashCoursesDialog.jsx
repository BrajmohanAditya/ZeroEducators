import React, { useState } from "react";
import {
  useGetTrashCoursesHook,
  useRestoreCourseHook,
  useHardDeleteCourseHook,
} from "../../hooks/course.hook";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  X,
  BookOpen,
  Loader2,
  ShieldAlert,
} from "lucide-react";

const TrashCoursesDialog = ({ isOpen, onClose }) => {
  const { data, isLoading } = useGetTrashCoursesHook();
  const { mutate: restoreCourse, isPending: isRestoring } = useRestoreCourseHook();
  const { mutate: hardDeleteCourse, isPending: isHardDeleting } = useHardDeleteCourseHook();
  const [permanentDeleteId, setPermanentDeleteId] = useState(null);

  if (!isOpen) return null;

  const courses = data?.courses || [];

  const handleRestore = (courseId) => {
    restoreCourse(courseId);
  };

  const handleConfirmPermanentDelete = (courseId) => {
    hardDeleteCourse(courseId, {
      onSuccess: () => setPermanentDeleteId(null),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Trash & Recovery
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  15-Day Auto Delete
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deleted courses are safely kept here for 15 days before permanent wipeout.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm">Loading Trash courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Trash is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No courses have been deleted. When a course is deleted, it will stay here for 15 days.
              </p>
            </div>
          ) : (
            courses.map((course) => {
              const isDeletingThis = permanentDeleteId === course._id;

              return (
                <div
                  key={course._id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {course.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                          <Clock className="w-3 h-3" />
                          Auto-deletes in {course.daysRemaining ?? 15} days
                        </span>
                        <span>•</span>
                        <span>
                          Deleted: {new Date(course.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleRestore(course._id)}
                      disabled={isRestoring}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Restore course back to live website"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Course
                    </button>

                    {isDeletingThis ? (
                      <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                        <span className="text-[11px] font-bold text-red-700 px-1">
                          Wipe now?
                        </span>
                        <button
                          onClick={() => handleConfirmPermanentDelete(course._id)}
                          disabled={isHardDeleting}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                        >
                          {isHardDeleting ? "Deleting..." : "Yes, Wipe"}
                        </button>
                        <button
                          onClick={() => setPermanentDeleteId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPermanentDeleteId(course._id)}
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Permanently wipe immediately from Cloud and Database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Forever
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>Files on Zata Cloud and MongoDB are protected during this 15-day window.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrashCoursesDialog;
