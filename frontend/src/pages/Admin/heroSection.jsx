import React, { useState } from "react";
import {
  Plus,
  Image as ImageIcon,
  Newspaper,
  FileText,
  AlignLeft,
  Link as LinkIcon,
  Upload,
  Save,
  Loader2,
} from "lucide-react";

import { TabButton, RadioButton } from "@/components/ui/HeroButton";
import { toast } from "sonner";
import {
  useCreateHeroSectionHook,
  useGetHeroSectionHook,
  useDeleteHeroSectionHook,
} from "@/hooks/hero.hook";
import ExamsTable, { BannerTable } from "@/components/Admin/HeroSection";
const HeroSectionManagement = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [type, setType] = useState("banner");

  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const { data, isLoading } = useGetHeroSectionHook();

  const { mutateAsync: createHero, isPending } = useCreateHeroSectionHook();
  const { mutateAsync: deleteHero, isPending: isDeleting } =
    useDeleteHeroSectionHook();

  const handleSave = async () => {
    // 1. Validation
    if (!title) return toast.error("Please enter a title");
    if (type === "banner" && !image)
      return toast.error("Please upload a banner image");
    if (type === "exam" && !logo)
      return toast.error("Please upload an exam logo");

    // 2. Prepare Data
    const formData = new FormData();
    // Backend expects 'upcoming_exam' instead of 'exam'
    const backendType = type === "exam" ? "upcoming_exam" : "banner";
    formData.append("type", backendType);
    formData.append("title", title);

    // Backend expects the file to be named 'image' in the form data
    if (type === "banner" && image) {
      formData.append("image", image);
    } else if (type === "exam" && logo) {
      formData.append("image", logo); // Send logo as 'image'
    }

    // 3. Call Hook
    await createHero(formData, {
      onSuccess: () => {
        // Clear the form after a successful save
        setTitle("");
        setImage(null);
        setLogo(null);
      },
    });
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 p-6 md:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Banner & Upcoming Exam{" "}
          </h1>
          <p className="text-slate-500 mt-1">
            Create banners and upcoming exams
          </p>
        </div>

        {/* Tabs Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-2 mb-6 shadow-sm w-full max-w-fit">
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
            icon={Plus}
            label="Create Banner/Exam"
          />
          <TabButton
            active={activeTab === "banners"}
            onClick={() => setActiveTab("banners")}
            icon={ImageIcon}
            label="Banners"
          />
          <TabButton
            active={activeTab === "exams"}
            onClick={() => setActiveTab("exams")}
            icon={Newspaper}
            label="Exams"
          />
        </div>

        {/* We will add the Form Content here in Step 3 */}
        {activeTab === "create" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-violet-600 text-white p-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Banner or Exam
              </h2>
              <p className="text-violet-200 text-sm mt-1.5">
                Fill in the details to create a new banner or upcoming exam
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* 1. Type Selection */}
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                  Type <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="flex space-x-6">
                  <RadioButton
                    name="type"
                    value="banner"
                    checked={type === "banner"}
                    onChange={() => setType("banner")}
                    label="Banner"
                  />
                  <RadioButton
                    name="type"
                    value="exam"
                    checked={type === "exam"}
                    onChange={() => setType("exam")}
                    label="Upcoming Exam"
                  />
                </div>
              </div>

              {/* 2. Title Input */}
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  <AlignLeft className="w-4 h-4 mr-2 text-indigo-600" />
                  Title <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title here..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              {/* 3. Main Image Upload */}
              {type === "banner" && (
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                    <ImageIcon className="w-4 h-4 mr-2 text-indigo-600" />
                    Banner <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          Banner
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Recommended: 1200 x 480px (Wide)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setImage(e.target.files[0])}
                      />
                    </label>
                  </div>
                  {/* Optional: Show selected file name */}
                  {image && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {image.name}
                    </p>
                  )}
                </div>
              )}

              {/* 4. Conditional Logo Upload (Only for Exams) */}
              {type === "exam" && (
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                    <ImageIcon className="w-4 h-4 mr-2 text-indigo-600" />
                    Exam Logo <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          logo
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Recommended: 512 x 512px (Square)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogo(e.target.files[0])}
                      />
                    </label>
                  </div>
                  {/* Optional: Show selected file name */}
                  {logo && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {logo.name}
                    </p>
                  )}
                </div>
              )}

              {/* 5. Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full flex cursor-pointer items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save {type === "banner" ? "Banner" : "Exam"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banners Tab */}
        {/* Banners Tab */}
        {activeTab === "banners" && (
          <BannerTable
            bannersData={data?.banners}
            deleteHero={deleteHero}
            isDeleting={isDeleting}
          />
        )}

        {activeTab === "exams" && (
          <ExamsTable
            examsData={data?.upcomingExams}
            deleteHero={deleteHero}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
};

export default HeroSectionManagement;
