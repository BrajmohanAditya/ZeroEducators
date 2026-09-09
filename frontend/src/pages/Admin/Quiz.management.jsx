import React, { useState } from "react";
import {
  FileQuestion,
  RefreshCw,
  BookOpen,
  Loader2,
  Edit,
  Plus as PlusIcon,
  Trash2,
  Clock,
  Layers,
  Lock,
  Unlock,
  FolderKanban,
} from "lucide-react";
import { format } from "date-fns";
import CreateExamDialog from "../../components/Admin/quiz/create.exam";
import ExamQuizzesDialog from "../../components/Admin/quiz/exam.quizzes.dialog";
import CreateQuiz from "../../components/Admin/quiz";
import DeleteAlertbox from "../../components/ui/DeleteAlertbox";
import {
  useGetExamsHook,
  useDeleteExamHook,
  useToggleExamLockHook,
} from "../../hooks/quiz/exam.hook";

const QuizManagement = () => {
  const { data, isLoading, isError, refetch } = useGetExamsHook();
  const exams = data?.exams || [];

  const { mutate: deleteExam, isPending: isDeleting } = useDeleteExamHook();
  const { mutate: toggleExamLock, isPending: isTogglingLock } = useToggleExamLockHook();

  // State management for dialogs
  const [editingExam, setEditingExam] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [selectedExamForQuizzes, setSelectedExamForQuizzes] = useState(null);
  const [examForDirectAddQuiz, setExamForDirectAddQuiz] = useState(null);

  const handleDeleteExam = (exam) => {
    setExamToDelete(exam);
  };

  return (
    <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 box-border min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <FileQuestion className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Exam & Quiz Management
            </h1>

          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <CreateExamDialog>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-semibold text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200 cursor-pointer">
              <PlusIcon className="w-4 h-4" />
              Add Exam
            </button>
          </CreateExamDialog>
        </div>
      </div>

      {/* Main Content Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[400px] w-full overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 mt-2 text-sm">Loading exams...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-red-500">
            <p className="font-semibold">Failed to load exams.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              Try Again
            </button>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No Exams Found
            </h3>

            <CreateExamDialog>
              <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition">
                + Add Your First Exam
              </button>
            </CreateExamDialog>
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar rounded-lg border border-slate-200">
            <table className="w-full min-w-[750px] text-sm text-left relative">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">Exam Title & Logo</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Mock Tests / Quizzes</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr
                    key={exam._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Title & Logo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-1">
                          {exam.logoUrl ? (
                            <img
                              src={exam.logoUrl}
                              alt={exam.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-indigo-500" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate max-w-[280px]">
                            {exam.title}
                          </span>
                          {exam.description && (
                            <span className="text-xs text-slate-400 truncate max-w-[280px]">
                              {exam.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {exam.category || "General"}
                      </span>
                    </td>

                    {/* Quizzes Count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                          {exam.totalQuizzes || 0} Tests
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          exam.price > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {exam.price > 0 ? `₹${exam.price}` : "Free"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleExamLock(exam._id)}
                        disabled={isTogglingLock}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                          exam.isLocked
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title={exam.isLocked ? "Click to unlock exam" : "Click to lock exam"}
                      >
                        {exam.isLocked ? (
                          <>
                            <Lock className="w-3 h-3" /> Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" /> Active
                          </>
                        )}
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {exam.createdAt
                        ? format(new Date(exam.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* View & Manage Quizzes under this Exam */}
                        <button
                          onClick={() => setSelectedExamForQuizzes(exam)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                          title="View & Manage all Quizzes in this Exam"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Manage Quizzes
                        </button>

                        {/* Add Quiz directly under this Exam */}
                        <button
                          onClick={() => setExamForDirectAddQuiz(exam)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Add new Quiz to this Exam"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>

                        {/* Edit Exam */}
                        <button
                          onClick={() => setEditingExam(exam)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Exam"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Exam */}
                        <button
                          onClick={() => handleDeleteExam(exam)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog to Edit Exam */}
      {editingExam && (
        <CreateExamDialog
          exam={editingExam}
          onCloseEdit={() => setEditingExam(null)}
        />
      )}

      {/* Dialog to View & Manage All Quizzes for selected Exam */}
      {selectedExamForQuizzes && (
        <ExamQuizzesDialog
          isOpen={!!selectedExamForQuizzes}
          onClose={() => {
            setSelectedExamForQuizzes(null);
            refetch(); // Refetch exam quiz counts
          }}
          exam={selectedExamForQuizzes}
        />
      )}

      {/* Dialog to Add Quiz directly to this Exam */}
      {examForDirectAddQuiz && (
        <CreateQuiz
          isOpen={!!examForDirectAddQuiz}
          onClose={() => {
            setExamForDirectAddQuiz(null);
            refetch();
          }}
          exam={examForDirectAddQuiz}
        />
      )}

      {/* Delete Exam Confirmation */}
      <DeleteAlertbox
        isOpen={!!examToDelete}
        itemName={examToDelete?.title}
        isDeleting={isDeleting}
        onCancel={() => setExamToDelete(null)}
        onConfirm={() => {
          deleteExam(examToDelete?._id, {
            onSuccess: () => setExamToDelete(null),
          });
        }}
      />
    </div>
  );
};

export default QuizManagement;
