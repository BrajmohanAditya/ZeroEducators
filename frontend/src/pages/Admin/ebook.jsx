import React, { useState } from "react";
import {
  BookOpen,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  FileText,
  ExternalLink,
  Plus,
} from "lucide-react";
import CreateEbookDialog from "../../components/Admin/ebook/create.Ebook";
import AddChapterDialog from "../../components/Admin/ebook/add.chapter";
import ManageQuestionsDialog from "../../components/Admin/ebook/manage.questions";
import {
  useGetEbooksHook,
  useDeleteEbookHook,
} from "../../hooks/eBook.jsx/ebook.hook";
import { format } from "date-fns";
import DeleteAlertbox from "@/components/ui/DeleteAlertbox";
import { Layers } from "lucide-react";

const EbookCreate = () => {
  const { data, isLoading, isError, refetch } = useGetEbooksHook();
  const ebooks = data?.ebooks || [];
  const { mutate: deleteEbook, isPending: isDeleting } = useDeleteEbookHook();

  const [editingEbook, setEditingEbook] = useState(null);
  const [ebookToDelete, setEbookToDelete] = useState(null);
  const [ebookForChapter, setEbookForChapter] = useState(null);
  const [ebookForQuestions, setEbookForQuestions] = useState(null);

  const handleDeleteEbook = (ebook) => {
    setEbookToDelete(ebook);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              eBook Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View, edit, and manage all academic eBooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <CreateEbookDialog
            editingEbook={editingEbook}
            onCloseEdit={() => setEditingEbook(null)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[400px] w-full overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 mt-2 text-sm">Loading eBooks...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-red-500">
            <p className="font-semibold">Failed to load eBooks.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              Try Again
            </button>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No eBooks Found
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Add your first eBook by clicking the "Add eBook" button above.
            </p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh] custom-scrollbar rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100/80 backdrop-blur sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-bold">eBook Cover & Title</th>
                  <th className="px-6 py-4 font-bold">Chapters</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Created At</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ebooks.map((ebook) => (
                  <tr
                    key={ebook._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                          {ebook.thumbnail ? (
                            <img
                              src={ebook.thumbnail}
                              alt={ebook.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 truncate max-w-[250px]">
                            {ebook.title}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <div>{ebook.numberOfChapters || 0} Chapters</div>
                      {ebook.maxQuestionsPerChapter > 0 ? (
                        <div className="text-xs text-slate-400 font-normal">
                          Max: {ebook.maxQuestionsPerChapter} Qs/Ch
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-normal">
                          No Limit
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ebook.amount > 0 ? (
                        <span className="font-semibold text-slate-700">
                          ₹{ebook.amount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {ebook.createdAt
                        ? format(new Date(ebook.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEbookForQuestions(ebook)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Manage Questions"
                        >
                          <Layers className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => setEbookForChapter(ebook)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Add Chapter"
                        >
                          <Plus className="w-4.5 h-4.5" />
                        </button>
                        {ebook.pdfUrl && (
                          <a
                            href={ebook.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="View/Download PDF"
                          >
                            <ExternalLink className="w-4.5 h-4.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setEditingEbook(ebook)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit eBook"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEbook(ebook)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete eBook"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteAlertbox
        isOpen={!!ebookToDelete}
        itemName={ebookToDelete?.title}
        isDeleting={isDeleting}
        onCancel={() => setEbookToDelete(null)}
        onConfirm={() => {
          deleteEbook(ebookToDelete?._id, {
            onSuccess: () => setEbookToDelete(null),
          });
        }}
      />

      <AddChapterDialog
        isOpen={!!ebookForChapter}
        ebook={ebookForChapter}
        onClose={() => setEbookForChapter(null)}
      />

      <ManageQuestionsDialog
        isOpen={!!ebookForQuestions}
        ebook={ebookForQuestions}
        onClose={() => setEbookForQuestions(null)}
      />
    </div>
  );
};

export default EbookCreate;
