import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAllPurchasedCourseHook } from "@/hooks/course.hook";
import { useGetMyPurchasedExamsHook } from "@/hooks/quiz/exam.hook";
import {
  BookOpen,
  Clock,
  Play,
  ChevronRight,
  GraduationCap,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const YourAllPurchasedCourse = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'courses' | 'exams'

  const { data: coursesData, isLoading: isCoursesLoading } = useGetAllPurchasedCourseHook();
  const { data: examsData, isLoading: isExamsLoading } = useGetMyPurchasedExamsHook();

  const courses = useMemo(() => coursesData?.purchasedCourse || [], [coursesData]);
  const exams = useMemo(() => examsData?.purchasedExams || [], [examsData]);

  const isLoading = isCoursesLoading || isExamsLoading;

  const navigateSinglePurchaseCourse = (id) => {
    navigate(`/SinglePurchasedCourse/${id}`);
  };

  const navigateExamDetail = (examId) => {
    navigate(`/quizeDetail?examId=${examId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
          <div className="h-5 w-80 bg-slate-200 rounded-lg animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <div className="h-44 bg-slate-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalItemsCount = courses.length + exams.length;
  const isAllEmpty = totalItemsCount === 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 select-none">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>MY ENROLLED LEARNING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Your Courses & Tests
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Access all your registered video batches and assigned mock test series
          </p>
        </div>

        {/* Global Empty State */}
        {isAllEmpty ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs max-w-xl mx-auto my-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
              <BookOpen className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No Enrolled Courses or Mocks Yet
            </h2>
            <p className="text-slate-600 text-sm mb-8 leading-relaxed">
              You haven't enrolled in any video courses or mock tests yet. Explore our high-yield banking batches and full-length exam series to kickstart your preparation!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/courses")}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Browse Video Courses
              </button>
              <button
                onClick={() => navigate("/quizeDetail")}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                View Test Series
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Tabs & Count Switcher */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  All Materials
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                    {totalItemsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("courses")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "courses"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Video Courses
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700">
                    {courses.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("exams")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "exams"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  Mock Tests & Series
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700">
                    {exams.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div className="space-y-8">
              {/* 1. COURSES SECTION */}
              {(activeTab === "all" || activeTab === "courses") && courses.length > 0 && (
                <div>
                  {activeTab === "all" && exams.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-lg font-bold text-slate-800">Video Courses</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {courses.length}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map((item, index) => (
                      <div
                        key={item._id || index}
                        onClick={() => navigateSinglePurchaseCourse(item._id)}
                        className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
                      >
                        {/* Thumbnail */}
                        <div>
                          <div className="relative h-44 bg-slate-100 overflow-hidden">
                            <img
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              src={item.thumbnail}
                              alt={item.title}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xs">
                                  <Play
                                    className="w-6 h-6 text-emerald-600 ml-1"
                                    fill="currentColor"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Top Badge */}
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-emerald-400" />
                                Course
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 sm:p-5">
                            <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                              {item.title}
                            </h3>

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                              {item.lessons && (
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>{item.lessons} lessons</span>
                                </div>
                              )}
                              {item.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{item.duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Continue Button */}
                        <div className="p-4 sm:p-5 pt-0">
                          <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer">
                            Continue Learning
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. MOCK TESTS & EXAMS SECTION */}
              {(activeTab === "all" || activeTab === "exams") && exams.length > 0 && (
                <div>
                  {activeTab === "all" && courses.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-200">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-lg font-bold text-slate-800">
                        Enrolled Mock Tests & Test Series
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                        {exams.length}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {exams.map((item, index) => (
                      <div
                        key={item._id || index}
                        onClick={() => navigateExamDetail(item._id)}
                        className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
                      >
                        <div>
                          {/* Exam Card Header / Banner */}
                          <div className="relative h-44 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-4 flex flex-col justify-between overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>

                            {/* Top row badges */}
                            <div className="relative z-10 flex items-center justify-between gap-2">
                              <span className="px-2.5 py-1 bg-indigo-500/30 backdrop-blur-md text-indigo-200 border border-indigo-400/30 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-indigo-300" />
                                Mock Series
                              </span>

                              {item.category && (
                                <span className="px-2 py-0.5 bg-white/15 backdrop-blur-md text-white text-[10px] font-semibold rounded-md border border-white/20">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Center Logo / Icon */}
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-md p-1.5 flex items-center justify-center shrink-0 border border-white/40">
                                {item.logoUrl ? (
                                  <img
                                    src={item.logoUrl}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <GraduationCap className="w-8 h-8 text-indigo-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-indigo-200 font-semibold truncate">
                                  {item.totalQuizzes
                                    ? `${item.totalQuizzes} Mock ${item.totalQuizzes === 1 ? "Test" : "Tests"}`
                                    : "Full Test Series"}
                                </p>
                                <p className="text-[11px] text-slate-300">
                                  Live Exam Interface
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-4 sm:p-5">
                            {/* Origin pill (Linked with Course or Direct) */}
                            {item.accessSource === "course_linked" ? (
                              <div className="mb-2.5 inline-flex items-center gap-1 px-2.5 py-0.8 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-lg text-[11px] font-bold">
                                <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  Included with {item.linkedCourseTitle || "Video Course"}
                                </span>
                              </div>
                            ) : (
                              <div className="mb-2.5 inline-flex items-center gap-1 px-2.5 py-0.8 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Direct Enrolled</span>
                              </div>
                            )}

                            <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                              {item.title}
                            </h3>

                            {item.description ? (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                High-yield mock questions with sectional timings and detailed solutions.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Footer Button */}
                        <div className="p-4 sm:p-5 pt-0">
                          <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer">
                            <span>Attempt Mock Tests</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Empty State when specific tab is active but empty */}
              {activeTab === "courses" && courses.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-6">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    No Video Courses Enrolled
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    You haven't enrolled in any video courses yet.
                  </p>
                  <button
                    onClick={() => navigate("/courses")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Browse Video Courses
                  </button>
                </div>
              )}

              {activeTab === "exams" && exams.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-6">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    No Mock Tests Available
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    You have not been assigned or enrolled in any mock test packages yet.
                  </p>
                  <button
                    onClick={() => navigate("/quizeDetail")}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Explore Test Series
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YourAllPurchasedCourse;
