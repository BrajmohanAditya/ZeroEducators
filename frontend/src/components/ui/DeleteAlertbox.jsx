import { AlertCircle, Trash2, Loader2 } from "lucide-react";

const DeleteAlertbox = ({ isOpen, itemName, onConfirm, onCancel, isDeleting }) => {

  if (!isOpen) return null; // Agar isOpen false hai, toh kuch mat dikhao

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl border">
        
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <AlertCircle className="text-red-500 w-6 h-6" /> Confirm Delete
        </h2>
        
        <p className="mt-3 text-slate-600">
          Are you sure you want to delete <b className="text-black">{itemName}</b>?
        </p>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={18} /> Delete
              </>
            )}
          </button>

        </div>
        
      </div>
    </div>
  );
};

export default DeleteAlertbox;
