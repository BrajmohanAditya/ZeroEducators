import React, { useState, useEffect } from "react";
import {
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Check,
  Video,
  FileText,
  Layers,
  Loader2,
} from "lucide-react";

export default function ReorderModal({
  isOpen,
  onClose,
  title = "Rearrange Items",
  subtitle = "Change the order of items. Select a position or use up/down arrows.",
  items = [],
  onSave,
  isLoading = false,
}) {
  const [orderedItems, setOrderedItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setOrderedItems([...items]);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= orderedItems.length || fromIndex === toIndex) return;
    const newItems = [...orderedItems];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setOrderedItems(newItems);
  };

  const handleReset = () => {
    setOrderedItems([...items]);
  };

  const handleSave = () => {
    onSave(orderedItems);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isChanged =
    orderedItems.some((item, i) => (item._id || item.id) !== (items[i]?._id || items[i]?.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Layers className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tip banner */}
        <div className="px-5 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <span>
            💡 <strong>Quick Tip:</strong> Use the <strong>Position dropdown</strong> or <strong>↑ / ↓ arrows</strong> to quickly jump items to any position!
          </span>
          {isChanged && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer ml-3 shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {orderedItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No items to reorder.
            </div>
          ) : (
            orderedItems.map((item, idx) => {
              const name = item.chapterName || item.subjectName || item.topicName || item.title || "Untitled";
              const videoCount = item.videos?.length || 0;
              const pdfCount = item.pdfs?.length || 0;
              const isFirst = idx === 0;
              const isLast = idx === orderedItems.length - 1;

              return (
                <div
                  key={item._id || item.id || idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-2 sm:gap-3 p-2.5 rounded-xl border transition-all ${
                    draggedIndex === idx
                      ? "bg-indigo-50 border-indigo-300 shadow-md scale-[1.01]"
                      : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/60"
                  }`}
                >
                  {/* Drag Handle & Position Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Position selector dropdown for fast multi-jump */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-400">#</span>
                      <select
                        value={idx + 1}
                        onChange={(e) => moveItem(idx, Number(e.target.value) - 1)}
                        className="w-11 h-8 px-1 text-xs font-black text-center text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Change position directly"
                      >
                        {orderedItems.map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-slate-900 truncate" title={name}>
                      {name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-500" />
                        {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 text-purple-500" />
                        {pdfCount} {pdfCount === 1 ? "PDF" : "PDFs"}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Buttons (Quick 1-step nudge) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(idx, idx - 1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(idx, idx + 1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {isChanged ? (
              <span className="font-semibold text-amber-600">
                Order modified (unsaved changes)
              </span>
            ) : (
              <span>Order unmodified</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || !isChanged}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
