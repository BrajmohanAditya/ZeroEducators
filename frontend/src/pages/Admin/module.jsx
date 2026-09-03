import React from "react";
import CreateModuleDialog from "../../components/Admin/CreateModuleDialog";
import { useGetSingleCourseHook } from "../../hooks/course.hook";
import { useParams } from "react-router-dom";

const ModulePage = () => {
  const { id } = useParams();

  const { data } = useGetSingleCourseHook(id);

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50">
      {/* Fixed Header Section - Full Width Background */}
      <div className="px-8 py-6 shrink-0 bg-white border-b border-slate-200 z-10 sticky top-0">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {data?.course?.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Total Modules: {data?.course?.modules?.length || 0}</span>
            </div>
          </div>
          <CreateModuleDialog />
        </div>
      </div>

      {/* Scrollable Cards Section */}
      <div className="flex-1 overflow-y-auto px-8 pb-20 pt-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.course?.modules?.map((item, index) => (
              <div
                key={item._id || index}
                className="group bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer hover:border-slate-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-slate-700">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500">Module {index + 1}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePage;
