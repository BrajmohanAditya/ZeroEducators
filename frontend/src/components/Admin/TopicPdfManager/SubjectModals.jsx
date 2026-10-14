import React, { useState, useEffect } from "react";
import { FolderPlus, Edit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const AddSubjectModal = ({ isOpen, onClose, onAdd, isAdding }) => {
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSubjectName("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    onAdd(subjectName.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600" /> Add Subject
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Create a subject for this course (e.g. Retail Banking & Wealth Management, Principles of Banking, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Retail Banking and Wealth Management"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
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
              Add Subject
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EditSubjectModal = ({ editingSubject, onClose, onUpdate, isUpdating }) => {
  const [editSubjectName, setEditSubjectName] = useState("");

  useEffect(() => {
    if (editingSubject) {
      setEditSubjectName(editingSubject.subjectName || "");
    } else {
      setEditSubjectName("");
    }
  }, [editingSubject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editSubjectName.trim()) return;
    onUpdate(editSubjectName.trim());
  };

  return (
    <Dialog open={Boolean(editingSubject)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" /> Edit Subject
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update the title or name of this subject.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Retail Banking and Wealth Management"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
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
