import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSingleCourseHook,
  useAddTopicHook,
  useDeleteTopicHook,
  useAddPdfToTopicHook,
  useDeletePdfFromTopicHook,
} from "../../hooks/course.hook";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
  FolderPlus,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TopicPdfManager = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useGetSingleCourseHook(courseId);
  const course = data?.course;

  // Mutation hooks
  const { mutate: addTopic, isPending: isAddingTopic } = useAddTopicHook(courseId);
  const { mutate: deleteTopic, isPending: isDeletingTopic } = useDeleteTopicHook(courseId);
  const { mutate: addPdfToTopic, isPending: isAddingPdf } = useAddPdfToTopicHook(courseId);
  const { mutate: deletePdfFromTopic, isPending: isDeletingPdf } = useDeletePdfFromTopicHook(courseId);

  // Modal states
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicName, setTopicName] = useState("");

  const [activeTopicForUpload, setActiveTopicForUpload] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // Accordion toggle state: topicId -> boolean
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopicExpand = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId],
    }));
  };

  // Handle Add Topic
  const handleAddTopicSubmit = (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      toast.error("Please enter a topic name");
      return;
    }

    addTopic(
      { courseId, topicName: topicName.trim() },
      {
        onSuccess: () => {
          setTopicName("");
          setIsTopicModalOpen(false);
        },
      }
    );
  };

  // Handle Upload PDF to Topic
  const handleUploadPdfSubmit = (e) => {
    e.preventDefault();
    if (!pdfTitle.trim()) {
      toast.error("Please enter a title for the PDF");
      return;
    }
    if (!pdfFile) {
      toast.error("Please choose a PDF file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("title", pdfTitle.trim());
    formData.append("pdf", pdfFile);

    addPdfToTopic(
      { courseId, topicId: activeTopicForUpload._id, formData },
      {
        onSuccess: () => {
          setPdfTitle("");
          setPdfFile(null);
          setActiveTopicForUpload(null);
        },
      }
    );
  };

  // Calculate total PDFs count
  const totalPdfs = course?.topics?.reduce(
    (acc, topic) => acc + (topic.pdfs?.length || 0),
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => navigate("/admindashboard/course")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {course?.title}
              </h1>
              <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full uppercase tracking-wider">
                PDF Course
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {course?.topics?.length || 0} Topics • {totalPdfs} Total PDF Documents
            </p>
          </div>

          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-2 text-sm shrink-0"
          >
            <FolderPlus className="w-4 h-4" /> Add Topic
          </button>
        </div>
      </div>

      {/* Topics & PDFs Container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {course?.topics && course.topics.length > 0 ? (
          course.topics.map((topic, index) => {
            const isExpanded = expandedTopics[topic._id] !== false; // expanded by default

            return (
              <div
                key={topic._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Topic Header Strip */}
                <div className="p-5 flex items-center justify-between bg-slate-50/80 border-b border-slate-100">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                    onClick={() => toggleTopicExpand(topic._id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {topic.topicName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {topic.pdfs?.length || 0} {topic.pdfs?.length === 1 ? "PDF Document" : "PDF Documents"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTopicForUpload(topic)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add PDF
                    </button>

                    <button
                      disabled={isDeletingTopic}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete topic "${topic.topicName}" and all its PDFs?`
                          )
                        ) {
                          deleteTopic({ courseId, topicId: topic._id });
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleTopicExpand(topic._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* PDFs Inside Topic */}
                {isExpanded && (
                  <div className="p-5">
                    {topic.pdfs && topic.pdfs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topic.pdfs.map((pdf, pIdx) => (
                          <div
                            key={pdf._id || pIdx}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate" title={pdf.title}>
                                  {pdf.title}
                                </p>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(pdf.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <a
                                href={pdf.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                title="Open PDF in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                disabled={isDeletingPdf}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete PDF "${pdf.title}"?`
                                    )
                                  ) {
                                    deletePdfFromTopic({
                                      courseId,
                                      topicId: topic._id,
                                      pdfId: pdf._id,
                                    });
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete PDF"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-xs">No PDFs in this topic yet.</p>
                        <button
                          onClick={() => setActiveTopicForUpload(topic)}
                          className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          + Upload first PDF
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <FolderPlus className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Topics Created Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Create topics (chapters/subjects) first, then upload multiple PDFs under each topic.
            </p>
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-700 transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Topic
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add Topic */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Add New Topic
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a chapter or subject topic for this course (e.g. "Reasoning Ability - Topic 1").
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTopicSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Topic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 1: General Awareness & Current Affairs"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingTopic}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingTopic && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Topic
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Upload PDF to Topic */}
      <Dialog
        open={Boolean(activeTopicForUpload)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveTopicForUpload(null);
            setPdfTitle("");
            setPdfFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Upload PDF
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload a document to topic:{" "}
              <strong className="text-slate-700">{activeTopicForUpload?.topicName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadPdfSubmit} className="space-y-4 mt-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                PDF Title / Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Hand-Written Notes Part 1"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select PDF File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                required
                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTopicForUpload(null);
                  setPdfTitle("");
                  setPdfFile(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingPdf}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isAddingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading PDF...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicPdfManager;
