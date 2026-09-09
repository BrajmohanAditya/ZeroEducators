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
import { useGetExamsHook } from "../../hooks/quiz/exam.hook";

const CreateQuiz = ({ children, quiz, exam, isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const setIsOpen = (val) => {
    if (isControlled) {
      if (!val && controlledOnClose) controlledOnClose();
    } else {
      setInternalOpen(val);
    }
  };

  const isEditMode = !!quiz;

  const { mutate: createQuiz, isPending: isCreating } = useCreateQuizHook();
  const { mutate: updateQuiz, isPending: isUpdating } = useUpdateQuizHook();
  const isPending = isCreating || isUpdating;

  const { data: examsData } = useGetExamsHook();
  const exams = examsData?.exams || [];

  const { register, handleSubmit, reset, control, watch, setValue } = useForm({
    defaultValues: {
      examId: exam?._id || "",
      nameOfExam: exam?.title || "",
      quizName: "",
      duration: "",
      totalNoOfQueation: "",
      negativeMark: 0,
      totalMarks: "",
      sections: [{ name: "", totalQuestions: "" }],
    },
  });

  const selectedExamId = watch("examId");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && quiz) {
        reset({
          examId: quiz.examId?._id || quiz.examId || exam?._id || "",
          nameOfExam: quiz.nameOfExam || exam?.title || "",
          quizName: quiz.quizName || "",
          duration: quiz.duration || "",
          totalNoOfQueation: quiz.totalNoOfQueation || "",
          negativeMark: quiz.negativeMark || 0,
          totalMarks: quiz.totalMarks || "",
          sections:
            quiz.section && quiz.section.length > 0
              ? quiz.section.map((s) => ({
                  name: s.name,
                  totalQuestions: s.totalQuestions,
                }))
              : [{ name: "", totalQuestions: "" }],
        });
      } else {
        reset({
          examId: exam?._id || "",
          nameOfExam: exam?.title || "",
          quizName: "",
          duration: "",
          totalNoOfQueation: "",
          negativeMark: 0,
          totalMarks: "",
          sections: [{ name: "", totalQuestions: "" }],
        });
      }
    }
  }, [isOpen, quiz, exam, isEditMode, reset]);

  // When examId selection changes, auto-fill nameOfExam
  useEffect(() => {
    if (selectedExamId) {
      const selected = exams.find((e) => e._id === selectedExamId);
      if (selected) {
        setValue("nameOfExam", selected.title);
      }
    }
  }, [selectedExamId, exams, setValue]);

  const submitQuizHandler = (data) => {
    const formData = new FormData();
    if (data.examId) {
      formData.append("examId", data.examId);
    }
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
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {isEditMode ? "Edit Quiz" : "Add New Quiz / Mock Test"}
          </DialogTitle>
          <DialogDescription>
            Configure quiz details, duration, sections, and marking scheme.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-4 space-y-4 text-left"
          onSubmit={handleSubmit(submitQuizHandler)}
        >
          {/* Exam Selection / Display */}
          {exam ? (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                  Parent Exam
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {exam.title}
                </span>
              </div>
              {exam.logoUrl && (
                <img
                  src={exam.logoUrl}
                  alt={exam.title}
                  className="w-9 h-9 object-contain rounded-md border border-indigo-200 bg-white"
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Select Exam <span className="text-red-500">*</span>
              </label>
              <select
                {...register("examId", { required: true })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">-- Choose an Exam --</option>
                {exams.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title} {e.category ? `(${e.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Quiz Name / Set <span className="text-red-500">*</span>
            </label>
            <input
              {...register("quizName", { required: true })}
              placeholder="e.g. Mock Test 1, Set 1, Final Practice"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Duration (mins) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("duration", { required: true, min: 1 })}
              placeholder="e.g. 60"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Total Questions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("totalNoOfQueation", {
                  required: true,
                  min: 1,
                })}
                placeholder="e.g. 100"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("totalMarks", { required: true, min: 1 })}
                placeholder="e.g. 100"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Negative Marking (per wrong answer)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("negativeMark", { required: true, min: 0 })}
              placeholder="e.g. 0.25"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Custom Logo (Optional)
              <span className="text-xs font-normal text-slate-400 ml-1">
                (Leave blank to use Exam logo)
              </span>
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              {...register("logo")}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          {/* Dynamic sections */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Sections Breakdown <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => append({ name: "", totalQuestions: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  {...register(`sections.${index}.name`, {
                    required: true,
                  })}
                  placeholder="Section Name (e.g. Reasoning)"
                  className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <input
                  type="number"
                  {...register(`sections.${index}.totalQuestions`, {
                    required: true,
                    min: 1,
                  })}
                  placeholder="Questions (e.g. 25)"
                  className="w-32 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                "Update Quiz"
              ) : (
                "Create Quiz"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuiz;
