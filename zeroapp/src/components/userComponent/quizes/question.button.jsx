import React from "react";
import { Loader2 } from "lucide-react";

const QuestionButtonUI = ({
  sectionName = "Unknown Section",
  questions = [],
  currentQuestionIndex = 0,
  userAnswers = {},
  onQuestionClick,
  onSubmitTest,
  isSubmitted,
  isSubmitting,
  onViewResult,
}) => {
  return (
    <div className="w-full bg-[#dcf0fa] flex flex-col font-sans h-full border-l border-slate-200 min-h-0">
      {/* Header */}
      <div className="bg-[#bce0f2] px-4 py-2.5 shrink-0">
        <span className="font-bold text-slate-800 text-sm">SECTION : </span>
        <span className="text-slate-700 text-sm">{sectionName}</span>
      </div>

      {/* Grid of Buttons */}
      <div className="flex-1 p-4 grid grid-cols-5 gap-3 overflow-y-auto custom-scrollbar content-start">
        {questions.map((question, index) => {
          const isActive = currentQuestionIndex === index;
          const selectedOptionIndex = userAnswers[question._id];
          const isAnswered = selectedOptionIndex !== undefined;

          let buttonStyle = "border-slate-800 bg-white hover:bg-slate-100 text-slate-800";
          
          if (isSubmitted && isAnswered) {
            // Check if the selected option is the correct one
            const isCorrect = question.options?.[selectedOptionIndex]?.isCorrect;
            if (isCorrect) {
              buttonStyle = "border-transparent bg-[#2dd46c] hover:bg-[#28b95e] text-white font-bold shadow-sm"; // Correct -> Green
            } else {
              buttonStyle = "border-transparent bg-red-500 hover:bg-red-600 text-white font-bold shadow-sm"; // Wrong -> Red
            }
          } else if (isAnswered) {
            // During the test (not submitted), just show green for answered
            buttonStyle = "border-transparent bg-[#2dd46c] hover:bg-[#28b95e] text-white font-bold shadow-sm";
          }

          return (
            <button
              key={index}
              onClick={() => onQuestionClick && onQuestionClick(index)}
              className={`flex cursor-pointer items-center justify-center border transition-all text-[15px] h-9 w-full ${buttonStyle} ${
                isActive ? "rounded-[35%] ring-2 ring-offset-1 ring-[#158993]" : "rounded-sm"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Footer / Action Buttons */}
      <div className="shrink-0 flex flex-col gap-2 p-3 border-t border-[#bce0f2]">
        <button
          onClick={isSubmitted ? onViewResult : onSubmitTest}
          disabled={isSubmitting}
          className={`w-full py-2 rounded-sm text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${
            isSubmitting
              ? "bg-slate-300 text-slate-500 cursor-not-allowed" // Looks disabled and grey
              : "cursor-pointer bg-[#24bcd4] hover:bg-[#1ba8be] text-white" // Normal teal color
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : isSubmitted ? (
            "View Result"
          ) : (
            "Submit Test"
          )}
        </button>
      </div>
    </div>
  );
};

export default QuestionButtonUI;
