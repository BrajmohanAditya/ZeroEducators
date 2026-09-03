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
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

import { useCreatePremiumStudentHook, useUpdatePremiumStudentHook } from "../../hooks/premium.student.hook.js";

const PremiumStudentDialog = ({ editingStudent, onCloseEdit }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, reset: resetForm, watch } = useForm();
  
  const { mutate: createMutate, isPending: isCreating } = useCreatePremiumStudentHook();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdatePremiumStudentHook();
  
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (editingStudent) {
      setIsOpen(true);
      resetForm({
        name: editingStudent.name,
        batch: editingStudent.batch,
        phoneNo: editingStudent.phoneNo,
        amountPaid: editingStudent.amountPaid,
        amountRemain: editingStudent.amountRemain,
        feeStatus: editingStudent.feeStatus,
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

  const createStudentHandler = (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("batch", data.batch);
    formData.append("phoneNo", data.phoneNo);
    formData.append("amountPaid", data.amountPaid);
    formData.append("amountRemain", data.amountRemain);
    formData.append("feeStatus", data.feeStatus);
    if (data.image && data.image[0]) {
      formData.append("image", data.image[0]);
    }

    if (editingStudent) {
      updateMutate({ id: editingStudent._id, data: formData }, {
        onSuccess: () => handleOpenChange(false),
      });
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
          <DialogTitle>{editingStudent ? "Edit Premium Student" : "Add Premium Student"}</DialogTitle>
          <DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(createStudentHandler)}
            >
              {/* 1. Student Name */}
              <input
                {...register("name", { required: true })}
                placeholder="Student Name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* 2. Batch */}
              <input
                {...register("batch", { required: true })}
                placeholder="Batch (e.g., NEET Target 2025)"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* 3. Contact Number */}
              <input
                {...register("phoneNo", { required: true })}
                placeholder="Contact Number (+91 XXXXXXXXXX)"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Amounts Row */}
              <div className="flex gap-4">
                {/* 4. Amount Paid */}
                <input
                  type="number"
                  {...register("amountPaid", { required: true })}
                  placeholder="Amount Paid (₹)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* 5. Amount Due */}
                <input
                  type="number"
                  {...register("amountRemain", { required: true })}
                  placeholder="Amount Due (₹)"
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 6. Fee Status */}
              <select
                {...register("feeStatus", { required: true })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>

              {/* 7. Image Upload Placeholder */}
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

export default PremiumStudentDialog;
