import React, { useState } from "react";
import {
  X,
  FileQuestion,
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Save,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";
import { useCreateEbookQuestionHook } from "../../../hooks/eBook.jsx/ebookQuestion.hook";
import { toast } from "sonner";

const AddChapterDialog = ({ isOpen, onClose, ebook }) => {
  const { mutate: createQuestion, isPending } = useCreateEbookQuestionHook();

  const totalChapters = ebook?.numberOfChapters || 1;
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterName, setChapterName] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Question, 2: Options, 3: Solution

  const [formData, setFormData] = useState({
    questionText: "",
    questionImage: null,
    optionsInstruction: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correctOptionIndex: null,
    solutionExplanation: "",
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveAndNext = () => {
    if (!formData.questionText) {
      return toast.error("Question text is required");
    }
    if (formData.correctOptionIndex === null) {
      return toast.error("Please select a correct answer");
    }
    const hasEmptyOption = formData.options.some((opt) => !opt.text);
    if (hasEmptyOption) {
      return toast.error("Please fill in all options (A, B, C, D)");
    }

    const payload = new FormData();
    payload.append("ebookId", ebook?._id);
    payload.append("chapterNumber", selectedChapter);
    payload.append("chapterName", chapterName);
    payload.append("questionText", formData.questionText);
    payload.append("optionsInstruction", formData.optionsInstruction);
    payload.append(
      "options",
      JSON.stringify(
        formData.options.map((opt, idx) => ({
          text: opt.text,
          isCorrect: formData.correctOptionIndex === idx,
        })),
      ),
    );
    payload.append("solutionExplanation", formData.solutionExplanation);

    if (formData.questionImage) {
      payload.append("questionImage", formData.questionImage);
    }

    createQuestion(payload, {
      onSuccess: () => {
        resetForm();
        setCurrentStep(1);
      },
    });
  };

  const resetForm = () => {
    setFormData({
      questionText: "",
      questionImage: null,
      optionsInstruction: "",
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      correctOptionIndex: null,
      solutionExplanation: "",
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
  };

  const getStepIconClass = (stepNum) => {
    if (currentStep === stepNum) return "bg-slate-900 text-white shadow-md";
    if (currentStep > stepNum)
      return "bg-green-100 text-green-700 font-semibold";
    return "bg-slate-100 text-slate-500 font-medium";
  };

  const getStepIcon = (stepNum, Icon) => {
    if (currentStep > stepNum) return <CheckCircle2 className="w-4 h-4 mr-2" />;
    return <Icon className="w-4 h-4 mr-2" />;
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <FileQuestion className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Add Questions to Chapter
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <span className="text-indigo-600 font-semibold">
                  Ebook: {ebook?.title}
                </span>
                {ebook?.maxQuestionsPerChapter > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-semibold">
                      Limit: {ebook.maxQuestionsPerChapter} Qs/Chapter
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm transition-all ${getStepIconClass(1)}`}
            >
              {getStepIcon(1, HelpCircle)}
              Question
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={3} />
            <div
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm transition-all ${getStepIconClass(2)}`}
            >
              {getStepIcon(2, Layers)}
              Options
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={3} />
            <div
              className={`flex items-center px-6 py-2.5 rounded-xl text-sm transition-all ${getStepIconClass(3)}`}
            >
              {getStepIcon(3, BookOpen)}
              Solution
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[300px]">
            {/* Step 1: Question details and Chapter Select */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chapter Select dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Select Chapter <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedChapter}
                      onChange={(e) =>
                        setSelectedChapter(Number(e.target.value))
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm bg-white"
                    >
                      {Array.from({ length: totalChapters }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          Set {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Chapter Name Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Chapter Name{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                      placeholder="e.g. Introduction to Mechanics"
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData({ ...formData, questionText: e.target.value })
                    }
                    placeholder="Enter your question..."
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[140px] shadow-sm text-sm bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Question Image{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          questionImage: e.target.files[0],
                        })
                      }
                      className="hidden"
                      id="questionImage"
                    />
                    <label
                      htmlFor="questionImage"
                      className="flex items-center justify-start px-4 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm shadow-sm bg-white"
                    >
                      <Upload className="w-4 h-4 mr-2 text-slate-400" />
                      {formData.questionImage
                        ? formData.questionImage.name
                        : "Upload Image"}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Options config */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-indigo-50/50 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-100">
                  <span className="text-indigo-500">Question Preview:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {formData.questionText
                      ? formData.questionText.length > 80
                        ? formData.questionText.substring(0, 80) + "..."
                        : formData.questionText
                      : "No text provided"}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">
                    Instruction for Options (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.optionsInstruction}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        optionsInstruction: e.target.value,
                      })
                    }
                    placeholder="E.g. Choose the correct synonym..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-white"
                  />
                </div>

                <div className="space-y-4">
                  {formData.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-5 border border-slate-100 rounded-xl space-y-4 bg-slate-50/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-500 shrink-0 mt-1">
                          {optionLabels[idx]}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                            placeholder={`Option ${optionLabels[idx]} text`}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                  <label className="block text-sm font-bold text-slate-800 mb-4">
                    Select Correct Answer{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {optionLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setFormData({ ...formData, correctOptionIndex: idx })
                        }
                        className={`w-14 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all border-2 cursor-pointer ${
                          formData.correctOptionIndex === idx
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Solution Explanation */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-emerald-50/80 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 shadow-sm">
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600"
                    strokeWidth={2.5}
                  />
                  Add a solution explanation to help students understand the
                  answer.
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Solution Explanation (Optional)
                  </label>
                  <textarea
                    value={formData.solutionExplanation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solutionExplanation: e.target.value,
                      })
                    }
                    placeholder="Provide a step-by-step solution..."
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[160px] shadow-sm text-sm bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-white rounded-b-2xl sticky bottom-0 z-10 shrink-0">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2.5 flex items-center justify-center font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex items-center justify-end flex-1">
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 flex items-center justify-center font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md text-sm cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSaveAndNext}
                disabled={isPending}
                className="px-6 py-2.5 flex items-center justify-center font-semibold text-white bg-[#8B5CF6] rounded-xl hover:bg-[#7C3AED] transition-all shadow-md shadow-violet-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Saving..." : "Save Question"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChapterDialog;
