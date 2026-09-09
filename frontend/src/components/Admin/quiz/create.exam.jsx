import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateExamHook, useUpdateExamHook } from "../../../hooks/quiz/exam.hook.js";

const CreateExamDialog = ({ children, exam, onCloseEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!exam;

  const { mutate: createExam, isPending: isCreating } = useCreateExamHook();
  const { mutate: updateExam, isPending: isUpdating } = useUpdateExamHook();
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: "",
      category: "",
      price: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (exam) {
      setIsOpen(true);
      reset({
        title: exam.title || "",
        category: exam.category || "",
        price: exam.price !== undefined ? exam.price : 0,
        description: exam.description || "",
      });
    }
  }, [exam, reset]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      reset({
        title: "",
        category: "",
        price: 0,
        description: "",
      });
      if (onCloseEdit) onCloseEdit();
    }
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.category) formData.append("category", data.category);
    formData.append("price", Math.max(0, Number(data.price) || 0));
    if (data.description) formData.append("description", data.description);

    if (data.logo && data.logo[0]) {
      formData.append("logo", data.logo[0]);
    }

    if (isEditMode) {
      updateExam(
        { id: exam._id, payload: formData },
        {
          onSuccess: () => {
            handleOpenChange(false);
          },
        }
      );
    } else {
      createExam(formData, {
        onSuccess: () => {
          handleOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {isEditMode ? "Edit Exam" : "Create New Exam"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {isEditMode
              ? "Update exam category details and logo."
              : "Add an exam category (e.g. SSC CGL, Banking, Railway) under which you can add multiple quizzes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", { required: true })}
              placeholder="e.g. SSC CGL, IBPS PO, Railway NTPC"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <input
              {...register("category")}
              placeholder="e.g. Banking, SSC, Railway, UPSC"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Exam Price (₹) <span className="text-xs font-normal text-slate-400">(0 = Free)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...register("price", { min: 0 })}
                placeholder="0 (Free)"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Exam Logo / Icon{" "}
              <span className="text-xs font-normal text-slate-400">
                {isEditMode ? "(Leave empty to keep current)" : "(Recommended)"}
              </span>
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              {...register("logo")}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Brief overview of this exam or test series..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                "Update Exam"
              ) : (
                "Create Exam"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;
