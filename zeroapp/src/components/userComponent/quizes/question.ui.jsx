import React from "react";
import { AlertTriangle } from "lucide-react";
import MathText from "../../common/MathText";
import { decodeHtml } from "@/utils/decodeHtml";

const QuestionUI = ({ children, question, questionNumber = 1 }) => {
  return (
    <div className="flex flex-col bg-white h-auto lg:h-full">
      {/* 1. Question Header (Top Bar) */}


      {/* 2. Main Question Body */}
      <div className="flex flex-col p-6 md:p-8 h-auto lg:h-full">
        {/* Question Content */}
        <div className="mb-8">
          <MathText
            className="text-slate-800 text-[16px] leading-relaxed font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
            text={decodeHtml(question?.questionText)}
          />

          {/* Question Image (If it exists in the database) */}
          {question?.questionImage && (
            <div className="mt-6 border border-slate-200 rounded-lg p-2 inline-block shadow-sm">
              <img
                src={question.questionImage}
                alt="Question Figure"
                className="max-w-full max-h-[300px] object-contain rounded"
              />
            </div>
          )}
        </div>

        {/* 3. Options Container (This is where option.ui.jsx will go later) */}
        <div className="mt-2 flex-1">{children}</div>
      </div>
    </div>
  );
};

export default QuestionUI;
