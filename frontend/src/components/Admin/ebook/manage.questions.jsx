import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Trash2,
  Edit2,
  Save,
  ChevronLeft,
  Upload,
  Info,
  Check,
} from "lucide-react";
import {
  useGetEbookQuestionsHook,
  useDeleteEbookQuestionHook,
  useUpdateEbookQuestionHook,
} from "../../../hooks/eBook.jsx/ebookQuestion.hook";
import { toast } from "sonner";

const ManageQuestionsDialog = ({ isOpen, onClose, ebook }) => {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Edit form state
  const [formData, setFormData] = useState({
    chapterNumber: 1,
    chapterName: "",
    questionText: "",
    optionsInstruction: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correctOptionIndex: null,
    solutionExplanation: "",
    questionImage: null,
    existingImage: "",
  });

  // Queries & Mutations
  const { data: questionsData, isLoading: questionsLoading } = useGetEbookQuestionsHook({
    ebookId: ebook?._id,
    chapterNumber: selectedChapter,
  });

  // Fetch all questions to build a map of Chapter/Set Names
  const { data: allQuestionsData } = useGetEbookQuestionsHook({
    ebookId: ebook?._id,
  });

  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteEbookQuestionHook();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateEbookQuestionHook();

  const questions = questionsData?.questions || [];
  const allQuestions = allQuestionsData?.questions || [];

  // Extract set names mapping
  const chapterNames = {};
  allQuestions.forEach((q) => {
    if (q.chapterNumber && q.chapterName) {
      chapterNames[q.chapterNumber] = q.chapterName;
    }
  });

  // Prepare edit form when editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      const correctIdx = editingQuestion.options.findIndex((opt) => opt.isCorrect);
      setFormData({
        chapterNumber: editingQuestion.chapterNumber || selectedChapter,
        chapterName: editingQuestion.chapterName || chapterNames[editingQuestion.chapterNumber] || "",
        questionText: editingQuestion.questionText || "",
        optionsInstruction: editingQuestion.optionsInstruction || "",
        options: editingQuestion.options.map((opt) => ({ text: opt.text })) || [
          { text: "" }, { text: "" }, { text: "" }, { text: "" }
        ],
        correctOptionIndex: correctIdx !== -1 ? correctIdx : null,
        solutionExplanation: editingQuestion.solutionExplanation || "",
        questionImage: null,
        existingImage: editingQuestion.questionImage || "",
      });
    }
  }, [editingQuestion]);

  if (!isOpen) return null;

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      deleteQuestion(id);
    }
  };

  const handleUpdate = () => {
    if (!formData.questionText) {
      return toast.error("Question text is required");
    }
    if (formData.correctOptionIndex === null || formData.correctOptionIndex === -1) {
      return toast.error("Please choose a correct option");
    }
    const hasEmptyOption = formData.options.some((opt) => !opt.text);
    if (hasEmptyOption) {
      return toast.error("Please fill in all options");
    }

    const payload = new FormData();
    payload.append("chapterNumber", formData.chapterNumber);
    payload.append("chapterName", formData.chapterName);
    payload.append("questionText", formData.questionText);
    payload.append("optionsInstruction", formData.optionsInstruction);
    payload.append(
      "options",
      JSON.stringify(
        formData.options.map((opt, idx) => ({
          text: opt.text,
          isCorrect: formData.correctOptionIndex === idx,
        }))
      )
    );
    payload.append("solutionExplanation", formData.solutionExplanation);
    
    if (formData.questionImage) {
      payload.append("questionImage", formData.questionImage);
    }

    updateQuestion(
      { id: editingQuestion._id, payload },
      {
        onSuccess: () => {
          setEditingQuestion(null);
        },
      }
    );
  };

  const handleOptionTextChange = (idx, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[idx] = { ...updatedOptions[idx], text: value };
    setFormData({ ...formData, options: updatedOptions });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-black text-slate-800 text-base sm:text-lg tracking-tight">
              {editingQuestion ? "Edit Question" : "Manage Questions"}
            </h2>
            <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {ebook?.title}
            </span>
          </div>
          <button
            onClick={() => {
              if (editingQuestion) {
                setEditingQuestion(null);
              } else {
                onClose();
              }
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-150 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
          {!editingQuestion ? (
            /* LIST VIEW */
            <div className="space-y-6">
              
              {/* Dropdown to select Set */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Select Set
                  </label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                    className="w-full min-w-[200px] border border-slate-200 rounded-lg p-2 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: ebook?.numberOfChapters || 1 }).map((_, idx) => {
                      const chNum = idx + 1;
                      const name = chapterNames[chNum] ? ` - ${chapterNames[chNum]}` : "";
                      return (
                        <option key={chNum} value={chNum}>
                          Set {chNum}{name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 py-1.5 px-3 rounded-lg shadow-sm">
                  Questions count in this Set:{" "}
                  <span className="font-bold text-slate-800">{questions.length}</span>
                </div>
              </div>

              {/* Questions List */}
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">Loading questions list...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-800 font-bold text-sm">No Questions Found</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    There are no questions added to Set {selectedChapter} yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q._id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                            Question {idx + 1}
                          </span>
                          <p className="text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingQuestion(q)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                            title="Delete Question"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Display Question Image if exists */}
                      {q.questionImage && (
                        <div className="mb-3 max-w-[200px] rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={q.questionImage}
                            alt="Question illustration"
                            className="w-full h-auto object-contain max-h-32"
                          />
                        </div>
                      )}

                      {/* Options preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg border ${
                              opt.isCorrect
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-bold"
                                : "bg-slate-50 border-slate-150 text-slate-600"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                                opt.isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt.text}</span>
                            {opt.isCorrect && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                          </div>
                        ))}
                      </div>

                      {q.solutionExplanation && (
                        <div className="mt-3 text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-500 font-medium">
                          <span className="font-bold text-slate-700 mr-1">Explanation:</span>
                          {q.solutionExplanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* EDIT FORM VIEW */
            <div className="space-y-5">
              <button
                onClick={() => setEditingQuestion(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to questions list
              </button>

              {/* Row 1: Chapter and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                    Set Number *
                  </label>
                  <input
                    type="number"
                    value={formData.chapterNumber}
                    onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                    Set Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.chapterName}
                    onChange={(e) => setFormData({ ...formData, chapterName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                    placeholder="e.g. Trigonometry Basics"
                  />
                </div>
              </div>

              {/* Row 2: Question Text */}
              <div>
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                  Question Text *
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  placeholder="Type your question..."
                />
              </div>

              {/* Row 3: Options Instruction */}
              <div>
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                  Options Instruction / Direction
                </label>
                <input
                  type="text"
                  value={formData.optionsInstruction}
                  onChange={(e) => setFormData({ ...formData, optionsInstruction: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  placeholder="e.g. Choose the single correct option."
                />
              </div>

              {/* Row 4: Question Image Upload */}
              <div>
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                  Question Illustration Image
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-105 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, questionImage: e.target.files[0] })}
                      className="hidden"
                    />
                  </label>
                  {(formData.questionImage || formData.existingImage) && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                        <img
                          src={
                            formData.questionImage
                              ? URL.createObjectURL(formData.questionImage)
                              : formData.existingImage
                          }
                          alt="preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[150px]">
                        {formData.questionImage ? formData.questionImage.name : "Existing Image"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Options */}
              <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
                  Options and Correct Answer
                </label>
                
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, correctOptionIndex: idx })}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 border transition-all cursor-pointer ${
                        formData.correctOptionIndex === idx
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-100"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                    />
                  </div>
                ))}
              </div>

              {/* Row 6: Solution Explanation */}
              <div>
                <label className="text-xs font-black text-slate-450 uppercase tracking-wider block mb-1">
                  Solution Explanation
                </label>
                <textarea
                  value={formData.solutionExplanation}
                  onChange={(e) => setFormData({ ...formData, solutionExplanation: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
                  placeholder="Type the solution explanation here..."
                />
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          {editingQuestion ? (
            <>
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-5 py-2 flex items-center justify-center font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-6 py-2 flex items-center justify-center font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition disabled:opacity-75 cursor-pointer text-xs"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 flex items-center justify-center font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition cursor-pointer text-xs"
            >
              Close Manager
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManageQuestionsDialog;
