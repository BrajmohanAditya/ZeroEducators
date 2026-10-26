import { AlertCircle, Trash2, Loader2 } from "lucide-react";

const DeleteAlertbox = ({ isOpen, itemName, onConfirm, onCancel, isDeleting }) => {

  if (!isOpen) return null; // Agar isOpen false hai, toh kuch mat dikhao

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <AlertCircle className="text-red-500 w-6 h-6" /> Confirm Delete
        </h2>
        
        <p className="mt-3 text-slate-600 text-sm">
          Are you sure you want to delete <b className="text-black">{itemName}</b>? This action cannot be undone.
        </p>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onCancel} 
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>

          <button 
            type="button"
            onClick={onConfirm} 
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer shadow-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAlertbox;
