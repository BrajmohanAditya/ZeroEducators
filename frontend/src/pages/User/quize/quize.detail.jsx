import React, { useState, useMemo } from "react";
import {
  FileText,
  Clock,
  Globe,
  Crown,
  ChevronRight,
  Layers,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  Folder,
  ArrowLeft,
  Brain,
  Calculator,
  Compass,
  Bookmark,
  Zap,
} from "lucide-react";
import { useGetQuizzesHook } from "@/hooks/quiz/quiz.hook";
import { useGetExamsHook, useGetMyPurchasedExamsHook } from "@/hooks/quiz/exam.hook";
import { useExamPaymentHook } from "@/hooks/payment.hook";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetMyQuizResultsHook } from "@/hooks/quiz/quizResult.hook.js";
import { useUserStore } from "@/store/user.store";
import { toast } from "sonner";
import PageLoader from "@/components/ui/PageLoader";

const QuizeDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedExamId = searchParams.get("examId"); // Exam ID if filtered

  const { user } = useUserStore();
  const navigate = useNavigate();

  // Tab State: "Mock Tests" | "PYPs"
  const [activeMainTab, setActiveMainTab] = useState("Mock Tests");
  // Active Folder State: null (shows folder list) | string (e.g. "Full Test (Prelims)")
  const [activeFolder, setActiveFolder] = useState(null);

  // Fetch all exams for filter pills
  const { data: examsData, isLoading: isExamsLoading } = useGetExamsHook();
  const exams = examsData?.exams || [];

  // Fetch user's purchased exams
  const { data: myPurchasedData } = useGetMyPurchasedExamsHook();
  const purchasedExamIds = myPurchasedData?.purchasedExamIds || [];

  const { mutate: purchaseExam, isPending: isPurchasingExam } = useExamPaymentHook();

  const handlePurchase = (examId) => {
    if (!user) {
      toast.error("Please login to unlock this exam package");
      navigate("/login");
      return;
    }
    if (!examId) {
      toast.error("Invalid exam selected");
      return;
    }
    purchaseExam({ examId });
  };

  // If no examId in URL, default to first exam once loaded
  const currentExamId = selectedExamId || (exams.length > 0 ? exams[0]._id : null);
  const currentExam = exams.find((e) => String(e._id) === String(currentExamId));

  // Fetch all quizzes for current exam
  const queryParams = currentExamId ? { examId: currentExamId } : {};
  const { data, isLoading, isError } = useGetQuizzesHook(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );

  const { data: myResultsData } = useGetMyQuizResultsHook();
  const loading = isLoading || isExamsLoading;

  const completedQuizIds =
    myResultsData?.results?.map((result) => result.quiz?._id || result.quiz) || [];

  const quizzes = data?.quizzes || [];

  const handleSelectExam = (examId) => {
    setActiveFolder(null);
    const newParams = new URLSearchParams(searchParams);
    if (!examId) {
      newParams.delete("examId");
    } else {
      newParams.set("examId", examId);
    }
    setSearchParams(newParams);
  };

  const isCurrentExamPurchased = Boolean(
    currentExamId && purchasedExamIds.map(String).includes(String(currentExamId))
  );

  // Filter quizzes by activeMainTab ("Mock Tests" vs "PYPs")
  const quizzesInCurrentTab = useMemo(() => {
    return quizzes.filter((q) => {
      const qTab = q.testType || "Mock Tests";
      return qTab === activeMainTab;
    });
  }, [quizzes, activeMainTab]);

  // Group by subCategory / folder
  const categoryFolders = useMemo(() => {
    const map = new Map();

    quizzesInCurrentTab.forEach((q) => {
      const folderName = q.subCategory?.trim() || "Full Test (Prelims)";
      if (!map.has(folderName)) {
        map.set(folderName, {
          name: folderName,
          tests: [],
          freeCount: 0,
        });
      }
      const entry = map.get(folderName);
      entry.tests.push(q);
      if (q.isFreeDemo || q.quizType === "Free") {
        entry.freeCount += 1;
      }
    });

    return Array.from(map.values());
  }, [quizzesInCurrentTab]);

  // Filter quizzes for the active folder (when drill-down is active)
  const currentFolderQuizzes = useMemo(() => {
    if (!activeFolder) return [];
    return quizzesInCurrentTab.filter(
      (q) => (q.subCategory?.trim() || "Full Test (Prelims)") === activeFolder
    );
  }, [quizzesInCurrentTab, activeFolder]);

  // Helper for folder icon & colors
  const getFolderMeta = (folderName) => {
    const lower = folderName.toLowerCase();
    if (lower.includes("live")) {
      return {
        icon: (
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute w-4 h-4 bg-red-400 rounded-full animate-ping opacity-75"></span>
            <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </div>
        ),
        accent: "text-red-600 bg-red-50 border-red-200",
      };
    }
    if (lower.includes("saved") || lower.includes("bookmark")) {
      return {
        icon: <Bookmark className="w-4 h-4 text-amber-500" />,
        accent: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }
    if (lower.includes("reasoning")) {
      return {
        icon: <Brain className="w-4 h-4 text-purple-600" />,
        accent: "text-purple-700 bg-purple-50 border-purple-200",
      };
    }
    if (lower.includes("numerical") || lower.includes("math") || lower.includes("quant")) {
      return {
        icon: <Calculator className="w-4 h-4 text-blue-600" />,
        accent: "text-blue-700 bg-blue-50 border-blue-200",
      };
    }
    if (lower.includes("english")) {
      return {
        icon: <Globe className="w-4 h-4 text-teal-600" />,
        accent: "text-teal-700 bg-teal-50 border-teal-200",
      };
    }
    if (lower.includes("general") || lower.includes("awareness") || lower.includes("ca")) {
      return {
        icon: <Compass className="w-4 h-4 text-indigo-600" />,
        accent: "text-indigo-700 bg-indigo-50 border-indigo-200",
      };
    }
    if (lower.includes("mains")) {
      return {
        icon: <Zap className="w-4 h-4 text-orange-600" />,
        accent: "text-orange-700 bg-orange-50 border-orange-200",
      };
    }
    return {
      icon: <Folder className="w-4 h-4 text-emerald-600" />,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  };

  return (
    <PageLoader isLoading={loading} isError={isError}>
      <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)] bg-[#f8fafc] flex-1">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Top Banner / Selection Sale Bar */}
          {currentExam && (
            <div className="w-full">
              {currentExam.price > 0 && !isCurrentExamPurchased ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                      <Crown className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          Selection Sale
                        </span>
                        <h2 className="text-base sm:text-lg font-black tracking-tight">
                          {currentExam.title} Full Test Series
                        </h2>
                      </div>
                      <p className="text-xs text-rose-100 mt-0.5">
                        Unlock all mock tests, sectional tests, and previous year papers.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(currentExamId)}
                    disabled={isPurchasingExam}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition shadow-md shadow-amber-900/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>{isPurchasingExam ? "Opening..." : `₹${currentExam.price} Unlock Now`}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {currentExam.logoUrl && (
                      <img
                        src={currentExam.logoUrl}
                        alt={currentExam.title}
                        className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 p-1 shrink-0"
                      />
                    )}
                    <div>
                      <h1 className="text-lg sm:text-xl font-black text-slate-900">
                        {currentExam.title}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Practice full sets, sectionals, and previous year question papers.
                      </p>
                    </div>
                  </div>
                  {isCurrentExamPurchased && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Package Unlocked
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Main Container Card (Photo Structure: Mock Tests | PYPs) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Top Navigation Tabs: Mock Tests vs PYPs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("Mock Tests");
                  setActiveFolder(null);
                }}
                className={`flex-1 py-3.5 px-4 text-center text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
                  activeMainTab === "Mock Tests"
                    ? "border-emerald-600 text-emerald-700 bg-white shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <span>Mock Tests</span>
                {activeMainTab === "Mock Tests" && quizzesInCurrentTab.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {quizzesInCurrentTab.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("PYPs");
                  setActiveFolder(null);
                }}
                className={`flex-1 py-3.5 px-4 text-center text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
                  activeMainTab === "PYPs"
                    ? "border-emerald-600 text-emerald-700 bg-white shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <span>PYPs (Previous Year Papers)</span>
                {activeMainTab === "PYPs" && quizzesInCurrentTab.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {quizzesInCurrentTab.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6">
              {/* VIEW A: Sub-Category / Folder List View (Matches User Photo) */}
              {!activeFolder ? (
                <div>
                  {categoryFolders.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Folder className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        No {activeMainTab} Available Yet
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Is exam ke liye abhi {activeMainTab} upload nahi hue hain. Please select another exam or check back soon!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {categoryFolders.map((folder, idx) => {
                        const meta = getFolderMeta(folder.name);
                        return (
                          <div
                            key={folder.name || idx}
                            onClick={() => setActiveFolder(folder.name)}
                            className="flex items-center justify-between py-4 px-3 sm:px-4 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.accent}`}
                              >
                                {meta.icon}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-emerald-700 transition">
                                    <span className="text-emerald-600 font-black mr-1.5">
                                      {folder.tests.length}
                                    </span>
                                    {folder.name}
                                  </span>

                                  {folder.freeCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                      {folder.freeCount} Free
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400">
                                  {folder.tests.length === 1 ? "1 Test available" : `${folder.tests.length} Tests available`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition">
                              <span className="text-xs font-bold hidden sm:inline">Explore</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* VIEW B: Drill-Down Test Sets View (Inside Selected Folder) */
                <div>
                  {/* Folder Breadcrumb & Back Button */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveFolder(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>All Sections</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">/</span>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                          {activeFolder}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                          {currentFolderQuizzes.length} Tests
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quizzes Grid inside this Folder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFolderQuizzes.map((test) => {
                      const isCompleted = completedQuizIds.includes(test._id);
                      const examObj = test.examId || currentExam;
                      const examPrice = examObj?.price ?? test.price ?? 0;
                      const isExamPaid = examPrice > 0;
                      const isFreeDemo = Boolean(test.isFreeDemo || test.quizType === "Free");
                      const isUserOwned = Boolean(
                        currentExamId && purchasedExamIds.map(String).includes(String(currentExamId))
                      );

                      return (
                        <div
                          key={test._id}
                          className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                        >
                          <div className="p-4 sm:p-5">
                            {/* Badges Row */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div>
                                {isFreeDemo ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    FREE DEMO
                                  </span>
                                ) : isUserOwned ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    UNLOCKED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    PREMIUM
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {test.subCategory || "Mock Test"}
                              </span>
                            </div>

                            {/* Quiz Name */}
                            <h3 className="text-base font-bold text-slate-900 leading-snug mb-3">
                              {test.quizName}
                            </h3>

                            {/* Test Details */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.totalNoOfQueation} Qs</span>
                              <span className="text-slate-300">|</span>
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{test.duration} Mins</span>
                              <span className="text-slate-300">|</span>
                              <span>{test.totalMarks} Marks</span>
                            </div>

                            {/* Action Buttons */}
                            {isCompleted ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/quiz-result/${test._id}`)}
                                  className="flex-1 py-2 px-3 rounded-lg text-white text-xs font-bold transition shadow-xs bg-[#158993] hover:bg-teal-700 cursor-pointer text-center"
                                >
                                  View Result
                                </button>
                                <button
                                  onClick={() => navigate(`/quizeInterface/${test._id}`)}
                                  className="flex-1 py-2 px-3 rounded-lg text-[#158993] text-xs font-bold transition shadow-xs border border-[#158993] hover:bg-teal-50 cursor-pointer text-center"
                                >
                                  Show Solution
                                </button>
                              </div>
                            ) : isFreeDemo || isUserOwned || !isExamPaid ? (
                              <button
                                onClick={() => navigate(`/quizeInterface/${test._id}`)}
                                disabled={test.isLocked}
                                className={`w-full py-2.5 px-3 rounded-lg text-white text-xs font-bold transition-all shadow-xs ${
                                  test.isLocked
                                    ? "bg-slate-300 cursor-not-allowed opacity-75"
                                    : isFreeDemo
                                    ? "bg-[#00c2e0] hover:bg-[#00a8c2] hover:shadow-md cursor-pointer"
                                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md cursor-pointer"
                                }`}
                              >
                                {test.isLocked
                                  ? "Locked"
                                  : isFreeDemo
                                  ? "Start Free Demo"
                                  : "Start Now"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchase(currentExamId)}
                                disabled={isPurchasingExam}
                                className="w-full py-2.5 px-3 rounded-lg text-white text-xs font-extrabold transition-all shadow-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <LockKeyhole className="w-3.5 h-3.5" />
                                {isPurchasingExam ? "Opening..." : `Unlock Exam (₹${examPrice})`}
                              </button>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="text-[11px] font-medium text-[#158993]">
                              English, Hindi
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {test.negativeMark ? `-${test.negativeMark} Neg.` : "No Neg."}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLoader>
  );
};

export default QuizeDetail;
