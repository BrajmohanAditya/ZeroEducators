import React, { useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useCreateEbookHook,
  useEditEbookHook,
} from "../../../hooks/eBook.jsx/ebook.hook";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

const CreateEbookDialog = ({ editingEbook, onCloseEdit }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset: resetForm,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      numberOfChapters: 0,
      maxQuestionsPerChapter: 0,
      amount: 0,
    },
  });

  const { mutate: createEbook, isPending: isCreating } = useCreateEbookHook();
  const { mutate: editEbook, isPending: isEditing } = useEditEbookHook();

  const isPending = isCreating || isEditing;
  const thumbnail = watch("thumbnail");
  const pdf = watch("pdf");

  useEffect(() => {
    if (editingEbook) {
      setIsOpen(true);
      resetForm({
        title: editingEbook.title,
        numberOfChapters: editingEbook.numberOfChapters || 0,
        maxQuestionsPerChapter: editingEbook.maxQuestionsPerChapter || 0,
        amount: editingEbook.amount || 0,
      });
    }
  }, [editingEbook, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({
        title: "",
        numberOfChapters: 0,
        maxQuestionsPerChapter: 0,
        amount: 0,
      });
      if (onCloseEdit) onCloseEdit();
    }
  };

  const createEbookHandler = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("numberOfChapters", Number(data.numberOfChapters || 0));
    formData.append(
      "maxQuestionsPerChapter",
      Number(data.maxQuestionsPerChapter || 0),
    );
    formData.append("amount", Number(data.amount || 0));

    if (data.thumbnail && data.thumbnail[0]) {
      formData.append("thumbnail", data.thumbnail[0]);
    }

    if (data.pdf && data.pdf[0]) {
      formData.append("pdf", data.pdf[0]);
    }

    if (editingEbook) {
      editEbook(
        { id: editingEbook._id, formData },
        {
          onSuccess: () => {
            handleOpenChange(false);
          },
        },
      );
    } else {
      createEbook(formData, {
        onSuccess: () => {
          handleOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 transition cursor-pointer shadow-md shadow-violet-200"
        disabled={isPending}
        onClick={() => {
          resetForm({
            title: "",
            numberOfChapters: 0,
            maxQuestionsPerChapter: 0,
            amount: 0,
          });
          if (onCloseEdit) onCloseEdit();
        }}
      >
        + Add eBook
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh] custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {editingEbook ? "Edit eBook" : "Add New eBook"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Fill in the details below to upload a new eBook.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-6 space-y-4 text-slate-700"
          onSubmit={handleSubmit(createEbookHandler)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Title
              </label>
              <select
                {...register("title", { required: true })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">Select Title</option>
                <option value="NDA">NDA</option>
                <option value="CDS">CDS</option>
                <option value="AFCAT">AFCAT</option>
                <option value="NDA-CDS-AFCAT">NDA-CDS-AFCAT-CAPF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Price (₹)
              </label>
              <input
                type="number"
                {...register("amount", { required: true, min: 0 })}
                placeholder="Price (0 for free)"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Number of Chapters
              </label>
              <input
                type="number"
                {...register("numberOfChapters", { required: true, min: 0 })}
                placeholder="e.g., 12"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Max Questions Per Chapter
              </label>
              <input
                type="number"
                {...register("maxQuestionsPerChapter", {
                  required: true,
                  min: 0,
                })}
                placeholder="0 for no limit"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Cover Image
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-400 transition-colors overflow-hidden">
                {thumbnail && thumbnail.length > 0 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-indigo-50/30 text-center">
                    <p className="text-xs font-semibold text-indigo-700 mb-0.5">
                      Cover Selected!
                    </p>
                    <p className="text-[10px] text-indigo-600 truncate max-w-full px-2 py-0.5 bg-indigo-100 rounded-full">
                      {thumbnail[0].name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                    <p className="text-xs text-slate-600 font-semibold mb-0.5">
                      Upload Cover
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PNG, JPG (Recommended: 3:4 aspect ratio, e.g., 600x800px)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  {...register("thumbnail", { required: !editingEbook })}
                  className="hidden"
                />
              </label>
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                PDF File
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-400 transition-colors overflow-hidden">
                {pdf && pdf.length > 0 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-emerald-50/30 text-center">
                    <FileText className="w-6 h-6 text-emerald-600 mb-0.5" />
                    <p className="text-xs font-semibold text-emerald-700 mb-0.5 animate-pulse">
                      PDF Attached!
                    </p>
                    <p className="text-[10px] text-emerald-600 truncate max-w-full px-2 py-0.5 bg-emerald-100 rounded-full">
                      {pdf[0].name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <FileText className="w-6 h-6 mb-1 text-slate-400" />
                    <p className="text-xs text-slate-600 font-semibold mb-0.5">
                      Upload PDF
                    </p>
                    <p className="text-[10px] text-slate-400">PDF document</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  {...register("pdf", { required: false })}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            disabled={isPending}
            type="submit"
            className="w-full py-3 mt-4 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 flex items-center justify-center text-white rounded-lg font-semibold shadow-md transition"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editingEbook ? (
              "Update eBook"
            ) : (
              "Create eBook"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEbookDialog;
