import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateCourseHook, useEditCourseHook } from "../../hooks/course.hook";
import { Loader2, UploadCloud, Gift, CreditCard, Sparkles, Video, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const CreateCourseDialog = ({ editingCourse, onCloseEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [courseType, setCourseType] = useState("video");
  const [pricingPlans, setPricingPlans] = useState([
    { duration: "6 Months", price: "999", label: "" },
  ]);

  const { register, handleSubmit, reset: resetForm, watch, setValue } = useForm({
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      duration: "",
    },
  });

  const { mutate: createCourse, isPending: isCreating } = useCreateCourseHook();
  const { mutate: editCourse, isPending: isEditing } = useEditCourseHook();

  const isPending = isCreating || isEditing;
  const thumbnail = watch("thumbnail");

  useEffect(() => {
    if (editingCourse) {
      setIsOpen(true);
      const isFree = editingCourse.isFree || Number(editingCourse.amount) === 0;
      setIsFreeMode(isFree);
      setCourseType(editingCourse.courseType || "video");

      if (editingCourse.pricingPlans && editingCourse.pricingPlans.length > 0) {
        setPricingPlans(
          editingCourse.pricingPlans.map((p) => ({
            duration: p.duration,
            price: String(p.price),
            label: p.label || "",
          }))
        );
      } else if (!isFree && editingCourse.amount) {
        setPricingPlans([
          {
            duration: editingCourse.duration || "6 Months",
            price: String(editingCourse.amount),
            label: "",
          },
        ]);
      } else {
        setPricingPlans([{ duration: "6 Months", price: "999", label: "" }]);
      }

      resetForm({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        amount: isFree ? 0 : editingCourse.amount,
        duration: editingCourse.duration || "",
      });
    } else {
      setIsFreeMode(false);
      setCourseType("video");
      setPricingPlans([{ duration: "6 Months", price: "999", label: "" }]);
    }
  }, [editingCourse, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({});
      setIsFreeMode(false);
      setPricingPlans([{ duration: "6 Months", price: "999", label: "" }]);
      if (onCloseEdit) onCloseEdit();
    }
  };

  const handleToggleFreeMode = (free) => {
    setIsFreeMode(free);
  };

  const addPricingPlan = () => {
    setPricingPlans((prev) => [...prev, { duration: "", price: "", label: "" }]);
  };

  const removePricingPlan = (index) => {
    if (pricingPlans.length <= 1) return;
    setPricingPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePricingPlan = (index, field, value) => {
    setPricingPlans((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const createCourseHandler = (data) => {
    const validPlans = pricingPlans
      .filter((p) => p.duration && p.price !== "" && p.price !== undefined)
      .map((p) => ({
        duration: p.duration.trim(),
        price: Number(p.price),
        label: p.label ? p.label.trim() : "",
      }));

    if (!isFreeMode && validPlans.length === 0) {
      toast.error("Please add at least one valid pricing plan with duration and price");
      return;
    }

    const finalAmount = isFreeMode
      ? 0
      : validPlans.length > 0
      ? validPlans[0].price
      : Number(data.amount || 0);

    const finalDuration = isFreeMode
      ? "Lifetime"
      : validPlans.length > 0
      ? validPlans.map((p) => p.duration).join(" / ")
      : data.duration || "";

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("amount", finalAmount);
    formData.append("isFree", isFreeMode ? "true" : "false");
    formData.append("duration", finalDuration);
    formData.append("courseType", courseType);

    if (!isFreeMode && validPlans.length > 0) {
      formData.append("pricingPlans", JSON.stringify(validPlans));
    } else if (isFreeMode) {
      formData.append("pricingPlans", JSON.stringify([]));
    }

    if (data.thumbnail && data.thumbnail[0]) {
      formData.append("thumbnail", data.thumbnail[0]);
    }

    if (editingCourse) {
      editCourse(
        { courseId: editingCourse._id, formData },
        {
          onSuccess: (res) => {
            handleOpenChange(false);
          },
        }
      );
    } else {
      createCourse(formData, {
        onSuccess: (res) => {
          toast.success(res.message || "Course created successfully");
          handleOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-1.5 text-sm"
        disabled={isPending}
        onClick={() => {
          resetForm({});
          setIsFreeMode(false);
          if (onCloseEdit) onCloseEdit();
        }}
      >
        + Add Course
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            {editingCourse ? "Edit Course" : "Create New Course"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Set course details, duration, pricing type (Free or Paid), and cover image.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-3 space-y-4 text-left"
          onSubmit={handleSubmit(createCourseHandler)}
        >
          {/* Course Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", { required: true })}
              placeholder="e.g. Complete Banking Foundation Batch 2026"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", { required: true })}
              placeholder="Detailed overview of what students will learn in this course..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Course Content Type: Video vs PDF */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Content Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourseType("video")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  courseType === "video"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Course</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseType("pdf")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  courseType === "pdf"
                    ? "border-purple-600 bg-purple-50/70 text-purple-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PDF Course (Notes)</span>
              </button>
            </div>
          </div>

          {/* Free vs Paid Toggle Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Pricing Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleFreeMode(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  !isFreeMode
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Paid Course</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleFreeMode(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  isFreeMode
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Free Course (₹0)</span>
              </button>
            </div>
          </div>

          {/* Pricing & Validity Section */}
          {isFreeMode ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800">FREE COURSE</p>
                <p className="text-[11px] text-emerald-600">Students can enroll directly at no cost.</p>
              </div>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-black px-2.5 py-1 rounded-full">
                ₹0 / Free
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pricing & Validity Plans <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Add multiple options (e.g. 6 Months ₹999, 12 Months ₹10,000)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPricingPlan}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {pricingPlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span>Plan Option {idx + 1}</span>
                      </span>
                      {pricingPlans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePricingPlan(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Validity / Duration *
                        </label>
                        <input
                          type="text"
                          required
                          value={plan.duration}
                          onChange={(e) =>
                            updatePricingPlan(idx, "duration", e.target.value)
                          }
                          placeholder="e.g. 6 Months, 1 Year"
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={plan.price}
                          onChange={(e) =>
                            updatePricingPlan(idx, "price", e.target.value)
                          }
                          placeholder="e.g. 999"
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modern Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Thumbnail
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors overflow-hidden">
              {thumbnail && thumbnail.length > 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50/50 p-2 text-center">
                  <p className="text-xs font-bold text-blue-700 mb-1">
                    Thumbnail Selected! 🎉
                  </p>
                  <p className="text-[11px] text-blue-600 truncate max-w-[85%] px-3 py-1 bg-blue-100 rounded-full font-medium">
                    {thumbnail[0].name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <UploadCloud className="w-6 h-6 mb-1.5 text-slate-400" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Click to upload course thumbnail
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Recommended: 16:9 (e.g. 1280x720)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                {...register("thumbnail", { required: !editingCourse })}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : editingCourse ? (
                "Update Course"
              ) : (
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
