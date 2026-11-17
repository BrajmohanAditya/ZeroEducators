import React, { useState, useEffect } from "react";
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
  Clock,
  Eye,
  EyeOff,
  Flame,
  Check,
} from "lucide-react";

import { TabButton, RadioButton } from "@/components/ui/HeroButton";
import { toast } from "sonner";
import {
  useCreateHeroSectionHook,
  useGetHeroSectionHook,
  useDeleteHeroSectionHook,
  useUpdateOfferTimerHook,
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
  const { mutateAsync: updateTimer, isPending: isUpdatingTimer } =
    useUpdateOfferTimerHook();

  // Offer Timer State
  const [timerTitle, setTimerTitle] = useState("Dussehra Dhamaka");
  const [timerEndDate, setTimerEndDate] = useState("");
  const [timerTargetUrl, setTimerTargetUrl] = useState("#hero-banner");
  const [timerIsActive, setTimerIsActive] = useState(true);

  useEffect(() => {
    if (data?.offerTimer) {
      setTimerTitle(data.offerTimer.title || "Dussehra Dhamaka");
      if (data.offerTimer.endDate) {
        const d = new Date(data.offerTimer.endDate);
        const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setTimerEndDate(isoLocal);
      }
      setTimerTargetUrl(data.offerTimer.targetUrl || "#hero-banner");
      setTimerIsActive(data.offerTimer.isActive !== false);
    }
  }, [data?.offerTimer]);

  const handleSaveTimer = async () => {
    if (!timerTitle.trim()) return toast.error("Please enter an offer title");
    if (!timerEndDate) return toast.error("Please select an end date and time");

    await updateTimer({
      title: timerTitle.trim(),
      endDate: new Date(timerEndDate).toISOString(),
      targetUrl: timerTargetUrl.trim() || "#hero-banner",
      isActive: timerIsActive,
    });
  };

  const handlePresetHours = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setTimerEndDate(isoLocal);
  };

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
          <TabButton
            active={activeTab === "timer"}
            onClick={() => setActiveTab("timer")}
            icon={Clock}
            label="⏱️ Offer Timer"
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

        {/* Dhamaka Offer Timer Tab */}
        {activeTab === "timer" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6" />
                    Dhamaka Offer Countdown Timer Settings
                  </h2>
                  <p className="text-rose-100 text-xs sm:text-sm mt-1">
                    Control the festive offer title, live countdown timer, and visibility in the website header.
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-white border border-white/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Live Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Live Header Preview
                </p>
                <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs max-w-fit">
                  <span className="text-base">👛</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {timerTitle || "Dussehra Dhamaka"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-gradient-to-r from-rose-600 to-pink-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>09:54:58</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  This widget appears in the top navigation bar and clicks down to your offer banner.
                </p>
              </div>

              {/* 1. Offer Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Offer Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  placeholder="e.g. Dussehra Dhamaka, Diwali Special, Weekend Flash Sale"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 2. End Date & Time */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Timer Expiration Date & Time <span className="text-red-500">*</span>
                  </label>
                  {/* Presets */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => handlePresetHours(24)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetHours(72)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetHours(168)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      +7 Days
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={timerEndDate}
                  onChange={(e) => setTimerEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 3. Status Toggle & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Click Target (Scroll to)
                  </label>
                  <input
                    type="text"
                    value={timerTargetUrl}
                    onChange={(e) => setTimerTargetUrl(e.target.value)}
                    placeholder="#hero-banner or #courses"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default: #hero-banner (scrolls directly to the right-side carousel banner)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Visibility Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setTimerIsActive(!timerIsActive)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      timerIsActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {timerIsActive ? (
                      <>
                        <Eye className="w-4 h-4" /> Active (Visible on Website)
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" /> Inactive (Hidden)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSaveTimer}
                  disabled={isUpdatingTimer}
                  className="w-full flex cursor-pointer items-center justify-center px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingTimer ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving Timer...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Save Offer Timer Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSectionManagement;
