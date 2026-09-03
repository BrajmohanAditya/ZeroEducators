import React, { useState } from "react";
import {
  FileQuestion,
  RefreshCw,
  BookOpen,
  Loader2,
  Eye,
  Edit,
  Plus as PlusIcon,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react";
import CreateQuiz from "../../components/Admin/quiz";
import {
  useGetQuizzesHook,
  useDeleteQuizHook,
  useToggleQuizLockHook,
  useToggleQuizTypeHook,
} from "../../hooks/quiz/quiz.hook";
import { format } from "date-fns";
import QuizQuestionAdd from "../../components/Admin/quiz.question.add";
import ManageQuizQuestionsDialog from "../../components/Admin/quiz/manage.quiz.questions";
import DeleteAlertbox from "../../components/ui/DeleteAlertbox";
import { Lock, Unlock, Layers } from "lucide-react";

const QuizManagement = () => {
  const { data, isLoading, isError } = useGetQuizzesHook();
  const quizzes = data?.quizzes || [];
  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuizHook();

  const [selectedQuizForAdd, setSelectedQuizForAdd] = useState(null);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [selectedQuizForManage, setSelectedQuizForManage] = useState(null);
  const [isManageQuestionOpen, setIsManageQuestionOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const handleOpenAddQuestion = (quiz) => {
    setSelectedQuizForAdd(quiz);
    setIsAddQuestionOpen(true);
  };

  const handleOpenManageQuestions = (quiz) => {
    setSelectedQuizForManage(quiz);
    setIsManageQuestionOpen(true);
  };

  const handleDeleteQuiz = (quiz) => {
    setQuizToDelete(quiz);
  };

  const { mutate: toggleLock, isPending: isToggling } = useToggleQuizLockHook();
  const { mutate: toggleQuizType, isPending: isTogglingType } =
    useToggleQuizTypeHook();

  return (
    <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 box-border">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <FileQuestion className="w-8 h-8 text-indigo-600" strokeWidth={2.5} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quiz Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View and manage all quizzes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <CreateQuiz>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-semibold text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200">
              <BookOpen className="w-4 h-4" />
              Create Quiz
            </button>
          </CreateQuiz>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[400px] w-full max-w-full overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 mt-2">Loading quizzes...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p>Failed to load quizzes.</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-slate-500">
              No quizzes found. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar rounded-lg border border-slate-200">
            <table className="w-full min-w-[750px] text-sm text-left relative">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold w-[150px]">Quiz ID</th>
                  <th className="px-6 py-4 font-semibold">Quiz Name</th>
                  <th className="px-6 py-4 font-semibold">Exam</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Questions</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="border-b hover:bg-slate-50/50 transition"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 select-all font-semibold max-w-[140px] truncate" title={quiz._id}>
                      {quiz._id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      {quiz.quizName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                        {quiz.nameOfExam}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5 mt-2">
                      <Clock className="w-4 h-4" /> {quiz.duration} mins
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {quiz.totalNoOfQueation}{" "}
                    </td>



                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <CreateQuiz quiz={quiz}>
                          <button className="text-emerald-600 hover:text-emerald-800 transition cursor-pointer">
                            <Edit className="w-4 h-4" />
                          </button>
                        </CreateQuiz>

                        <button
                          className="text-red-500 hover:text-red-700 transition disabled:opacity-50 cursor-pointer"
                          onClick={() => handleDeleteQuiz(quiz)}
                          disabled={
                            isDeleting && quizToDelete?._id === quiz._id
                          }
                        >
                          {isDeleting && quizToDelete?._id === quiz._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          className="text-indigo-650 hover:text-indigo-800 transition cursor-pointer"
                          title="Manage Questions"
                          onClick={() => handleOpenManageQuestions(quiz)}
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Add Question"
                          onClick={() => handleOpenAddQuestion(quiz)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>

                        <button
                          className={`${
                            quiz.isLocked
                              ? "text-amber-500 hover:text-amber-700 bg-amber-50 border-amber-200"
                              : "text-emerald-500 hover:text-emerald-700 bg-emerald-50 border-emerald-200"
                          } border p-2 rounded-full transition disabled:opacity-50 cursor-pointer flex items-center justify-center`}
                          title={quiz.isLocked ? "Unlock Quiz" : "Lock Quiz"}
                          onClick={() => toggleLock(quiz._id)}
                          disabled={isToggling}
                        >
                          {quiz.isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          className={`${
                            quiz.quizType === "Paid"
                              ? "text-amber-600 hover:text-amber-800 bg-amber-50 border-amber-200"
                              : "text-emerald-600 hover:text-emerald-800 bg-emerald-50 border-emerald-200"
                          } border px-3 py-1.5 rounded-full text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center justify-center`}
                          title={
                            quiz.quizType === "Paid"
                              ? "Make it Free"
                              : "Make it Paid"
                          }
                          onClick={() => toggleQuizType(quiz._id)}
                          disabled={isTogglingType}
                        >
                          {quiz.quizType === "Paid" ? "Paid" : "Free"}
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

      {isAddQuestionOpen && (
        <QuizQuestionAdd
          isOpen={isAddQuestionOpen}
          onClose={() => {
            setIsAddQuestionOpen(false);
            setSelectedQuizForAdd(null);
          }}
          quiz={selectedQuizForAdd}
        />
      )}

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

      {isManageQuestionOpen && (
        <ManageQuizQuestionsDialog
          isOpen={isManageQuestionOpen}
          onClose={() => {
            setIsManageQuestionOpen(false);
            setSelectedQuizForManage(null);
          }}
          quiz={selectedQuizForManage}
        />
      )}
    </div>
  );
};

export default QuizManagement;
