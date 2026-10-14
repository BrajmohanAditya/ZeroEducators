import React, { useState, useEffect } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const AddPdfModal = ({ activeChapter, onClose, onUpload, isAdding }) => {
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    if (!activeChapter) {
      setPdfTitle("");
      setPdfFile(null);
    }
  }, [activeChapter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pdfTitle.trim()) {
      toast.error("Please enter a title for the PDF");
      return;
    }
    if (!pdfFile) {
      toast.error("Please choose a PDF file to upload");
      return;
    }
    onUpload({ title: pdfTitle.trim(), file: pdfFile });
  };

  return (
    <Dialog open={Boolean(activeChapter)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            Upload PDF Document
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Upload study notes to chapter:{" "}
            <strong className="text-slate-700">{activeChapter?.chapterName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              PDF Title / Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 1 Hand-written Notes"
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
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {isAdding ? (
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
  );
};
