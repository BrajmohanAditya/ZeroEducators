import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { useGetSinglePurchasedCourseHook } from "@/hooks/course.hook";

const SinglePurchasedCourse = () => {
  const { id } = useParams();
  const { data } = useGetSinglePurchasedCourseHook(id);

  const [module, setModule] = useState(null);

  const videoHandler = (item) => {
    setModule(item);
  };
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
      {/* Left - Video Player */}


            {/* Left - Video Player */}
      <div className="w-full lg:w-2/3 flex flex-col bg-slate-50 p-6 lg:p-10 relative overflow-hidden">
        
        {/* Soft elegant glows to make it look premium */}
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-blue-400/10 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-3/4 h-3/4 bg-emerald-400/10 blur-[120px] pointer-events-none rounded-full"></div>

        {/* Video Player Container */}
        <div className="flex-1 flex items-center justify-center relative z-10 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-black shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          {module?.Video ? (
            <video
              className="h-full w-full object-contain bg-black"
              src={module.Video}
              controls
              autoPlay
            />
          ) : (
            <div className="text-center flex flex-col items-center justify-center p-12 animate-in fade-in duration-500 bg-white w-full h-full">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-100 shadow-sm">
                <PlayCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Ready to Learn?</h3>
              <p className="text-slate-500 max-w-sm text-sm">
                Select a module from the course content sidebar on the right to start watching.
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Right - Modules List */}
      <div className="w-full lg:w-1/3 bg-white overflow-y-auto border-l border-slate-100 shadow-xl z-20 custom-scrollbar">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Course Content
          </h2>

          <div className="space-y-3">
            {data?.modules?.map((item, index) => (
              <button
                key={item._id || index}
                onClick={() => videoHandler(item)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left
                  ${
                    module?._id === item._id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                  ${module?._id === item._id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold line-clamp-2 ${module?._id === item._id ? "text-emerald-800" : "text-slate-900"}`}
                  >
                    {item.title}
                  </span>
                  {module?._id === item._id && (
                    <span className="text-xs text-emerald-600 font-medium mt-1">
                      Now Playing
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePurchasedCourse;
