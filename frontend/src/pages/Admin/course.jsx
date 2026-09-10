import CreateCourseDialog from "../../components/Admin/CreateCourseDialog";
import GrantCourseAccessDialog from "../../components/Admin/GrantCourseAccessDialog";
import CopyCourseDialog from "../../components/Admin/CopyCourseDialog";
import { useGetCourseHook, useDeleteCourseHook, useEditCourseHook } from "../../hooks/course.hook";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, BookOpen, Video, FileText, UserPlus, Users, Copy } from "lucide-react";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { useState } from "react";

const DashboardProducts = () => {
  const { data } = useGetCourseHook();
  const navigate = useNavigate();
  const getCourseId = (course) => {
    navigate(`/admindashboard/course-topics/${course._id}`);
  };
  const { mutate: deleteCourse, isPending } = useDeleteCourseHook();

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [accessDialog, setAccessDialog] = useState(null); // { course, tab: 'grant' | 'students' }
  const [copyDialogState, setCopyDialogState] = useState({ isOpen: false, course: null });

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
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setCopyDialogState({
                isOpen: true,
                course: data?.courses?.[0] || null,
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Course
          </button>
          <button
            onClick={() =>
              setAccessDialog({
                course: data?.courses?.[0] || null,
                tab: "grant",
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Grant Course Access
          </button>
          <CreateCourseDialog 
            editingCourse={editingCourse}
            onCloseEdit={() => setEditingCourse(null)}
          />
        </div>
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
                      {item.isFree || Number(item.amount) === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          FREE
                        </span>
                      ) : item.pricingPlans && item.pricingPlans.length > 1 ? (
                        <div>
                          <span className="font-bold text-slate-900">₹{item.pricingPlans[0].price}</span>
                          <span className="text-[11px] text-blue-600 block font-semibold">
                            {item.pricingPlans.length} Plans
                          </span>
                        </div>
                      ) : (
                        `₹${item.amount}`
                      )}
                    </td>

                    <td className="p-4 text-slate-600">
                      <button
                        onClick={() => setAccessDialog({ course: item, tab: "students" })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition cursor-pointer"
                        title="View Enrolled Students"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        {item.enrolled || 0} Students
                      </button>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccessDialog({ course: item, tab: "grant" });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                          title="Grant access to a student"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Grant
                        </button>
                        {item.courseType === "pdf" ? (
                          <button
                            onClick={() => getCourseId(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-transparent cursor-pointer"
                            title="Manage Topics & PDFs"
                          >
                            <FileText className="w-4 h-4" /> Topics & PDFs
                          </button>
                        ) : (
                          <button
                            onClick={() => getCourseId(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-transparent cursor-pointer"
                            title="Manage Topics & Videos"
                          >
                            <Video className="w-4 h-4" /> Topics & Videos
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyDialogState({ isOpen: true, course: item });
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Copy / Duplicate Course"
                        >
                          <Copy className="w-4 h-4" />
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
                    {item.isFree || Number(item.amount) === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        FREE
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        ₹{item.amount}
                      </span>
                    )}
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
                <button
                  type="button"
                  onClick={() => setAccessDialog({ course: item, tab: "students" })}
                  className="flex flex-col text-left cursor-pointer"
                >
                  <span className="text-slate-500 text-xs">Students</span>
                  <span className="font-semibold text-emerald-700 text-xs inline-flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    {item.enrolled || 0} Enrolled
                  </span>
                </button>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-xs">Price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{item.amount}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccessDialog({ course: item, tab: "grant" });
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Grant Access
                  </button>

                  {item.courseType === "pdf" ? (
                    <button
                      onClick={() => getCourseId(item)}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Topics & PDFs
                    </button>
                  ) : (
                    <button
                      onClick={() => getCourseId(item)}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" /> Topics & Videos
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopyDialogState({ isOpen: true, course: item });
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCourse(item);
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id, item.title);
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
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

      {/* Grant Access & Enrolled Students Dialog */}
      {accessDialog && (
        <GrantCourseAccessDialog
          isOpen={Boolean(accessDialog)}
          onClose={() => setAccessDialog(null)}
          course={accessDialog.course}
          allCourses={data?.courses || []}
          initialTab={accessDialog.tab || "grant"}
        />
      )}

      {/* Copy Course Dialog */}
      <CopyCourseDialog
        isOpen={copyDialogState.isOpen}
        onClose={() => setCopyDialogState({ isOpen: false, course: null })}
        initialCourse={copyDialogState.course}
      />

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
