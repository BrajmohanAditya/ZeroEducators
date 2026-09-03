import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useCreateModuleHook } from "@/hooks/module.hook";

const CreateModuleDialog = () => {
  const { id } = useParams();
  const { register, handleSubmit, reset } = useForm();
  const { mutate, isPending } = useCreateModuleHook();
  const [openModule, setOpenModule] = useState(false);

  const moduleFormHandler = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("video", data.video[0]);
    formData.append("courseId", id);

    mutate(formData, {
      onSuccess: () => {
        setOpenModule(false);
        reset();
      },
    });
  };

  return (
    <div>
      {/* Create Module Button */}
      <Dialog open={openModule} onOpenChange={setOpenModule}>
        <DialogTrigger className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Module
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">New Module</DialogTitle>
            <form
              onSubmit={handleSubmit(moduleFormHandler)}
              className="space-y-6 mt-6"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  placeholder="Enter module title"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all"
                  {...register("title", { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                  {...register("video", { required: true })}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Module"
                )}
              </button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateModuleDialog;
