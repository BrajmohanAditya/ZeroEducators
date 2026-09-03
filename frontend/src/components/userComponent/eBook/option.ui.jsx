import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import MathText from "../../common/MathText";

const OptionList = ({ options = [], questionId, userAnswer, onSelectOption }) => {
  const optionLetters = ["A", "B", "C", "D"];
  const isOptionAnswered = userAnswer !== undefined;
  const selectedIdx = userAnswer?.selectedIdx;

  return (
    <div className="space-y-2.5">
      {options.map((opt, oIdx) => {
        const isThisSelected = selectedIdx === oIdx;

        let btnStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-700";
        let optionBadgeStyle = "bg-slate-100 text-slate-500";
        let feedbackIcon = null;

        if (isOptionAnswered) {
          if (opt.isCorrect) {
            btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
            optionBadgeStyle = "bg-emerald-500 text-white";
            feedbackIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
          } else if (isThisSelected) {
            btnStyle = "border-rose-500 bg-rose-50 text-rose-800 font-semibold";
            optionBadgeStyle = "bg-rose-500 text-white";
            feedbackIcon = <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
          } else {
            btnStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
            optionBadgeStyle = "bg-slate-200 text-slate-400";
          }
        }

        return (
          <button
            key={oIdx}
            disabled={isOptionAnswered}
            onClick={() => onSelectOption(oIdx)}
            className={`w-full p-3.5 border rounded-xl flex items-center justify-between transition text-left text-xs ${btnStyle} ${
              !isOptionAnswered ? "cursor-pointer hover:border-slate-350" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${optionBadgeStyle}`}>
                {optionLetters[oIdx]}
              </span>
              <MathText className="inline" text={opt.text} />
            </div>
            {feedbackIcon}
          </button>
        );
      })}
    </div>
  );
};

export default OptionList;
