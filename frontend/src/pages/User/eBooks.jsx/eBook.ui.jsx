import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Play,
  ChevronRight,
  Info,
} from "lucide-react";
import { useGetSingleEbookHook } from "../../../hooks/eBook.jsx/ebook.hook";
import { useGetEbookQuestionsHook } from "../../../hooks/eBook.jsx/ebookQuestion.hook";

// Modular components
import QuestionCard from "../../../components/userComponent/eBook/question.ui";
import QuestionPalette from "../../../components/userComponent/eBook/button.ui";

const EbookQuestionPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch eBook details
  const { data: ebookData, isLoading: ebookLoading, isError: ebookError } = useGetSingleEbookHook(id);
  const ebook = ebookData?.ebook;

  // State
  const [activeChapter, setActiveChapter] = useState(1);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: { selectedIdx, isCorrect } }

  // Fetch questions for active chapter
  const { data: questionsData, isLoading: questionsLoading, isError: questionsError } = useGetEbookQuestionsHook({
    ebookId: id,
    chapterNumber: activeChapter,
  });

  // Fetch all questions to extract chapter/set names
  const { data: allQuestionsData } = useGetEbookQuestionsHook({
    ebookId: id,
  });

  const questions = questionsData?.questions || [];
  const allQuestions = allQuestionsData?.questions || [];

  // Create a mapping of chapter/set numbers to names
  const chapterNames = {};
  allQuestions.forEach((q) => {
    if (q.chapterNumber && q.chapterName) {
      chapterNames[q.chapterNumber] = q.chapterName;
    }
  });

  // Reset question index and answers when changing chapters
  useEffect(() => {
    setCurrentIdx(0);
    setUserAnswers({});
  }, [activeChapter]);

  if (ebookLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-slate-500 font-semibold text-sm">Loading eBook Practice Session...</p>
      </div>
    );
  }

  if (ebookError || !ebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">eBook Session Failed</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">
          We could not load this eBook. It may have been removed or is currently unavailable.
        </p>
        <button
          onClick={() => navigate("/ebooks")}
          className="mt-5 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-sm"
        >
          Go back to eBooks
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (optionIdx) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    if (userAnswers[qId] !== undefined) return; // Already answered

    const isCorrect = currentQuestion.options[optionIdx]?.isCorrect || false;

    setUserAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedIdx: optionIdx,
        isCorrect,
      },
    }));
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sticky top-0 z-30 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/ebooks")}
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-700 cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-0.5">
                <BookOpen className="w-3 h-3" />
                Practice Mode
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-855 truncate max-w-[200px] sm:max-w-[400px]">
                {ebook.title}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Set</div>
            <div className="text-xs sm:text-sm font-black text-slate-800">
              Set {activeChapter} of {ebook.numberOfChapters}
              {chapterNames[activeChapter] && (
                <span className="text-indigo-600 block sm:inline sm:ml-2">
                  ({chapterNames[activeChapter]})
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 w-full mx-auto p-0 flex flex-col lg:flex-row gap-0 items-stretch min-h-0 overflow-hidden h-full">
        
        {/* LEFT COLUMN: Question Viewer */}
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden lg:border-r border-slate-200 bg-white">
          {questionsLoading ? (
            <div className="bg-white p-12 flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-slate-500 text-sm">Loading questions...</p>
            </div>
          ) : questionsError ? (
            <div className="bg-white p-12 flex flex-col items-center justify-center h-full text-center">
              <Info className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-slate-800 font-bold">Failed to load chapter questions</p>
              <p className="text-slate-500 text-xs mt-1">Please try again later.</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white p-12 flex flex-col items-center justify-center h-full text-center">
              <Info className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-black text-slate-800">No Questions Available</h3>
              <p className="text-slate-500 text-xs max-w-xs mt-1 leading-relaxed">
                There are no questions uploaded for Chapter {activeChapter} in this eBook.
              </p>
            </div>
          ) : (
            <QuestionCard
              currentQuestion={currentQuestion}
              currentIdx={currentIdx}
              totalQuestions={questions.length}
              userAnswer={userAnswers[currentQuestion._id]}
              onSelectOption={handleOptionSelect}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar containing Palette and Chapters */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-0 h-[350px] lg:h-full min-h-0 overflow-hidden bg-white">
          
          {/* Card 1: Question Palette Component */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b border-slate-200">
            <QuestionPalette
              questions={questions}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              userAnswers={userAnswers}
            />
          </div>

          {/* Card 2: Chapter Selection Sidebar */}
          <div className="bg-white p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2.5 shrink-0">
              Total Sets
            </h3>
            <div className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {Array.from({ length: ebook.numberOfChapters || 0 }).map((_, idx) => {
                const chNum = idx + 1;
                const isActive = activeChapter === chNum;
                const chName = chapterNames[chNum];
                return (
                  <button
                    key={chNum}
                    onClick={() => setActiveChapter(chNum)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer text-xs font-bold ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {chNum}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="shrink-0">Set</span>
                        {chName && (
                          <span className={`truncate text-[10px] ${isActive ? "text-slate-300" : "text-slate-500"} font-medium`}>
                            : {chName}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive ? (
                      <Play className="w-3 h-3 fill-current text-white animate-pulse shrink-0 ml-1" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EbookQuestionPractice;
