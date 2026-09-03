import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

import {
  useCreateSuccessBoardHook,
  useUpdateSuccessBoardHook,
} from "../../hooks/success.board.hook.js";

const SuccessBoardDialog = ({ editingStudent, onCloseEdit }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, reset: resetForm, watch } = useForm();
  
  const { mutate: createMutate, isPending: isCreating } = useCreateSuccessBoardHook();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateSuccessBoardHook();
  
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (editingStudent) {
      setIsOpen(true);
      resetForm({
        name: editingStudent.name,
        exam: editingStudent.exam,
        rank: editingStudent.rank,
        year: editingStudent.year,
        story: editingStudent.story,
      });
    }
  }, [editingStudent, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({}); // Clear form on close
      if (onCloseEdit) onCloseEdit();
    }
  };

  const selectedImage = watch("image");

  const submitHandler = (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("exam", data.exam);
    formData.append("rank", data.rank);
    formData.append("year", data.year);
    if (data.story) formData.append("story", data.story);
    if (data.image && data.image[0]) {
      formData.append("image", data.image[0]);
    }

    if (editingStudent) {
      updateMutate(
        { id: editingStudent._id, data: formData },
        { onSuccess: () => handleOpenChange(false) }
      );
    } else {
      createMutate(formData, {
        onSuccess: () => handleOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="px-5 py-2 cursor-pointer bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        disabled={isPending}
        onClick={() => {
            resetForm({});
            if (onCloseEdit) onCloseEdit();
        }}
      >
        + Add Student
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingStudent ? "Edit Selected Student" : "Add Selected Student"}</DialogTitle>
          <DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(submitHandler)}
            >
              {/* Student Name */}
              <input
                {...register("name", { required: true })}
                placeholder="Student Name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Exam */}
              <input
                {...register("exam", { required: true })}
                placeholder="Exam (e.g., Banking, SSC CGL)"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-4">
                {/* Rank */}
                <input
                  {...register("rank")}
                  placeholder="Rank (e.g., AIR 15)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Year */}
                <input
                  {...register("year", { required: true })}
                  placeholder="Selection Year (e.g., 2023)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Story / Testimonial */}
              <textarea
                {...register("story")}
                placeholder="What the student said about us..."
                rows="3"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>

              {/* Image Upload Placeholder */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors overflow-hidden">
                {selectedImage && selectedImage.length > 0 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50/50">
                    <p className="text-sm font-semibold text-blue-700 mb-1">
                      Image Selected! 🎉
                    </p>
                    <p className="text-xs text-blue-600 truncate max-w-[80%] px-4 py-1 bg-blue-100 rounded-full">
                      {selectedImage[0].name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 font-semibold mb-1">
                      Click to upload student photo
                    </p>
                    <p className="text-xs text-slate-400">
                      Optional (Square ratio recommended)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  {...register("image")}
                  className="hidden"
                />
              </label>

              <button
                disabled={isPending}
                type="submit"
                className="w-full cursor-pointer py-3 bg-blue-600 flex items-center justify-center text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  editingStudent ? "Update Student" : "Save Student"
                )}
              </button>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessBoardDialog;
