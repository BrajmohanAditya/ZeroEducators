import React, { useState } from "react";
import { Eye } from "lucide-react";
import MathText from "../../common/MathText";

const OptionUI = ({ options, instruction, selectedOption, onSelectOption, isSubmitted, isRevealed }) => {
  const displayOptions = options || [];

  return (
    <div className="flex flex-col pl-10 pt-10 w-full max-w-xl font-sans">
      {/* --- ADD THIS INSTRUCTION BLOCK --- */}
      {instruction && (
        <div className="text-slate-500 font-medium italic text-[15px] mb-6 p-3 rounded-md ">
          <MathText text={instruction} />
        </div>
      )}

      <div className="space-y-4">
        {displayOptions.map((opt, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = opt.isCorrect;

          const showReveal = isSubmitted ? isRevealed : false;
          
          // During test, show selected. After submit, only show if revealed.
          const displayChecked = isSubmitted ? (isRevealed ? isSelected : false) : isSelected;

          let optionStyle = "text-slate-700";
          let bgColor = "bg-transparent";

          // Sahi aur Galat answer highlight karne ka logic
          if (showReveal) {
            if (isCorrect) {
              optionStyle = "text-green-700 font-bold";
              bgColor = "bg-green-100/50 rounded-lg px-3 py-2 border border-green-200";
            } else if (isSelected && !isCorrect) {
              optionStyle = "text-red-600 font-bold";
              bgColor = "bg-red-50 rounded-lg px-3 py-2";
            } else {
              bgColor = "px-3 py-2"; // default padding
            }
          } else if (displayChecked) {
            optionStyle = "text-[#158993] font-bold";
          }

          return (
            <label
              key={index}
              className={`flex items-center space-x-4 cursor-pointer group`}
            >
              <input
                type="radio"
                name="quiz-option"
                className={`w-4 h-4 accent-[#158993] cursor-pointer`}
                checked={displayChecked}
                onChange={() => onSelectOption(index)}
              />

              <div className={`flex-1 ${bgColor}`}>
                <MathText className={`inline text-[15px] ${optionStyle}`} text={opt.text} />
                
                {/* Labels dikhane ke liye */}
                {showReveal && isCorrect && <span className="ml-3 text-green-600 text-xs font-bold">(Correct)</span>}
                {showReveal && isSelected && !isCorrect && <span className="ml-3 text-red-500 text-xs font-bold">(Your Answer - Wrong)</span>}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default OptionUI;
