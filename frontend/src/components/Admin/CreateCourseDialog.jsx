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
import { Loader2, UploadCloud, Gift, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const CreateCourseDialog = ({ editingCourse, onCloseEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);

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
      resetForm({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        amount: isFree ? 0 : editingCourse.amount,
        duration: editingCourse.duration || "",
      });
    } else {
      setIsFreeMode(false);
    }
  }, [editingCourse, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({});
      setIsFreeMode(false);
      if (onCloseEdit) onCloseEdit();
    }
  };

  const handleToggleFreeMode = (free) => {
    setIsFreeMode(free);
    if (free) {
      setValue("amount", 0);
    } else {
      setValue("amount", "");
    }
  };

  const createCourseHandler = (data) => {
    const finalAmount = isFreeMode ? 0 : Number(data.amount);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("amount", finalAmount);
    formData.append("isFree", isFreeMode ? "true" : "false");
    formData.append("duration", data.duration || "");

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

          {/* Price & Duration Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              {isFreeMode ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-lg flex items-center justify-between">
                  <span>FREE</span>
                  <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full font-bold">₹0</span>
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  {...register("amount", { required: !isFreeMode, min: 1 })}
                  placeholder="e.g. 999"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                {...register("duration", { required: true })}
                placeholder="e.g. 6 Months, Lifetime"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

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
