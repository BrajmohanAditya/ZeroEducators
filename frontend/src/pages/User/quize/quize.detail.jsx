import React from "react";
import { FileText, Clock, Globe, CircleDot, Crown } from "lucide-react";
import { useGetQuizzesHook } from "@/hooks/quiz/quiz.hook";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetMyQuizResultsHook } from "@/hooks/quiz/quizResult.hook.js";
import PageLoader from "@/components/ui/PageLoader";

const QuizeDetail = () => {
  const [searchParams] = useSearchParams();
  const quizType = searchParams.get("type"); // Will be "Free" or "Paid" or null
  const { data, isLoading, isError } = useGetQuizzesHook(quizType);
  const navigate = useNavigate();

  const { data: myResultsData, isLoading: isResultsLoading } =
    useGetMyQuizResultsHook();

  const loading = isLoading || isResultsLoading;

  const completedQuizIds =
    myResultsData?.results?.map((result) => result.quiz?._id || result.quiz) ||
    [];

  const quizzes = data?.quizzes || [];

  return (
    <PageLoader isLoading={loading} isError={isError}>
      <div className="p-8 min-h-[calc(100vh-80px)] bg-[#f8f9fa] flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((test) => {
              const isCompleted = completedQuizIds.includes(test._id);

              return (
                <div
                  key={test._id}
                  className="bg-white rounded-lg shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300"
                >
                  <div className="p-5 flex-grow">
                    {/* Badges */}
                    <div className="flex gap-2 mb-4 min-h-[24px]">
                      {test.quizType === "Free" ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#ff1053] text-[#ff1053] text-[11px] font-bold tracking-wide">
                            <CircleDot className="w-2.5 h-2.5 fill-[#ff1053]" />
                            LIVE TEST
                          </span>

                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#2dd46c] text-white text-[11px] font-bold tracking-wide">
                            FREE
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-bold tracking-wider shadow-sm border border-amber-300">
                          <Crown
                            className="w-3 h-3 text-white"
                            strokeWidth={2.5}
                          />
                          PREMIUM
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[16px] font-bold text-slate-800 leading-snug mb-5">
                      {test.nameOfExam}
                    </h3>

                    {/* Test Details */}
                    <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium mb-4">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{test.totalNoOfQueation} Questions</span>
                      <span className="text-slate-300">|</span>
                      <span>{test.duration} Mins.</span>
                      <span className="text-slate-300">|</span>
                      <span>{test.totalMarks} Marks</span>
                    </div>

                    {/* Schedule and Action Button */}
                    {isCompleted ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/quiz-result/${test._id}`)}
                          className="py-2 px-3 rounded text-white text-[11px] font-semibold transition-colors shadow-sm bg-[#158993] hover:bg-teal-700 cursor-pointer"
                        >
                          View Result
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/quizeInterface/${test._id}`)
                          }
                          className="py-2 px-3 rounded text-[#158993] text-[11px] font-semibold transition-colors shadow-sm border border-[#158993] hover:bg-teal-50 cursor-pointer"
                        >
                          Show Solution
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/quizeInterface/${test._id}`)}
                        disabled={test.isLocked}
                        className={`py-2 px-3 rounded text-white text-[11px] font-semibold transition-colors shadow-sm ${
                          test.isLocked
                            ? "bg-slate-300 cursor-not-allowed opacity-70"
                            : "bg-[#00c2e0] hover:bg-[#00a8c2] cursor-pointer"
                        }`}
                      >
                        {test.isLocked ? "Locked" : "Start Now"}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-[#f8f9fc] px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600">
                      <Globe className="w-3 h-3" />
                    </div>
                    <span className="text-[13px] font-medium text-[#158993]">
                      English, Hindi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLoader>
  );
};

export default QuizeDetail;
