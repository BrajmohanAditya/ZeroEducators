import React from "react";
import {
  useGetCourseHook,
  useGetAllPurchasedCourseHook,
} from "../../hooks/course.hook.js";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Star, ArrowRight, Zap, MessageSquare } from "lucide-react";

const courseSection = () => {
  const { data, error, isLoading } = useGetCourseHook();
  const navigate = useNavigate();
  const { data: purchasedData } = useGetAllPurchasedCourseHook();

  const navigateSinglecourse = (id) => {
    navigate(`/singleCourse/${id}`);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data?.courses?.map((item) => (
            <div
              key={item._id}
              className="group flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-xl 
                        hover:-translate-y-2 hover:border-slate-300 transition-all 
                        duration-300 overflow-hidden w-full"
            >
              {/* Thumbnail 16, 9*/}
              <div className="relative mb-6 rounded-xl overflow-hidden bg-slate-900 aspect-video">
                <img
                  src={item.thumbnail}
                  alt={item.title}
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

                  {/* Highlights Badges */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/80 border border-blue-100 rounded-lg text-xs font-semibold text-blue-800 shadow-sm w-fit">
                      <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-100 animate-pulse" />
                      <span>20 Online & 20 Offline Mocks + Daily Live Test</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50/80 border border-purple-100 rounded-lg text-xs font-semibold text-purple-800 shadow-sm w-fit">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600 fill-purple-100" />
                      <span>30 Min Spoken English Session</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-200">
                  {/* Price Section */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Starting at</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900">
                          ₹{item.amount !== undefined ? item.amount : "20,000"}
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          ₹
                          {item.amount !== undefined
                            ? Math.round(item.amount * 1.25)
                            : 25000}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons Section */}
                  <div className="flex items-center gap-3">
                    <button className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-3 py-2.5 border-2 border-[#0a66c2] text-[#0a66c2] text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors">
                      Details <ArrowRight className="w-4 h-4" />
                    </button>

                    {purchasedData?.purchasedCourse?.some(
                      (pc) => pc._id === item._id,
                    ) ? (
                      <button
                        onClick={() =>
                          navigate(`/SinglePurchasedCourse/${item._id}`)
                        }
                        className="flex-[1.2] cursor-pointer flex items-center justify-center gap-1 px-3 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateSinglecourse(item._id)}
                        className="flex-[1.2] cursor-pointer flex items-center justify-center gap-1 px-3 py-2.5 bg-[#0a66c2] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
      </div>
    </div>
  );
};

export default courseSection;
