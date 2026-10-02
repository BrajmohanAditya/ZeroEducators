import React, { useState, useEffect, useMemo } from "react";
import {
  useGetCourseHook,
  useGetAllPurchasedCourseHook,
} from "../../hooks/course.hook.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  Users,
  Star,
  Zap,
  Search,
  X,
  Sparkles,
  BookOpen,
} from "lucide-react";

const courseSection = () => {
  const { data, error, isLoading } = useGetCourseHook();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: purchasedData } = useGetAllPurchasedCourseHook();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const navigateSinglecourse = (id) => {
    navigate(`/singleCourse/${id}`);
  };

  const allCourses = useMemo(() => {
    if (!data?.courses) return [];
    return data.courses;
  }, [data?.courses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return allCourses;
    const query = searchQuery.toLowerCase().trim();
    return allCourses.filter(
      (course) =>
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
    );
  }, [allCourses, searchQuery]);

  if (isLoading) {
    return (
      <div className="pt-4 pb-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 h-64 rounded-2xl p-6">
                <div className="bg-slate-300 h-48 rounded-xl mb-4"></div>
                <div className="h-6 bg-slate-300 rounded-full mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="courses" className="pt-4 pb-12 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header & Course Search Dropdown */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Featured Programs
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({allCourses.length} Courses Available)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Our Top Courses
            </h2>
          </div>

          {/* Search Box - Direct Filter (No Dropdown) */}
          <div className="relative w-full md:w-[380px]">
            <div className="relative flex items-center bg-white border border-slate-300 hover:border-slate-400 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl shadow-sm transition-all duration-200">
              <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full py-3 pl-3 pr-10 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search filter active badge */}
        {searchQuery.trim() && (
          <div className="mb-6 flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold text-emerald-900">
              Showing {filteredCourses.length} results for <strong className="font-bold">"{searchQuery}"</strong>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCourses.map((item) => (
              <div
                key={item._id}
                className="group flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-xl 
                          hover:-translate-y-2 hover:border-slate-300 transition-all 
                          duration-300 overflow-hidden w-full"
              >
                {/* Thumbnail 16, 9*/}
                <div className="relative mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-[#073b75] to-[#0b5cb8] aspect-video flex items-center justify-center">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/logo3rd.png";
                    }}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                    <Star className="w-4 h-4 text-yellow-500 fill-current inline mr-1" />
                    <span className="text-sm font-bold text-slate-800">
                      {item.rating || (4.5 + Math.random() * 0.5).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/*content*/}
                <div className="flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-slate-700">
                    {item.title}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {item.enrolled || `${(Math.random() + 1).toFixed(1)}k`}{" "}
                        students
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{item.duration || "12 hours"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200">
                    {/* Price Section */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          {item.isFree || Number(item.amount) === 0 ? "Course Fee" : "Starting at"}
                        </p>
                        <div className="flex items-baseline gap-2">
                          {item.isFree || Number(item.amount) === 0 ? (
                            <span className="text-xl font-bold text-emerald-600">FREE</span>
                          ) : (
                            <>
                              <span className="text-xl font-bold text-slate-900">
                                ₹{item.amount !== undefined ? item.amount : "20,000"}
                              </span>
                              <span className="text-sm text-slate-400 line-through">
                                ₹
                                {item.amount !== undefined
                                  ? Math.round(item.amount * 1.25)
                                  : 25000}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Buttons Section */}
                    <div className="w-full">
                      {purchasedData?.purchasedCourse?.some(
                        (pc) => pc._id === item._id,
                      ) ? (
                        <button
                          onClick={() =>
                            navigate(`/SinglePurchasedCourse/${item._id}`)
                          }
                          className="w-full cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={() => navigateSinglecourse(item._id)}
                          className="w-full cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0a66c2] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Zap className="w-4 h-4 fill-current" /> Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No courses match your search "{searchQuery}"
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Try searching with a different course title or clear the filter to see all courses.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
            >
              View All Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default courseSection;
