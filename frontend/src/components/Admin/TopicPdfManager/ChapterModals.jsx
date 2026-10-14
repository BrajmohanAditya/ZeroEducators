import React, { useState, useEffect } from "react";
import { BookOpen, Edit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const AddChapterModal = ({ activeSubject, onClose, onAdd, isAdding }) => {
  const [chapterName, setChapterName] = useState("");

  useEffect(() => {
    if (!activeSubject) {
      setChapterName("");
    }
  }, [activeSubject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chapterName.trim()) return;
    onAdd(chapterName.trim());
  };

  return (
    <Dialog open={Boolean(activeSubject)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Add Chapter
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Adding chapter under subject:{" "}
            <strong className="text-slate-800">{activeSubject?.subjectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Chapter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 1: Introduction to Retail Banking"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Chapter
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EditChapterModal = ({ editingChapter, onClose, onUpdate, isUpdating }) => {
  const [editChapterName, setEditChapterName] = useState("");

  useEffect(() => {
    if (editingChapter) {
      setEditChapterName(editingChapter.chapterName || "");
    } else {
      setEditChapterName("");
    }
  }, [editingChapter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editChapterName.trim()) return;
    onUpdate(editChapterName.trim());
  };

  return (
    <Dialog open={Boolean(editingChapter)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" /> Edit Module / Chapter
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Rename this module or chapter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Module / Chapter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. MODULE A UNIT 1"
              value={editChapterName}
              onChange={(e) => setEditChapterName(e.target.value)}
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              disabled={isUpdating}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
