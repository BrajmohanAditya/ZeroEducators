import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateQuizHook, useUpdateQuizHook } from "../../hooks/quiz/quiz.hook";

const CreateQuiz = ({ children, quiz }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!quiz;

  const { mutate: createQuiz, isPending: isCreating } = useCreateQuizHook();
  const { mutate: updateQuiz, isPending: isUpdating } = useUpdateQuizHook();
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      nameOfExam: "",
      quizName: "",
      duration: "",
      totalNoOfQueation: "",
      negativeMark: 0,
      totalMarks: "",
      sections: [{ name: "", totalQuestions: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && quiz) {
        reset({
          nameOfExam: quiz.nameOfExam || "",
          quizName: quiz.quizName || "",
          duration: quiz.duration || "",
          totalNoOfQueation: quiz.totalNoOfQueation || "",
          negativeMark: quiz.negativeMark || 0,
          totalMarks: quiz.totalMarks || "",
          sections: quiz.section && quiz.section.length > 0
            ? quiz.section.map((s) => ({ name: s.name, totalQuestions: s.totalQuestions }))
            : [{ name: "", totalQuestions: "" }],
        });
      } else {
        reset({
          nameOfExam: "",
          quizName: "",
          duration: "",
          totalNoOfQueation: "",
          negativeMark: 0,
          totalMarks: "",
          sections: [{ name: "", totalQuestions: "" }],
        });
      }
    }
  }, [isOpen, quiz, isEditMode, reset]);

  const submitQuizHandler = (data) => {
    const formData = new FormData();
    formData.append("nameOfExam", data.nameOfExam);
    formData.append("quizName", data.quizName);
    formData.append("duration", Number(data.duration));
    formData.append("negativeMark", Number(data.negativeMark));
    formData.append("totalNoOfQueation", Number(data.totalNoOfQueation));
    formData.append("totalMarks", Number(data.totalMarks));

    const sectionsData = data.sections.map((s) => ({
      name: s.name,
      totalQuestions: Number(s.totalQuestions),
    }));
    formData.append("section", JSON.stringify(sectionsData));

    if (data.logo && data.logo[0]) {
      formData.append("logo", data.logo[0]);
    }

    if (isEditMode) {
      updateQuiz(
        { id: quiz._id, payload: formData },
        {
          onSuccess: () => {
            setIsOpen(false);
            reset();
          },
        }
      );
    } else {
      createQuiz(formData, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Quiz" : "Add New Quiz"}</DialogTitle>
          <DialogDescription>
            <form
              className="mt-6 space-y-4 text-left"
              onSubmit={handleSubmit(submitQuizHandler)}
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name of Exam
                </label>
                <input
                  {...register("nameOfExam", { required: true })}
                  placeholder="e.g. Banking, SSC, Railway"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Logo{" "}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    (Recommended size: 1254x1254)
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  {...register("logo", { required: !isEditMode })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quiz Name / Set
                </label>
                <input
                  {...register("quizName", { required: true })}
                  placeholder="e.g. Set 1, Mock Test 2"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    {...register("duration", { required: true, min: 1 })}
                    placeholder="e.g. 60"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    {...register("totalNoOfQueation", {
                      required: true,
                      min: 1,
                    })}
                    placeholder="e.g. 100"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Negative Marking
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("negativeMark", { required: true, min: 0 })}
                    placeholder="e.g. 0.25"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    {...register("totalMarks", { required: true, min: 1 })}
                    placeholder="e.g. 100"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Our dynamic sections will go here next! */}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Sections
                  </label>
                  <button
                    type="button"
                    onClick={() => append({ name: "", totalQuestions: "" })}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded transition"
                  >
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <input
                      {...register(`sections.${index}.name`, {
                        required: true,
                      })}
                      placeholder="e.g. Reasoning"
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      {...register(`sections.${index}.totalQuestions`, {
                        required: true,
                        min: 1,
                      })}
                      placeholder="Qns (e.g. 20)"
                      className="w-32 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remove section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                disabled={isPending}
                type="submit"
                className="w-full py-3 mt-4 bg-blue-600 flex items-center justify-center text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  isEditMode ? "Update Quiz" : "Create Quiz"
                )}
              </button>
            </form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuiz;
