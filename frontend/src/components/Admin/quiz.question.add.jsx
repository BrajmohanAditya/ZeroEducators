import React, { useState } from "react";
import {
  X,
  FileQuestion,
  Layers,
  BookOpen,
  Upload,
  ChevronLeft,
  ChevronRight,
  Save,
  HelpCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useCreateQuizQuestionHook } from "../../hooks/quiz/quiz.createQuest.hook";
import { toast } from "sonner";

const QuizQuestionAdd = ({ isOpen, onClose, quiz }) => {
  const { mutate: createQuestion, isPending } = useCreateQuizQuestionHook();
  if (!isOpen) return null;

  // Mock quiz data if not provided, for demonstration
  const sections = quiz?.section || [
    { name: "Reasoning", totalQuestions: 1 },
    { name: "Quant", totalQuestions: 1 },
  ];

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(1); // 1: Question, 2: Options, 3: Solution

  const currentSection = sections[currentSectionIdx] || {
    name: "Category",
    totalQuestions: 1,
  };

  // Calculate global question number
  let globalTotal = 0;
  let currentGlobal = 0;
  sections.forEach((sec, idx) => {
    globalTotal += sec.totalQuestions;
    if (idx < currentSectionIdx) {
      currentGlobal += sec.totalQuestions;
    }
  });
  currentGlobal += currentQuestionIdx + 1;

  const [formData, setFormData] = useState({
    questionText: "",
    marks: 1,
    questionImage: null,
    optionsInstruction: "",
    options: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctOptionIndex: null,
    solutionExplanation: "",
    solutionImage: null,
  });

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveAndNext = () => {
    // Basic validation
    if (!formData.questionText) {
      return toast.error("Question text is required");
    }
    if (formData.correctOptionIndex === null) {
      return toast.error("Please select a correct answer");
    }

    const payload = {
      quizId: quiz?._id || "mock-quiz-id",
      sectionName: currentSection.name,
      questionText: formData.questionText,
      marks: formData.marks,
      optionsInstruction: formData.optionsInstruction,
      options: formData.options.map((opt, idx) => ({
        text: opt.text || `Option ${["A", "B", "C", "D"][idx]}`,
        isCorrect: formData.correctOptionIndex === idx,
      })),
      solutionExplanation: formData.solutionExplanation,
    };

    createQuestion(payload, {
      onSuccess: () => {
        // Move to next question or section
        if (currentQuestionIdx < currentSection.totalQuestions - 1) {
          setCurrentQuestionIdx(currentQuestionIdx + 1);
          setCurrentStep(1);
          resetForm();
        } else if (currentSectionIdx < sections.length - 1) {
          setCurrentSectionIdx(currentSectionIdx + 1);
          setCurrentQuestionIdx(0);
          setCurrentStep(1);
          resetForm();
        } else {
          // Done
          onClose();
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      questionText: "",
      marks: 1,
      questionImage: null,
      optionsInstruction: "",
      options: [
        { text: "", image: null },
        { text: "", image: null },
        { text: "", image: null },
        { text: "", image: null },
      ],
      correctOptionIndex: null,
      solutionExplanation: "",
      solutionImage: null,
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <FileQuestion className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Create Questions
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <span className="text-indigo-600 font-semibold">
                  Question {currentGlobal} of {globalTotal}
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Category:{" "}
                  <span className="font-semibold text-slate-700">
                    {currentSection.name}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400">
                  (#{currentQuestionIdx + 1} in this category)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Section Pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {sections.map((sec, idx) => {
              const completedInSec =
                idx < currentSectionIdx
                  ? sec.totalQuestions
                  : idx === currentSectionIdx
                    ? currentQuestionIdx
                    : 0;
              const isActive = idx === currentSectionIdx;
              return (
                <div
                  key={idx}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${isActive ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-500"}`}
                >
                  {sec.name}: {completedInSec}/{sec.totalQuestions}{" "}
                  {isActive && <span className="ml-1 text-indigo-400">—</span>}
                </div>
              );
            })}
          </div>

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
            {/* Step 1: Question */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-blue-50/50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                  <span className="font-bold">
                    Category: {currentSection.name}
                  </span>{" "}
                  <span className="text-blue-500 ml-1">
                    (Question {currentQuestionIdx + 1} of{" "}
                    {currentSection.totalQuestions} in this category)
                  </span>
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
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none min-h-[140px] shadow-sm text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Marks
                    </label>
                    <input
                      type="number"
                      value={formData.marks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marks: Number(e.target.value),
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Question Image (optional)
                    </label>
                    <div className="relative h-[46px]">
                      <input
                        type="file"
                        className="hidden"
                        id="questionImage"
                      />
                      <label
                        htmlFor="questionImage"
                        className="flex items-center justify-start px-4 w-full h-full border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm shadow-sm bg-white"
                      >
                        <Upload className="w-4 h-4 mr-2 text-slate-400" />
                        Upload
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Options */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-indigo-50/50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100">
                  <span className="text-indigo-500">Current Question:</span>{" "}
                  <span className="font-semibold">
                    {formData.questionText
                      ? formData.questionText.length > 60
                        ? formData.questionText.substring(0, 60) + "..."
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
                    value={formData.optionsInstruction || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        optionsInstruction: e.target.value,
                      })
                    }
                    placeholder="E.g. Select the most appropriate option..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-4">
                  {formData.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-5 border border-slate-200 rounded-xl space-y-4 bg-white shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-500 shrink-0 mt-1">
                          {optionLabels[idx]}
                        </div>
                        <div className="flex-1 space-y-4">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleOptionChange(idx, "text", e.target.value)
                            }
                            placeholder={`Option ${optionLabels[idx]} text`}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                          />
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-600 block">
                              Option image (optional)
                            </span>
                            <div className="relative">
                              <input
                                type="file"
                                className="hidden"
                                id={`optionImage-${idx}`}
                              />
                              <label
                                htmlFor={`optionImage-${idx}`}
                                className="flex items-center px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm bg-white w-full"
                              >
                                <Upload className="w-4 h-4 mr-2 text-slate-400" />
                                Upload
                              </label>
                            </div>
                          </div>
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
                        className={`w-14 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all border-2 ${
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

            {/* Step 3: Solution */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-green-50/80 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2 border border-green-200 shadow-sm">
                  <CheckCircle2
                    className="w-5 h-5 text-green-600"
                    strokeWidth={2.5}
                  />
                  Almost done! Add an optional solution explanation.
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
                    placeholder="Explain the solution..."
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none min-h-[160px] shadow-sm text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Solution Image (optional)
                  </label>
                  <div className="relative h-[46px]">
                    <input type="file" className="hidden" id="solutionImage" />
                    <label
                      htmlFor="solutionImage"
                      className="flex items-center justify-start px-4 w-full h-full border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm shadow-sm bg-white"
                    >
                      <Upload className="w-4 h-4 mr-2 text-slate-400" />
                      Upload
                    </label>
                  </div>
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
            className="px-6 py-2.5 flex items-center justify-center font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-500">
              {currentGlobal - 1} of {globalTotal} completed
            </span>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 flex items-center justify-center font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSaveAndNext}
                disabled={isPending}
                className="px-6 py-2.5 flex items-center justify-center font-semibold text-white bg-[#8B5CF6] rounded-xl hover:bg-[#7C3AED] transition-all shadow-md shadow-violet-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Saving..." : "Save & Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionAdd;
