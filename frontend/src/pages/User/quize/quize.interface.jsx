import React, { useState } from "react";
import { User, AlertTriangle, Maximize, AlertCircle } from "lucide-react";
import { useGetQuizByIdHook } from "@/hooks/quiz/quiz.hook";
import QuestionUi from "@/components/userComponent/quizes/question.ui.jsx";
import { useParams, useNavigate } from "react-router-dom";
import { useGetQuizQuestionsHook } from "@/hooks/quiz/quiz.createQuest.hook.js";
import OptionUI from "@/components/userComponent/quizes/option.ui.jsx";
import QuestionButtonUI from "@/components/userComponent/quizes/question.button.jsx";
import SolutionUI from "@/components/userComponent/quizes/solution.jsx";
import { isSectionMatch } from "@/utils/csv.parser";
import {
  useSubmitQuizHook,
  useGetMyQuizResultsHook,
} from "@/hooks/quiz/quizResult.hook.js";

const QuizeInterface = () => {
  const { id } = useParams(); // 1. Get the ID from the URL!
  const navigate = useNavigate(); // For redirecting to result page
  // 2. Fetch only the specific quiz using that ID
  const { data: quizData, isLoading, isError } = useGetQuizByIdHook(id);
  const currentQuiz = quizData?.quiz;

  // 3. Automatically get questions for this ID
  const { data: questions } = useGetQuizQuestionsHook(id);
  const [activeSection, setActiveSection] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // --- ADD THESE NEW LINES ---
  const [timeLeft, setTimeLeft] = useState(null); // Use null to know if it's been initialized
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: submitQuiz, isPending: isSubmitting } = useSubmitQuizHook();
  const { data: previousResultData, isLoading: isCheckingResult } =
    useGetMyQuizResultsHook(id);
  const alreadySubmitted = previousResultData?.count > 0;

  // --- ADD THIS EFFECT ---
  React.useEffect(() => {
    if (alreadySubmitted) {
      setIsSubmitted(true);
      setTimeLeft(0);
      setUserAnswers(previousResultData?.results?.[0]?.userAnswers || {});
    }
  }, [alreadySubmitted, previousResultData]);

  const handleSubmitTest = () => {
    if (isSubmitting) return; // Prevent multiple clicks

    // Call the backend API
    submitQuiz({
      quizId: id,
      userAnswers: userAnswers,
    });
  };

  // 1. Initialize the timer ONCE when the quiz data loads
  React.useEffect(() => {
    if (
      currentQuiz?.duration &&
      timeLeft === null &&
      !isCheckingResult &&
      !alreadySubmitted
    ) {
      setTimeLeft(currentQuiz.duration * 60);
    }
  }, [currentQuiz?.duration, timeLeft, alreadySubmitted, isCheckingResult]);

  // 2. The actual countdown logic
  React.useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft === 0) {
      if (!isSubmitting) {
        handleSubmitTest();
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // Cleanup interval so it doesn't leak memory
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted, isSubmitting]);

  // 3. Helper function to turn seconds into MM:SS format
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  // ---------------------------

  // Derive full list of sections: from quiz configuration + any additional sections found in questions
  const quizSections = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    (currentQuiz?.section || []).forEach((sec) => {
      const name = sec?.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ _id: sec._id || name, name });
      }
    });

    // Also include any section present in questions that wasn't already in quiz.section
    (questions?.questions || []).forEach((q) => {
      const qSec = q.sectionName?.trim();
      if (qSec) {
        const alreadyCovered = list.some((sec) => isSectionMatch(sec.name, qSec));
        if (!alreadyCovered && !seen.has(qSec.toLowerCase())) {
          seen.add(qSec.toLowerCase());
          list.push({ _id: qSec, name: qSec });
        }
      }
    });

    return list;
  }, [currentQuiz?.section, questions?.questions]);

  // 4. Automatically select the first section dynamically
  React.useEffect(() => {
    if (
      quizSections.length > 0 &&
      (!activeSection || !quizSections.some((s) => s.name === activeSection))
    ) {
      setActiveSection(quizSections[0].name);
    }
  }, [quizSections, activeSection]);

  // 5. Filter questions by active section using resilient matching
  const sectionQuestions = React.useMemo(() => {
    if (!activeSection) return [];
    return questions?.questions?.filter((q) => isSectionMatch(q.sectionName, activeSection)) || [];
  }, [questions?.questions, activeSection]);

  const currentQuestion = sectionQuestions[currentQuestionIndex];

  // Reset to first question whenever the user switches sections
  React.useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [activeSection]);

  // --- ADD THIS BLOCK RIGHT HERE (before the main return) ---
  if (isCheckingResult || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading quiz, please wait...</p>
      </div>
    );
  }
  // ----------------------------------------------------------

  return (
    <div className="h-screen flex flex-col bg-white text-sm font-sans select-none overflow-hidden">
      {/* Step 1: Top Header */}
      <header className="min-h-[56px] py-2 border-b flex flex-wrap items-center justify-between px-4 gap-3">
        <div className="font-semibold text-slate-700 text-base">
          {currentQuiz?.nameOfExam}
        </div>

        <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-md shadow-sm">
          <span className="font-bold text-slate-800">Time Left:</span>
          <div className="flex gap-1.5 text-white font-mono font-bold">
            <span
              className={`px-2 py-0.5 rounded text-sm shadow-inner  ${timeLeft !== null && timeLeft < 60 ? "bg-red-500 " : "bg-slate-500"}`}
            >
              {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
            </span>
          </div>
        </div>

        <button className="flex items-center gap-2 border border-[#158993] text-[#158993] px-4 py-1.5 rounded font-medium hover:bg-teal-50 transition">
          <Maximize className="w-4 h-4" />
          Full Screen
        </button>
      </header>
      {/* Sections Bar */}
      <div className="min-h-[44px] border-b flex items-center px-4 bg-white gap-4 overflow-x-auto whitespace-nowrap pt-1">
        <span className="font-semibold text-slate-500 text-xs tracking-wider">
          SECTIONS
        </span>

        {quizSections?.map((sec) => (
          <button
            key={sec._id || sec.name}
            className={` cursor-pointer px-5 py-2.5 rounded-t-lg font-medium transition ${
              activeSection === sec.name
                ? "bg-[#158993] text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setActiveSection(sec.name)}
          >
            {sec.name}
          </button>
        ))}
      </div>

      <div className="min-h-[56px] py-2 border-b border-slate-200 flex flex-wrap items-center justify-between px-4 md:px-6 bg-white shrink-0 gap-3">
        <div className="font-bold text-slate-800 text-base">
          Question No. {sectionQuestions.length > 0 ? currentQuestionIndex + 1 : 0}
        </div>

        <div className="flex items-center gap-8">
          {/* Marks */}
          <div className="flex flex-col items-center justify-center leading-tight">
            <span className="text-slate-500 text-xs font-medium">Marks</span>
            <div className="flex gap-1 mt-0.5">
              <span className="bg-green-600 text-white px-1.5 rounded-sm text-xs font-bold">
                +{currentQuestion?.marks || 1}
              </span>
              <span className="bg-red-500 text-white px-1.5 rounded-sm text-xs font-bold">
                -{currentQuiz?.negativeMark || 0}
              </span>
            </div>
          </div>

          {/* Report Button */}
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition">
            <AlertTriangle className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col lg:flex-row text-slate-800 overflow-hidden min-h-0">
        {/* Left Side (Questions + Options + Bottom Bar) */}
        <div className="flex-1 flex flex-col min-w-0 lg:border-r border-slate-200 overflow-hidden">
          {/* Questions and Options Row */}
          {sectionQuestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-700">
                No questions in "{activeSection}"
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No questions have been uploaded for this section yet. Please switch to another section from the tabs above.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">
              {/* Render the Question UI */}
              <div className="shrink-0 lg:flex-1 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:overflow-y-auto overflow-x-hidden custom-scrollbar">
                <QuestionUi question={currentQuestion} />
              </div>
              {/* {console.log(currentQuestion)} */}
              {/* Render the Option UI */}
              <div className="shrink-0 lg:flex-1 min-h-0 border-b lg:border-b-0 border-slate-200 bg-white lg:overflow-y-auto custom-scrollbar flex flex-col">
                <OptionUI
                  key={currentQuestion?._id || currentQuestionIndex}
                  options={currentQuestion?.options}
                  instruction={currentQuestion?.optionsInstruction}
                  selectedOption={userAnswers[currentQuestion?._id]}
                  isSubmitted={isSubmitted}
                  isRevealed={revealedQuestions[currentQuestion?._id]}
                  onSelectOption={(index) => {
                    if (isSubmitted) {
                      setRevealedQuestions((prev) => ({
                        ...prev,
                        [currentQuestion?._id]: true,
                      }));
                    } else {
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestion?._id]: index,
                      }));
                    }
                  }}
                />

                {isSubmitted &&
                  (currentQuestion?.solutionExplanation ||
                    currentQuestion?.solutionImage) && (
                    <div className="px-10 pb-10">
                      <SolutionUI
                        solutionText={currentQuestion?.solutionExplanation}
                        solutionImage={currentQuestion?.solutionImage}
                      />
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* --- BOTTOM BAR --- */}

          {/* --- BOTTOM BAR --- */}
          <div className="bg-gray-50 border-t border-slate-200 flex items-center px-4 py-3 gap-2 shrink-0 w-full z-10 shadow-[0_-2px_5px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => {
                // Check if it's not the last question in the current section
                if (currentQuestionIndex < sectionQuestions.length - 1) {
                  setCurrentQuestionIndex((prev) => prev + 1);
                }
              }}
              disabled={currentQuestionIndex === sectionQuestions.length - 1} // Disable on last question
              className={`px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm ${
                currentQuestionIndex === sectionQuestions.length - 1
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed" // Disabled look for last question
                  : "bg-[#24bcd4] hover:bg-[#1ba8be] text-white cursor-pointer"
              }`}
            >
              {currentQuestionIndex === sectionQuestions.length - 1
                ? "Last Question"
                : "Save & Next"}
            </button>
          </div>
        </div>

        {/* Right Side - Question Buttons Panel */}
        <div className="w-full lg:w-[320px] shrink-0 bg-white h-[280px] lg:h-full overflow-hidden">
          <QuestionButtonUI
            sectionName={activeSection}
            questions={sectionQuestions}
            currentQuestionIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            onQuestionClick={(index) => setCurrentQuestionIndex(index)}
            onSubmitTest={handleSubmitTest}
            onViewResult={() => navigate(`/quiz-result/${id}`)}
            isSubmitted={isSubmitted}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizeInterface;
