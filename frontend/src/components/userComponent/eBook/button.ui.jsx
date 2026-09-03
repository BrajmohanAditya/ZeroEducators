import React from "react";

const QuestionPalette = ({ questions = [], currentIdx, setCurrentIdx, userAnswers = {} }) => {
  return (
    <div className="bg-slate-50 p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 mb-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Question Palette
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Jump directly to any question.
        </p>
      </div>

      {questions.length > 0 ? (
        <div className="grid grid-cols-5 gap-2 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 content-start">
          {questions.map((q, qIndex) => {
            const qId = q._id;
            const answer = userAnswers[qId];
            const isCurrent = qIndex === currentIdx;

            let colorStyle = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent";
            
            if (answer !== undefined) {
              if (answer.isCorrect) {
                colorStyle = "bg-emerald-500 text-white border-transparent";
              } else {
                colorStyle = "bg-rose-500 text-white border-transparent";
              }
            } else if (isCurrent) {
              colorStyle = "bg-indigo-50 text-indigo-600 border-indigo-500 ring-1 ring-indigo-500";
            }

            return (
              <button
                key={qId}
                onClick={() => setCurrentIdx(qIndex)}
                className={`h-8 w-full rounded-md flex items-center justify-center font-bold text-xs transition cursor-pointer border ${colorStyle}`}
              >
                {qIndex + 1}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-xs">
          No palette available.
        </div>
      )}
    </div>
  );
};

export default QuestionPalette;
