import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OptionList from "./option.ui";
import SolutionExplanation from "./solution";
import MathText from "../../common/MathText";

const QuestionCard = ({
  currentQuestion,
  currentIdx,
  totalQuestions,
  userAnswer,
  onSelectOption,
  onPrev,
  onNext,
}) => {
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-0 h-full min-h-0 overflow-hidden">
      <div className="bg-white p-5 sm:p-6 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        {/* Header Stats line */}
        <div className="shrink-0 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
          <span>
            Question {currentIdx + 1} of {totalQuestions}
          </span>
          {currentQuestion.marks && (
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
              +{currentQuestion.marks} Marks
            </span>
          )}
        </div>

        {/* Split Layout: Question on the Left, Instructions & Options on the Right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch min-h-0 overflow-hidden mt-3">
          {/* Left Column: Question Text & Image */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden md:border-r md:border-slate-100 md:pr-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mb-3">
              (Que No. {currentIdx + 1})
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-xs sm:text-sm text-slate-800 font-bold leading-relaxed whitespace-pre-line min-h-0 space-y-4">
              <MathText text={currentQuestion.questionText} className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed" />
              
              {/* Question Image if present */}
              {currentQuestion.questionImage && (
                <div className="max-h-56 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={currentQuestion.questionImage}
                    alt="Question Visual"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Instructions, Options & Solution */}
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-4">
              {/* Options Instruction if present */}
              {currentQuestion.optionsInstruction && (
                <div className="text-xs text-slate-500 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                  {currentQuestion.optionsInstruction}
                </div>
              )}

              {/* Options List */}
              <div className="pt-1">
                <OptionList
                  options={currentQuestion.options}
                  questionId={currentQuestion._id}
                  userAnswer={userAnswer}
                  onSelectOption={onSelectOption}
                />
              </div>

              {/* Solution Explanation */}
              <SolutionExplanation
                userAnswer={userAnswer}
                solutionExplanation={currentQuestion.solutionExplanation}
              />
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-4 gap-4 shrink-0">
          <button
            disabled={currentIdx === 0}
            onClick={onPrev}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition font-bold rounded-lg text-xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <button
            disabled={currentIdx === totalQuestions - 1}
            onClick={onNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
