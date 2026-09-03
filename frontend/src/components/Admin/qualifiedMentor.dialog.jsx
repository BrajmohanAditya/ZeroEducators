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
  useCreateQualifiedMentorHook,
  useUpdateQualifiedMentorHook,
} from "../../hooks/qualifiedMentors.hook.js";

const QualifiedMentorDialog = ({ editingMentor, onCloseEdit }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, reset: resetForm, watch } = useForm();
  
  const { mutate: createMutate, isPending: isCreating } = useCreateQualifiedMentorHook();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateQualifiedMentorHook();
  
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (editingMentor) {
      setIsOpen(true);
      resetForm({
        name: editingMentor.name,
        subject: editingMentor.subject,
        experience: editingMentor.experience,
        qualifications: editingMentor.qualifications,
      });
    }
  }, [editingMentor, resetForm]);

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
    formData.append("subject", data.subject);
    if (data.experience) formData.append("experience", data.experience);
    if (data.qualifications) formData.append("qualifications", data.qualifications);
    
    if (data.image && data.image[0]) {
      formData.append("image", data.image[0]);
    }

    if (editingMentor) {
      updateMutate(
        { id: editingMentor._id, data: formData },
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
        + Add Mentor
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMentor ? "Edit Mentor" : "Add Qualified Mentor"}</DialogTitle>
          <DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(submitHandler)}
            >
              {/* Mentor Name */}
              <input
                {...register("name", { required: true })}
                placeholder="Mentor Name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Subject */}
              <input
                {...register("subject", { required: true })}
                placeholder="Subject Taught (e.g., Mathematics, Physics)"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-4">
                {/* Experience */}
                <input
                  {...register("experience")}
                  placeholder="Experience (e.g., 5 Years)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Qualifications */}
                <input
                  {...register("qualifications", { required: true })}
                  placeholder="Qualifications (e.g., M.Sc, Ex-NDA)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                      Click to upload mentor photo
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
                  editingMentor ? "Update Mentor" : "Save Mentor"
                )}
              </button>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default QualifiedMentorDialog;
