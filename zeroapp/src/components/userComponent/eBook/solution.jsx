import React from "react";
import { Sparkles } from "lucide-react";

const SolutionExplanation = ({ userAnswer, solutionExplanation }) => {
  if (userAnswer === undefined || !solutionExplanation) return null;

  return (
    <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 shadow-sm text-xs animate-in slide-in-from-bottom-2 duration-300">
      <h4 className="font-extrabold text-indigo-900 mb-1.5 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        Solution Explanation
      </h4>
      <p className="text-slate-600 leading-relaxed font-semibold">
        {solutionExplanation}
      </p>
    </div>
  );
};

export default SolutionExplanation;
