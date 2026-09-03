import CreateCourseDialog from "../../components/Admin/CreateCourseDialog";
import { useGetCourseHook, useDeleteCourseHook, useEditCourseHook } from "../../hooks/course.hook";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, BookOpen, Video } from "lucide-react";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { useState } from "react";

const DashboardProducts = () => {
  const { data } = useGetCourseHook();
  const navigate = useNavigate();
  const getCourseId = (id) => {
    navigate(`/admindashboard/module/${id}`);
  };
  const { mutate: deleteCourse, isPending } = useDeleteCourseHook();

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleDelete = (id, title) => {
    setDeleteConfirm({ id, title });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Manage Courses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View, edit, and manage all active courses.
          </p>
        </div>
        <CreateCourseDialog 
          editingCourse={editingCourse}
          onCloseEdit={() => setEditingCourse(null)}
        />
      </div>

      {/* Admin List Section */}
      <div className="w-full max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4 whitespace-nowrap">Course Name</th>
                  <th className="p-4 whitespace-nowrap">Price</th>
                  <th className="p-4 whitespace-nowrap">Students</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.courses?.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-slate-900 line-clamp-1">
                            {item.title}
                          </div>
                          {item.duration && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Duration: {item.duration}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-medium text-slate-700">
                      ₹{item.amount}
                    </td>

                    <td className="p-4 text-slate-600">{item.enrolled || 0}</td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => getCourseId(item._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-transparent"
                          title="Add Video Modules"
                        >
                          <Video className="w-4 h-4" /> Add Video
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(item);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id, item.title);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State Desktop */}
                {(!data?.courses || data.courses.length === 0) && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
                      No courses found. Click "+ Add Course" to create your
                      first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View (Hidden on desktop) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {data?.courses?.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:border-slate-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="font-semibold text-slate-900 text-base leading-tight line-clamp-2">
                    {item.title}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ₹{item.amount}
                    </span>
                    {item.duration && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Stats */}
              <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center text-sm border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Students</span>
                  <span className="font-semibold text-slate-700">
                    {item.enrolled || 0} Enrolled
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-xs">Price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{item.amount}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => getCourseId(item._id)}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                >
                  <Video className="w-4 h-4" /> Video
                </button>
                 <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCourse(item);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item._id, item.title);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}

          {/* Empty State Mobile */}
          {(!data?.courses || data.courses.length === 0) && (
            <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-500 shadow-sm">
              No courses found. Click "+ Add Course" to create your first one!
            </div>
          )}
        </div>
      </div>

      <DeleteAlertbox
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.title}
        isDeleting={isPending}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          // Yahan comma (,) laga kar onSuccess ko andar daalna hai
          deleteCourse(deleteConfirm.id, {
            onSuccess: () => {
              // Jab successfully delete ho jayega, tabhi modal band hoga
              setDeleteConfirm(null);
            },
          });
        }}
      />
    </div>
  );
};

export default DashboardProducts;
