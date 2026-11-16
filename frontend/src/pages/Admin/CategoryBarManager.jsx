import React, { useState, useMemo } from "react";
import {
  useGetAllCategoryBarsAdminHook,
  useCreateCategoryBarHook,
  useUpdateCategoryBarHook,
  useDeleteCategoryBarHook,
} from "@/hooks/categoryBar.hook";
import { useGetCourseHook } from "@/hooks/course.hook";
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  Search,
  Check,
  CheckSquare,
  Square,
  Loader2,
  Video,
  FileText,
  Eye,
  EyeOff,
  ArrowUpDown,
  Sparkles,
  X,
  BookOpen,
} from "lucide-react";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";

const CategoryBarManager = () => {
  const { data: catData, isLoading: isCatLoading } = useGetAllCategoryBarsAdminHook();
  const { data: coursesData, isLoading: isCoursesLoading } = useGetCourseHook();

  const categories = catData?.categories || [];
  const allCourses = useMemo(() => {
    return coursesData?.courses || coursesData?.course || [];
  }, [coursesData]);

  const { mutate: createCategory, isPending: isCreating } = useCreateCategoryBarHook();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategoryBarHook();
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategoryBarHook();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filtered courses for the selection box inside modal
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return allCourses;
    const q = courseSearch.toLowerCase();
    return allCourses.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [allCourses, courseSearch]);

  const handleToggleCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredCourses.map((c) => c._id);
    setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleDeselectAll = () => {
    setSelectedCourseIds([]);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setOrder(categories.length);
    setIsActive(true);
    setSelectedCourseIds([]);
    setCourseSearch("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setTitle(cat.title || "");
    setOrder(cat.order ?? 0);
    setIsActive(cat.isActive !== false);
    const existingIds = (cat.courses || []).map((c) =>
      typeof c === "object" ? c._id : c
    );
    setSelectedCourseIds(existingIds);
    setCourseSearch("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      order: Number(order) || 0,
      isActive,
      courses: selectedCourseIds,
    };

    if (editingId) {
      updateCategory(
        { id: editingId, data: payload },
        {
          onSuccess: () => handleCloseModal(),
        }
      );
    } else {
      createCategory(payload, {
        onSuccess: () => handleCloseModal(),
      });
    }
  };

  const isSaving = isCreating || isUpdating;

  // Total courses attached across all categories
  const totalCoursesAttached = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.courses?.length || 0), 0);
  }, [categories]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Title and "+ Add New Category" Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#073b75] flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <span>Category Bar Manager</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage navigation category buttons (e.g. JAIIB, IBPS, SBI) and assign courses to their dropdowns.
          </p>
        </div>

        {/* Trigger Button to Open Modal */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#073b75] hover:bg-[#0b5cb8] text-white font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#073b75] flex items-center justify-center font-bold text-xl">
            {categories.length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Categories</p>
            <p className="text-lg font-extrabold text-slate-900">{categories.length} Items</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            {categories.filter((c) => c.isActive).length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active on Website</p>
            <p className="text-lg font-extrabold text-slate-900">
              {categories.filter((c) => c.isActive).length} Visible
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            {totalCoursesAttached}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Attached Courses</p>
            <p className="text-lg font-extrabold text-slate-900">{totalCoursesAttached} Courses Linked</p>
          </div>
        </div>
      </div>

      {/* Category List Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Live Category Bifurcations ({categories.length})
          </h2>
          <span className="text-xs text-slate-400">Sorted by Display Order</span>
        </div>

        {isCatLoading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#073b75]" /> Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">No categories created yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click the "+ Add New Category" button above to create your first category.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#073b75] text-white text-xs font-bold hover:bg-[#0b5cb8] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, idx) => {
              const count = (cat.courses || []).length;

              return (
                <div
                  key={cat._id}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 transition-all shadow-2xs hover:shadow-md space-y-3.5 flex flex-col justify-between"
                >
                  {/* Top Bar: Title, Order, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-white text-[#073b75] border border-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        #{cat.order ?? idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {cat.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              cat.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {cat.isActive ? "Active" : "Hidden"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {count} {count === 1 ? "Course" : "Courses"} attached
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(cat)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Attached Courses Chips */}
                  <div className="pt-2 border-t border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Included in Dropdown:
                    </p>
                    {count === 0 ? (
                      <span className="text-xs text-slate-400 italic">No courses attached</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                        {cat.courses.slice(0, 6).map((course) => {
                          const courseTitle =
                            typeof course === "object" ? course.title : "Course";
                          return (
                            <span
                              key={typeof course === "object" ? course._id : course}
                              className="text-[11px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[190px]"
                              title={courseTitle}
                            >
                              {courseTitle}
                            </span>
                          );
                        })}
                        {count > 6 && (
                          <span className="text-[11px] font-bold text-slate-500 self-center pl-1">
                            +{count - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP / MODAL: ADD / EDIT CATEGORY                                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#073b75] text-white flex items-center justify-center font-bold">
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {editingId ? "Edit Category" : "Add New Category"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingId
                      ? "Update category title, display order, or attached courses."
                      : "Create a new dropdown button on the homepage bifurcation bar."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Category Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JAIIB / CAIIB, IBPS, SBI Special"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#073b75] focus:border-transparent font-medium"
                />
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#073b75]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Course Selection Area */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Included Courses
                  </label>
                  <span className="text-[11px] font-bold text-[#073b75] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {selectedCourseIds.length} Selected
                  </span>
                </div>

                {/* Search filter input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search available courses..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#073b75]"
                  />
                </div>

                {/* Quick actions: Select All / Deselect All */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2 px-1">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="hover:text-[#073b75] underline cursor-pointer"
                  >
                    Select All Listed ({filteredCourses.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="hover:text-red-600 underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>

                {/* Checkbox List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/60 custom-scrollbar">
                  {isCoursesLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#073b75]" /> Loading courses...
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No courses found matching "{courseSearch}"
                    </div>
                  ) : (
                    filteredCourses.map((c) => {
                      const isChecked = selectedCourseIds.includes(c._id);
                      const isPdf = c.courseType === "pdf";
                      const isBundle = c.isBundle;

                      return (
                        <div
                          key={c._id}
                          onClick={() => handleToggleCourse(c._id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all text-left border ${
                            isChecked
                              ? "bg-blue-50 border-blue-300 text-slate-900 shadow-2xs"
                              : "hover:bg-white border-transparent text-slate-700"
                          }`}
                        >
                          <div className="mt-0.5 text-slate-400">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#073b75]" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold leading-tight line-clamp-1">
                              {c.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                              <span className="uppercase font-semibold text-slate-500">
                                {isBundle ? "Bundle" : isPdf ? "PDF" : "Video"}
                              </span>
                              {c.amount > 0 && (
                                <span className="font-bold text-emerald-600">• ₹{c.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer (Cancel & Submit) */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="py-2 px-5 rounded-xl bg-[#073b75] hover:bg-[#0b5cb8] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Update Category
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Save Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteTarget && (
        <DeleteAlertbox
          isOpen={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteCategory(deleteTarget._id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }}
          isDeleting={isDeleting}
          itemName={`Category: "${deleteTarget.title}"`}
        />
      )}
    </div>
  );
};

export default CategoryBarManager;
