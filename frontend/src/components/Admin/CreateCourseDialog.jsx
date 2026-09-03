import React, { useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateCourseHook, useEditCourseHook } from "../../hooks/course.hook";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const CreateCourseDialog = ({ editingCourse, onCloseEdit }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, reset: resetForm, watch } = useForm();
  const { mutate: createCourse, isPending: isCreating } = useCreateCourseHook();
  const { mutate: editCourse, isPending: isEditing } = useEditCourseHook();

  const isPending = isCreating || isEditing;
  const thumbnail = watch("thumbnail");

  useEffect(() => {
    if (editingCourse) {
      setIsOpen(true);
      resetForm({
        title: editingCourse.title,
        description: editingCourse.description,
        amount: editingCourse.amount,
        duration: editingCourse.duration || "",
      });
    }
  }, [editingCourse, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({});
      if (onCloseEdit) onCloseEdit();
    }
  };

  const createCourseHandler = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("amount", data.amount);
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
          toast.success(res.message);
          handleOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
        disabled={isPending}
        onClick={() => {
          resetForm({});
          if (onCloseEdit) onCloseEdit();
        }}
      >
        + Add Course
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          <DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(createCourseHandler)}
            >
              <input
                {...register("title", { required: true })}
                placeholder="Course Title"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                {...register("description", { required: true })}
                placeholder="Course Description"
                rows={3}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  {...register("amount", { required: true })}
                  placeholder="Price"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  {...register("duration", { required: true })}
                  placeholder="Duration (e.g., 6 Months)"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modern Image Upload Placeholder */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors overflow-hidden">
                {thumbnail && thumbnail.length > 0 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50/50">
                    <p className="text-sm font-semibold text-blue-700 mb-1">
                      Thumbnail Selected! 🎉
                    </p>
                    <p className="text-xs text-blue-600 truncate max-w-[80%] px-4 py-1 bg-blue-100 rounded-full">
                      {thumbnail[0].name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 font-semibold mb-1">
                      Click to upload course thumbnail
                    </p>
                    <p className="text-xs text-slate-400">
                      Recommended ratio: 16:9 (e.g., 1280x720px)
                    </p>
                  </div>
                )}
                {/* The actual input is hidden, but clicking the label triggers it! */}
                {/* When editing, the thumbnail is optional since the database already has one */}
                <input
                  type="file"
                  accept="image/*"
                  {...register("thumbnail", { required: !editingCourse })}
                  className="hidden"
                />
              </label>

              <button
                disabled={isPending}
                type="submit"
                className="w-full py-3 cursor-pointer bg-blue-600 flex items-center justify-center text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {isPending ? (
                  <Loader2 className="animate-spin cursor-pointer" />
                ) : (
                  editingCourse ? "Update Course" : "Create Course"
                )}
              </button>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
