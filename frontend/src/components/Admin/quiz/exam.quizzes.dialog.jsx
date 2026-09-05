import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Loader2,
  Clock,
  Layers,
  Edit,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  FileQuestion,
  Sparkles,
} from "lucide-react";
import {
  useGetQuizzesHook,
  useDeleteQuizHook,
  useToggleQuizLockHook,
  useToggleQuizTypeHook,
} from "../../../hooks/quiz/quiz.hook";
import CreateQuiz from "../quiz";
import QuizQuestionAdd from "../quiz.question.add";
import ManageQuizQuestionsDialog from "./manage.quiz.questions";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";

const ExamQuizzesDialog = ({ isOpen, onClose, exam }) => {
  const { data, isLoading, isError, refetch } = useGetQuizzesHook(
    exam?._id ? { examId: exam._id } : null
  );
  const quizzes = data?.quizzes || [];

  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuizHook();
  const { mutate: toggleLock, isPending: isTogglingLock } = useToggleQuizLockHook();
  const { mutate: toggleQuizType, isPending: isTogglingType } = useToggleQuizTypeHook();

  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);

  const [selectedQuizForAddQ, setSelectedQuizForAddQ] = useState(null);
  const [isAddQOpen, setIsAddQOpen] = useState(false);

  const [selectedQuizForManageQ, setSelectedQuizForManageQ] = useState(null);
  const [isManageQOpen, setIsManageQOpen] = useState(false);

  const [quizToDelete, setQuizToDelete] = useState(null);

  if (!isOpen || !exam) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-6">
          <DialogHeader className="border-b pb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {exam.logoUrl ? (
                  <img
                    src={exam.logoUrl}
                    alt={exam.title}
                    className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {exam.title?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black text-slate-900">
                      {exam.title}
                    </DialogTitle>
                    {exam.category && (
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                        {exam.category}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              <button
                onClick={() => setIsAddQuizOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-violet-200 transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Quiz / Test
              </button>
            </div>
          </DialogHeader>

          {/* Quizzes List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-slate-500 text-sm mt-2">Loading tests for {exam.title}...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-red-500">
                <p>Failed to load quizzes.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-xs font-semibold underline"
                >
                  Retry
                </button>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No Quizzes Added Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Abhi tak is exam ke andar koi quiz nahi hai. Upar diye gaye "Add Quiz / Test" button par click karke pehla test add karein.
                </p>
                <button
                  onClick={() => setIsAddQuizOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  + Create Mock Test 1
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar shadow-sm w-full">
                <table className="w-full min-w-[700px] text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Test Name</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Questions</th>
                      <th className="px-4 py-3 font-semibold">Marks</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizzes.map((quiz) => (
                      <tr key={quiz._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="font-semibold">{quiz.quizName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {quiz.duration} min
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {quiz.totalNoOfQueation}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {quiz.totalMarks}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleQuizType(quiz._id)}
                            disabled={isTogglingType}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                              quiz.quizType === "Paid"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                            title="Click to toggle Free/Paid"
                          >
                            {quiz.quizType === "Paid" ? "Paid" : "Free"}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleLock(quiz._id)}
                            disabled={isTogglingLock}
                            className={`p-1.5 rounded-full border transition cursor-pointer ${
                              quiz.isLocked
                                ? "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100"
                                : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            }`}
                            title={quiz.isLocked ? "Click to Unlock Quiz" : "Click to Lock Quiz"}
                          >
                            {quiz.isLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedQuizForManageQ(quiz);
                                setIsManageQOpen(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Manage Questions"
                            >
                              <Layers className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedQuizForAddQ(quiz);
                                setIsAddQOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Add Question"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedQuizForEdit(quiz)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Edit Quiz Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setQuizToDelete(quiz)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Quiz"
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
        </DialogContent>
      </Dialog>

      {/* Add / Edit Quiz Modal for this Exam */}
      {(isAddQuizOpen || selectedQuizForEdit) && (
        <CreateQuiz
          isOpen={isAddQuizOpen || !!selectedQuizForEdit}
          onClose={() => {
            setIsAddQuizOpen(false);
            setSelectedQuizForEdit(null);
          }}
          exam={exam}
          quiz={selectedQuizForEdit}
        />
      )}

      {/* Add Question Modal */}
      {isAddQOpen && (
        <QuizQuestionAdd
          isOpen={isAddQOpen}
          onClose={() => {
            setIsAddQOpen(false);
            setSelectedQuizForAddQ(null);
          }}
          quiz={selectedQuizForAddQ}
        />
      )}

      {/* Manage Questions Modal */}
      {isManageQOpen && (
        <ManageQuizQuestionsDialog
          isOpen={isManageQOpen}
          onClose={() => {
            setIsManageQOpen(false);
            setSelectedQuizForManageQ(null);
          }}
          quiz={selectedQuizForManageQ}
        />
      )}

      {/* Delete Quiz Alert */}
      <DeleteAlertbox
        isOpen={!!quizToDelete}
        itemName={quizToDelete?.quizName}
        isDeleting={isDeleting}
        onCancel={() => setQuizToDelete(null)}
        onConfirm={() => {
          deleteQuiz(quizToDelete?._id, {
            onSuccess: () => setQuizToDelete(null),
          });
        }}
      />
    </>
  );
};

export default ExamQuizzesDialog;
