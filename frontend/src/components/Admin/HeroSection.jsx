import React from "react";
import { CheckCircle, Edit, Trash2, Loader2 } from "lucide-react";

const ExamsTable = ({ examsData, deleteHero, isDeleting }) => {
    const [deletingId, setDeletingId] = React.useState(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-semibold w-24">Logo</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Created</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {examsData?.map((exam) => (
              <tr
                key={exam._id}
                className="hover:bg-slate-50 transition-colors bg-white"
              >
                {/* Logo Column */}
                <td className="p-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                    <img
                      src={exam.imageUrl}
                      alt="Exam Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </td>

                {/* Title Column */}
                <td className="p-4">
                  <p className="font-semibold text-slate-800">
                    {exam.title || "Untitled"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Upcoming Exam</p>
                </td>

                {/* Status Column */}
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Published
                  </span>
                </td>

                {/* Created Column */}
                <td className="p-4 text-sm text-slate-600">
                  {new Date(exam.createdAt || Date.now()).toLocaleDateString()}
                </td>

                {/* Actions Column */}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        deleteHero(exam._id);
                        setDeletingId(exam._id);
                      }}
                      disabled={isDeleting && deletingId === exam._id}
                      className="text-red-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting && deletingId === exam._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Show empty state if no exams exist */}
        {(!examsData || examsData.length === 0) && (
          <div className="p-8 text-center text-slate-500">
            No upcoming exams found. Create one from the "Create" tab.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsTable;

export const BannerTable = ({ bannersData, deleteHero, isDeleting }) => {
  const [deletingId, setDeletingId] = React.useState(null);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-semibold w-24">Image</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Created</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bannersData?.map((banner) => (
              <tr
                key={banner._id}
                className="hover:bg-slate-50 transition-colors bg-white"
              >
                <td className="p-4">
                  <div className="w-16 h-12 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                    <img
                      src={banner.imageUrl}
                      alt="Banner"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </td>

                <td className="p-4">
                  <p className="font-semibold text-slate-800">
                    {banner.title || "Untitled"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Banner Subtitle
                  </p>
                </td>

                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Published
                  </span>
                </td>

                <td className="p-4 text-sm text-slate-600">
                  {new Date(
                    banner.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </td>

                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        deleteHero(banner._id);
                        setDeletingId(banner._id);
                      }}
                      disabled={isDeleting && deletingId === banner._id}
                      className="text-red-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting &&  deletingId === banner._id  ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Show empty state if no banners exist */}
        {(!bannersData || bannersData.length === 0) && (
          <div className="p-8 text-center text-slate-500">
            No banners found. Create one from the "Create" tab.
          </div>
        )}
      </div>
    </div>
  );
};
