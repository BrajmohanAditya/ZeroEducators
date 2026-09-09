import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { parseQuestionsFromCSV, downloadSampleQuestionsCSV } from "../../../utils/csv.parser";
import { useBulkCreateQuizQuestionsHook } from "../../../hooks/quiz/quiz.createQuest.hook";
import { toast } from "sonner";

const QuizBulkUploadDialog = ({ isOpen, onClose, quiz }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedResult, setParsedResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'valid' | 'errors'
  const [defaultSection, setDefaultSection] = useState(quiz?.section?.[0]?.name || "General");

  const { mutate: bulkCreate, isPending: isImporting } = useBulkCreateQuizQuestionsHook();

  if (!isOpen || !quiz) return null;

  const sections = quiz.section || [];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a valid .csv file.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const result = parseQuestionsFromCSV(text, defaultSection);
        setParsedResult(result);
        if (result.validCount === 0 && result.errors.length > 0) {
          toast.error(result.errors[0]);
        } else {
          toast.success(`Parsed ${result.validCount} valid questions!`);
        }
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedResult(null);
    setActiveFilter("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.validCount === 0) {
      toast.error("No valid questions to import.");
      return;
    }

    bulkCreate(
      {
        quizId: quiz._id,
        questions: parsedResult.questions,
      },
      {
        onSuccess: () => {
          handleReset();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm shrink-0">
                <FileSpreadsheet className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-slate-900">
                    Bulk Upload Questions
                  </DialogTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {quiz.quizName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import dozens of questions instantly via Excel / CSV format.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadSampleQuestionsCSV(sections)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV
            </button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {!parsedResult ? (
            /* Upload Screen */
            <div className="space-y-6 max-w-2xl mx-auto py-4">
              {/* Instructions Card */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-start gap-3 text-slate-700 text-xs leading-relaxed">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900 block mb-1">
                    How it works in 3 easy steps:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Click <b>"Download Sample CSV"</b> above to get the exact format.</li>
                    <li>Open in Excel or Google Sheets, add your questions and options.</li>
                    <li>Upload the saved <b>.csv</b> file below to preview and import all at once!</li>
                  </ol>
                </div>
              </div>

              {/* Default Section Picker */}
              {sections.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Default Section
                    </label>
                    <span className="text-[11px] text-slate-500">
                      If a question's section column is left blank in CSV, this section will be used.
                    </span>
                  </div>
                  <select
                    value={defaultSection}
                    onChange={(e) => setDefaultSection(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none shrink-0"
                  >
                    {sections.map((sec, idx) => (
                      <option key={idx} value={sec.name}>
                        {sec.name} ({sec.totalQuestions} Qs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition group shadow-xs"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Click to select or drag & drop your .csv file
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Supports standard comma-separated (.csv) files exported from Excel, Google Sheets, or Calc.
                </p>
              </div>
            </div>
          ) : (
            /* Preview Screen */
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-800">
                      {parsedResult.validCount} Valid Questions
                    </span>
                  </div>
                  {parsedResult.invalidCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="text-xs font-bold text-red-600">
                        {parsedResult.invalidCount} Errors Detected
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-slate-400">
                    File: <b className="text-slate-600">{selectedFile?.name}</b>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Change File
                  </button>
                </div>
              </div>

              {/* Error messages if any */}
              {parsedResult.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please note:
                  </span>
                  {parsedResult.errors.slice(0, 3).map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                  {parsedResult.errors.length > 3 && (
                    <div className="text-slate-500">
                      ...and {parsedResult.errors.length - 3} more errors.
                    </div>
                  )}
                </div>
              )}

              {/* Questions Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 w-12 text-center">#</th>
                        <th className="px-3 py-3 w-28">Section</th>
                        <th className="px-4 py-3 min-w-[200px]">Question</th>
                        <th className="px-4 py-3 min-w-[220px]">Options & Answer</th>
                        <th className="px-3 py-3 w-16 text-center">Marks</th>
                        <th className="px-4 py-3">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.questions.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-800">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                              {q.sectionName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            <p className="line-clamp-2">{q.questionText}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${
                                    opt.isCorrect
                                      ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
                                      : "text-slate-600"
                                  }`}
                                >
                                  <span className="font-bold">{opt.label})</span>
                                  <span className="truncate max-w-[170px]">{opt.text}</span>
                                  {opt.isCorrect && (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-700">
                            {q.marks}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            <p className="line-clamp-2">
                              {q.solutionExplanation || "—"}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          {parsedResult && parsedResult.validCount > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {parsedResult.validCount} Questions...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {parsedResult.validCount} Questions Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizBulkUploadDialog;
