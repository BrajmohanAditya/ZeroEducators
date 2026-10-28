import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useGetExamsHook, useGetMyPurchasedExamsHook } from "@/hooks/quiz/exam.hook";
import PageLoader from "@/components/ui/PageLoader";

const AllMockTests = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch all exams
  const { data: examsData, isLoading: isExamsLoading } = useGetExamsHook();
  const exams = examsData?.exams || [];

  // Fetch purchased exams
  const { data: myPurchasedData, isLoading: isPurchasedLoading } = useGetMyPurchasedExamsHook();
  const purchasedExamIds = (myPurchasedData?.purchasedExamIds || []).map(String);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set(["All"]);
    exams.forEach((exam) => {
      if (exam.category?.trim()) {
        set.add(exam.category.trim());
      }
    });
    return Array.from(set);
  }, [exams]);

  // Filter exams based on search query & selected category
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        (exam.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Unlocked" && purchasedExamIds.includes(String(exam._id))) ||
        exam.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [exams, searchQuery, selectedCategory, purchasedExamIds]);

  const totalTestsCount = useMemo(() => {
    return exams.reduce((acc, curr) => acc + (curr.totalQuizzes || 0), 0);
  }, [exams]);

  if (isExamsLoading || isPurchasedLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Breadcrumb & Hero Header */}
      <div className="bg-gradient-to-b from-emerald-50/60 via-slate-50/40 to-slate-50/70 border-b border-emerald-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold tracking-wide mb-3 shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-emerald-700" />
                PREMIUM TEST SERIES
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                All Mock Test Series
              </h1>
              <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl font-medium">
                Practice curated full-length tests, sectional drills, and previous year papers with instant analysis and all-India ranking.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
              <div className="text-center px-3 border-r border-slate-100">
                <span className="block text-2xl font-black text-emerald-600">
                  {exams.length}
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Packages
                </span>
              </div>
              <div className="text-center px-3">
                <span className="block text-2xl font-black text-slate-800">
                  {totalTestsCount}+
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tests Available
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="mt-8 space-y-4">
            {/* Search Input */}
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by exam name (e.g. JAIIB, UIICL)..."
                className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                  }`}
                >
                  {cat === "All" ? "All Exams" : cat}
                </button>
              ))}

              {purchasedExamIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Unlocked")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === "Unlocked"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  My Unlocked ({purchasedExamIds.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Mock Tests Found</h3>
            <p className="text-slate-500 text-xs font-medium mb-5">
              {searchQuery
                ? `No test packages matched "${searchQuery}". Try different keywords.`
                : "No mock test series are currently available in this category."}
            </p>
            {(searchQuery || selectedCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const isPurchased = purchasedExamIds.includes(String(exam._id));
              const testCount = exam.totalQuizzes || 0;

              return (
                <div
                  key={exam._id}
                  onClick={() => navigate(`/quizeDetail?examId=${exam._id}`)}
                  className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  {/* Top Badge bar */}
                  <div className="flex items-center justify-between mb-4">
                    {isPurchased ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PACKAGE UNLOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-md border border-amber-200/80">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        PREMIUM SERIES
                      </span>
                    )}

                    {exam.category && (
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {exam.category}
                      </span>
                    )}
                  </div>

                  {/* Logo + Title Section */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {exam.logoUrl ? (
                        <img
                          src={exam.logoUrl}
                          alt={exam.title}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <GraduationCap className="w-7 h-7 text-emerald-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                        {exam.description || "Practice full sets, sectionals, and previous year papers."}
                      </p>
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="bg-slate-50/80 rounded-xl p-3 mb-5 space-y-2 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        Total Tests
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {testCount > 0 ? `${testCount} Tests` : "Available Now"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1.5 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Full Length + Sectional
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Detailed Solutions
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      {isPurchased ? (
                        <span className="text-xs font-bold text-emerald-700">
                          Active Access
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-slate-900">
                            {exam.price ? `₹${exam.price}` : "Free Demos"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs group-hover:shadow-md cursor-pointer"
                    >
                      {isPurchased ? "Start Practice" : "Explore Tests"}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMockTests;

