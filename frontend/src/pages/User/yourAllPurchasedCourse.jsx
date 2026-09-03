import { useGetAllPurchasedCourseHook } from "@/hooks/course.hook";
import { BookOpen, Clock, Play, ChevronRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const YourAllPurchasedCourse = () => {
  const { data, isLoading } = useGetAllPurchasedCourseHook();
  const navigate = useNavigate();
  
  const navigateSinglePurchaseCourse = (id) => {
    navigate(`/SinglePurchasedCourse/${id}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-slate-200 rounded-lg animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200"
              >
                <div className="h-48 bg-slate-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Your Courses
          </h1>
          <p className="text-slate-600 text-lg">
            Continue learning from where you left off
          </p>
        </div>

        {/* Empty State */}
        {!data?.purchasedCourse?.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              No courses yet
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start learning today by exploring our course catalog
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            {/* Course Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                {data.purchasedCourse.length}{" "}
                {data.purchasedCourse.length === 1 ? "Course" : "Courses"}
              </p>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.purchasedCourse.map((item, index) => (
                <div
                  key={item._id || index}
                  onClick={() => navigateSinglePurchaseCourse(item._id)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={item.thumbnail}
                      alt={item.title}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                          <Play
                            className="w-7 h-7 text-emerald-600 ml-1"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
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

                    {/* Continue Button */}
                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                      Continue Learning
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YourAllPurchasedCourse;
