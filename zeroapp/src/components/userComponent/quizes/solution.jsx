import React, { useState, useEffect } from "react";
import { Lightbulb, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { decodeHtml } from "@/utils/decodeHtml";

const SolutionUI = ({ solutionText, solutionImage, correctOptionText }) => {
  const [showSolution, setShowSolution] = useState(false);

  // Jab bhi naya question load ho, solution automatically hide ho jaye
  useEffect(() => {
    setShowSolution(false);
  }, [solutionText, solutionImage]);

  return (
    <div className="w-full max-w-xl font-sans mt-10">
      {/* View Solution Button */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center space-x-2 border border-[#22b3c1] text-[#22b3c1] px-4 py-1.5 rounded-sm hover:bg-cyan-50 transition-colors"
        >
          {showSolution ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {showSolution ? "Hide Solution" : "View Solution"}
          </span>
        </button>
      </div>

      {/* Solution Content Box */}
      {showSolution && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl overflow-hidden shadow-sm">
            {/* Solution Header */}
            <div className="bg-emerald-100/50 px-4 py-3 border-b border-emerald-200 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-800 text-sm tracking-wide uppercase">
                Solution & Explanation
              </span>
            </div>

            {/* Solution Content */}
            <div className="p-5 flex flex-col gap-5">
              {/* Correct Answer Box */}
              {correctOptionText && (
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-lg border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Correct Answer
                    </span>
                    <span className="text-slate-800 font-semibold text-[15px]">
                      {correctOptionText}
                    </span>
                  </div>
                </div>
              )}

              {/* Explanation Text */}
              {solutionText && (
                <div
                  className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: decodeHtml(solutionText) }}
                />
              )}

              {/* Explanation Image */}
              {solutionImage && (
                <div className="border border-slate-200 rounded-lg p-2 inline-block bg-white shadow-sm mt-2">
                  <img
                    src={solutionImage}
                    alt="Solution Step or Figure"
                    className="max-w-full max-h-[350px] object-contain rounded"
                  />
                </div>
              )}

              {/* Fallback Message */}
              {!solutionText && !solutionImage && (
                <div className="text-slate-500 italic text-sm text-center py-2">
                  Detailed explanation is not available for this question.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolutionUI;
