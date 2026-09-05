import React, { useState } from "react";
import {
  FileText,
  Clock,
  Globe,
  CircleDot,
  Crown,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { useGetQuizzesHook } from "@/hooks/quiz/quiz.hook";
import { useGetExamsHook } from "@/hooks/quiz/exam.hook";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetMyQuizResultsHook } from "@/hooks/quiz/quizResult.hook.js";
import PageLoader from "@/components/ui/PageLoader";

const QuizeDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const quizType = searchParams.get("type"); // "Free" or "Paid" or null
  const selectedExamId = searchParams.get("examId"); // Exam ID if filtered

  // Fetch all exams for filter pills
  const { data: examsData, isLoading: isExamsLoading } = useGetExamsHook();
  const exams = examsData?.exams || [];

  // Fetch quizzes (filtered by type and/or examId)
  const queryParams = {};
  if (quizType) queryParams.quizType = quizType;
  if (selectedExamId) queryParams.examId = selectedExamId;

  const { data, isLoading, isError } = useGetQuizzesHook(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );
  const navigate = useNavigate();

  const { data: myResultsData, isLoading: isResultsLoading } =
    useGetMyQuizResultsHook();

  const loading = isLoading || isResultsLoading || isExamsLoading;

  const completedQuizIds =
    myResultsData?.results?.map((result) => result.quiz?._id || result.quiz) ||
    [];

  const quizzes = data?.quizzes || [];

  const handleSelectExam = (examId) => {
    const newParams = new URLSearchParams(searchParams);
    if (!examId) {
      newParams.delete("examId");
    } else {
      newParams.set("examId", examId);
    }
    setSearchParams(newParams);
  };

  const handleSelectType = (type) => {
    const newParams = new URLSearchParams(searchParams);
    if (!type) {
      newParams.delete("type");
    } else {
      newParams.set("type", type);
    }
    setSearchParams(newParams);
  };

  const currentExam = exams.find((e) => e._id === selectedExamId);

  return (
    <PageLoader isLoading={loading} isError={isError}>
      <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)] bg-[#f8f9fa] flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header & Filter Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {currentExam ? `${currentExam.title} Mock Tests` : "Explore All Mock Tests"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Choose an exam category to practice sets, live tests, and previous year papers.
                </p>
              </div>

              {/* Free / Paid Type Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => handleSelectType(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !quizType
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Tests
                </button>
                <button
                  onClick={() => handleSelectType("Free")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    quizType === "Free"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Free Live Tests
                </button>
                <button
                  onClick={() => handleSelectType("Paid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    quizType === "Paid"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Premium
                </button>
              </div>
            </div>

            {/* Exam Categories Horizontal Pills */}
            {exams.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                  onClick={() => handleSelectExam(null)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border ${
                    !selectedExamId
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  All Exams
                </button>

                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => handleSelectExam(exam._id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border ${
                      selectedExamId === exam._id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {exam.logoUrl ? (
                      <img
                        src={exam.logoUrl}
                        alt={exam.title}
                        className="w-4 h-4 object-contain rounded-sm"
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                        {exam.title.charAt(0)}
                      </span>
                    )}
                    <span>{exam.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedExamId === exam._id
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {exam.totalQuizzes || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quizzes Grid */}
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No Quizzes Available
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Is category me filhal koi tests live nahi hain. Please select another exam category or check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((test) => {
                const isCompleted = completedQuizIds.includes(test._id);
                const examLogo = test.logoUrl || test.examId?.logoUrl;
                const examTitle = test.nameOfExam || test.examId?.title;

                return (
                  <div
                    key={test._id}
                    className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300"
                  >
                    <div className="p-5 flex-grow">
                      {/* Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex gap-2">
                          {test.quizType === "Free" ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#ff1053] text-[#ff1053] text-[10px] font-bold tracking-wide">
                                <CircleDot className="w-2.5 h-2.5 fill-[#ff1053]" />
                                LIVE TEST
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#2dd46c] text-white text-[10px] font-bold tracking-wide">
                                FREE
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold tracking-wider shadow-xs border border-amber-300">
                              <Crown className="w-3 h-3 text-white" strokeWidth={2.5} />
                              PREMIUM
                            </span>
                          )}
                        </div>

                        {examTitle && (
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[130px]">
                            {examTitle}
                          </span>
                        )}
                      </div>

                      {/* Quiz Title & Exam Logo */}
                      <div className="flex items-start gap-3 mb-4">
                        {examLogo && (
                          <img
                            src={examLogo}
                            alt={examTitle || "Logo"}
                            className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1 shrink-0"
                          />
                        )}
                        <div>
                          <h3 className="text-[16px] font-bold text-slate-900 leading-snug">
                            {test.quizName}
                          </h3>
                          {examTitle && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {examTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Test Details */}
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{test.totalNoOfQueation} Questions</span>
                        <span className="text-slate-300">|</span>
                        <span>{test.duration} Mins</span>
                        <span className="text-slate-300">|</span>
                        <span>{test.totalMarks} Marks</span>
                      </div>

                      {/* Schedule and Action Button */}
                      {isCompleted ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/quiz-result/${test._id}`)}
                            className="flex-1 py-2 px-3 rounded-lg text-white text-[11px] font-bold transition-colors shadow-sm bg-[#158993] hover:bg-teal-700 cursor-pointer text-center"
                          >
                            View Result
                          </button>
                          <button
                            onClick={() => navigate(`/quizeInterface/${test._id}`)}
                            className="flex-1 py-2 px-3 rounded-lg text-[#158993] text-[11px] font-bold transition-colors shadow-sm border border-[#158993] hover:bg-teal-50 cursor-pointer text-center"
                          >
                            Show Solution
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/quizeInterface/${test._id}`)}
                          disabled={test.isLocked}
                          className={`w-full py-2.5 px-3 rounded-lg text-white text-xs font-bold transition-all shadow-sm ${
                            test.isLocked
                              ? "bg-slate-300 cursor-not-allowed opacity-75"
                              : "bg-[#00c2e0] hover:bg-[#00a8c2] hover:shadow-md cursor-pointer"
                          }`}
                        >
                          {test.isLocked ? "Locked" : "Start Now"}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-[#f8f9fc] px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center justify-center w-4 h-4 rounded bg-blue-100 text-blue-600">
                          <Globe className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-[11px] font-medium text-[#158993]">
                          English, Hindi
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {test.negativeMark ? `-${test.negativeMark} Neg.` : "No Neg."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLoader>
  );
};

export default QuizeDetail;
