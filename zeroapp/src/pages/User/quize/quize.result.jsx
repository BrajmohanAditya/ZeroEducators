import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMyQuizResultsHook, useGetAllQuizResultsHook } from "@/hooks/quiz/quizResult.hook.js";
import { useGetQuizByIdHook } from "@/hooks/quiz/quiz.hook";
import { useUserStore } from "@/store/user.store";
import PageLoader from "@/components/ui/PageLoader";
import { CheckCircle, XCircle, MinusCircle, Trophy, Users } from "lucide-react";

const QuizResult = () => {
  const { id } = useParams(); // quiz ID from URL
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();

  // Fetch the saved result for this quiz
  const {
    data: resultData,
    isLoading: isResultLoading,
    isError: isResultError,
  } = useGetMyQuizResultsHook(id);

  // Fetch the quiz info (name, totalMarks, etc.)
  const {
    data: quizData,
    isLoading: isQuizLoading,
    isError: isQuizError,
  } = useGetQuizByIdHook(id);

  // Fetch all quiz results for the leaderboard
  const {
    data: allResultsData,
    isLoading: isAllResultsLoading,
  } = useGetAllQuizResultsHook(id);

  const loading = isResultLoading || isQuizLoading || isAllResultsLoading;
  const isError = isResultError || isQuizError;

  // The saved result from DB
  const result = resultData?.results?.[0];
  const quiz = quizData?.quiz;
  const allResults = allResultsData?.results || [];

  return (
    <PageLoader
      isLoading={loading}
      isError={isError}
      errorMessage="Failed to load your result."
    >
      <div className="min-h-[calc(100vh-80px)] bg-[#f8f9fa] py-4 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Left Column: Your Score Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full lg:w-[380px] p-6 text-center shrink-0">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-[#e6f7f8] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#158993]" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-xl font-bold text-slate-800 mb-0.5">
              {quiz?.nameOfExam}
            </h1>
            <p className="text-slate-400 text-xs mb-5">
              Your result has been saved
            </p>

            {/* Score Card */}
            <div className="bg-[#158993] rounded-xl p-4 mb-5 text-white">
              <p className="text-xs font-medium opacity-80 mb-1">Your Score</p>
              <p className="text-4xl font-extrabold">
                {result?.totalScore != null ? Number(Number(result.totalScore).toFixed(2)) : "—"}
              </p>
              <p className="text-xs opacity-70 mt-1">
                out of {quiz?.totalMarks ?? "—"} marks
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Correct */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex flex-col items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-lg font-bold text-green-600">
                  {result?.correctCount ?? "—"}
                </span>
                <span className="text-[10px] text-green-700 font-medium uppercase tracking-wider">
                  Correct
                </span>
              </div>

              {/* Wrong */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col items-center gap-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-lg font-bold text-red-500">
                  {result?.wrongCount ?? "—"}
                </span>
                <span className="text-[10px] text-red-700 font-medium uppercase tracking-wider">
                  Wrong
                </span>
              </div>

              {/* Unattempted */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1">
                <MinusCircle className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-bold text-slate-500">
                  {result?.unattemptedCount ?? "—"}
                </span>
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                  Skipped
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/quizeInterface/${id}`)}
                className="flex-1 py-2.5 rounded-lg bg-[#158993] text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
              >
                View Solutions
              </button>
            </div>
          </div>

          {/* Right Column: Leaderboard / Participants */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex-1 w-full p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Users className="w-5 h-5 text-[#158993]" />
              Other Participants Leaderboard
            </h2>

            <div className="max-h-[340px] overflow-y-auto overflow-x-auto pr-1">
              <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-xs">
                    <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2 text-center w-12">Rank</th>
                        <th className="py-3 px-3">Student</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Correct</th>
                        <th className="py-3 px-3 text-center">Accuracy</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {allResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No other participants yet.
                      </td>
                    </tr>
                  ) : (
                    allResults.map((item, idx) => {
                      const isSelf = item.user?._id === currentUser?._id;
                      const rank = idx + 1;
                      const totalAttempts = (item.correctCount || 0) + (item.wrongCount || 0);
                      const accuracy = totalAttempts > 0 
                        ? Math.round((item.correctCount / totalAttempts) * 100) 
                        : 0;

                      return (
                        <tr 
                          key={item._id}
                          className={`transition-colors ${isSelf ? "bg-cyan-50/60 font-semibold" : "hover:bg-slate-50/50"}`}
                        >
                          <td className="py-3.5 px-2 text-center">
                            {rank === 1 ? (
                              <span className="text-base">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-base">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-base">🥉</span>
                            ) : (
                              <span className="text-slate-400 font-medium">{rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelf ? "bg-[#158993] text-white" : "bg-slate-100 text-slate-600"}`}>
                                {item.user?.name ? item.user.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div className="flex flex-col">
                                <span className={isSelf ? "text-[#158993]" : "text-slate-700"}>
                                  {item.user?.name || "Anonymous"}
                                  {isSelf && <span className="ml-2 text-[9px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-full font-bold uppercase">You</span>}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">{item.user?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                            {item.totalScore != null ? Number(Number(item.totalScore).toFixed(2)) : 0}
                          </td>
                          <td className="py-3.5 px-3 text-center text-green-600 font-semibold">
                            {item.correctCount}
                          </td>
                          <td className="py-3.5 px-3 text-center text-slate-500">
                            {accuracy}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLoader>
  );
};

export default QuizResult;
