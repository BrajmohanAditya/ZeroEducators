import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreateCourseHook, useEditCourseHook, useGetCourseHook } from "../../hooks/course.hook";
import { useGetExamsHook } from "../../hooks/quiz/exam.hook";
import {
  Loader2,
  UploadCloud,
  Gift,
  CreditCard,
  Sparkles,
  Video,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Package,
  Layers,
  Check,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

// Helpers for calendar date selection & formatting
const getTodayDateString = () => new Date().toISOString().split("T")[0];

const getDefaultTargetDate = (monthsFromNow = 6) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toISOString().split("T")[0];
};

const formatDateToValidTill = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return `Valid till ${d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

const extractDateFromDuration = (durationStr) => {
  if (!durationStr) return "";
  const match = durationStr.match(/valid\s*(?:till|until)\s*[:\-]?\s*(.+)/i);
  const toParse = match ? match[1].trim() : durationStr.trim();
  const d = new Date(toParse);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2020) {
    return d.toISOString().split("T")[0];
  }
  return "";
};

const CreateCourseDialog = ({ editingCourse, onCloseEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [courseType, setCourseType] = useState("video");
  const [pricingPlans, setPricingPlans] = useState(() => [
    { duration: formatDateToValidTill(getDefaultTargetDate(6)), price: "999", label: "" },
  ]);

  const { data: allCoursesData } = useGetCourseHook();
  const { data: allExamsData } = useGetExamsHook();
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [selectedBundledCourses, setSelectedBundledCourses] = useState([]);
  const [selectedBundledExams, setSelectedBundledExams] = useState([]);
  const [bundleSubTab, setBundleSubTab] = useState("courses"); // "courses" | "exams"
  const [bundleSearchTerm, setBundleSearchTerm] = useState("");
  const [bundleExamSearchTerm, setBundleExamSearchTerm] = useState("");

  const { register, handleSubmit, reset: resetForm, watch, setValue } = useForm({
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      duration: "",
    },
  });

  const { mutate: createCourse, isPending: isCreating } = useCreateCourseHook();
  const { mutate: editCourse, isPending: isEditing } = useEditCourseHook();

  const isPending = isCreating || isEditing;
  const thumbnail = watch("thumbnail");

  useEffect(() => {
    if (editingCourse) {
      setIsOpen(true);
      const isFree = editingCourse.isFree || Number(editingCourse.amount) === 0;
      setIsFreeMode(isFree);
      setCourseType(editingCourse.courseType || "video");

      if (editingCourse.pricingPlans && editingCourse.pricingPlans.length > 0) {
        setPricingPlans(
          editingCourse.pricingPlans.map((p) => ({
            duration: p.duration,
            price: String(p.price),
            label: p.label || "",
          }))
        );
      } else if (!isFree && editingCourse.amount) {
        setPricingPlans([
          {
            duration: editingCourse.duration || "6 Months",
            price: String(editingCourse.amount),
            label: "",
          },
        ]);
      } else {
        setPricingPlans([
          {
            duration: formatDateToValidTill(getDefaultTargetDate(6)),
            price: "999",
            label: "",
          },
        ]);
      }

      resetForm({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        amount: isFree ? 0 : editingCourse.amount,
        duration: editingCourse.duration || "",
      });

      setIsBundleMode(Boolean(editingCourse.isBundle));
      if (editingCourse.bundledCourses && Array.isArray(editingCourse.bundledCourses)) {
        setSelectedBundledCourses(
          editingCourse.bundledCourses.map((c) => (typeof c === "object" ? c._id : c))
        );
      } else {
        setSelectedBundledCourses([]);
      }
      if (editingCourse.bundledExams && Array.isArray(editingCourse.bundledExams)) {
        setSelectedBundledExams(
          editingCourse.bundledExams.map((e) => (typeof e === "object" ? e._id : e))
        );
      } else {
        setSelectedBundledExams([]);
      }
    } else {
      setIsFreeMode(false);
      setIsBundleMode(false);
      setSelectedBundledCourses([]);
      setSelectedBundledExams([]);
      setBundleSubTab("courses");
      setCourseType("video");
      setPricingPlans([
        {
          duration: formatDateToValidTill(getDefaultTargetDate(6)),
          price: "999",
          label: "",
        },
      ]);
    }
  }, [editingCourse, resetForm]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      resetForm({});
      setIsFreeMode(false);
      setPricingPlans([
        {
          duration: formatDateToValidTill(getDefaultTargetDate(6)),
          price: "999",
          label: "",
        },
      ]);
      setIsBundleMode(false);
      setSelectedBundledCourses([]);
      setSelectedBundledExams([]);
      setBundleSubTab("courses");
      setBundleSearchTerm("");
      setBundleExamSearchTerm("");
      if (onCloseEdit) onCloseEdit();
    }
  };

  const handleToggleFreeMode = (free) => {
    setIsFreeMode(free);
  };

  const addPricingPlan = () => {
    setPricingPlans((prev) => [
      ...prev,
      {
        duration: formatDateToValidTill(getDefaultTargetDate(6)),
        price: "",
        label: "",
      },
    ]);
  };

  const removePricingPlan = (index) => {
    if (pricingPlans.length <= 1) return;
    setPricingPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePricingPlan = (index, field, value) => {
    setPricingPlans((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  // Available non-bundle courses that can be bundled
  const availableCoursesForBundle = React.useMemo(() => {
    return (allCoursesData?.courses || []).filter(
      (c) => (!editingCourse || c._id !== editingCourse._id) && !c.isBundle
    );
  }, [allCoursesData?.courses, editingCourse]);

  const selectedCoursesList = React.useMemo(() => {
    return availableCoursesForBundle.filter((c) =>
      selectedBundledCourses.includes(c._id)
    );
  }, [availableCoursesForBundle, selectedBundledCourses]);

  const availableExamsForBundle = React.useMemo(() => {
    return allExamsData?.exams || [];
  }, [allExamsData?.exams]);

  const selectedExamsList = React.useMemo(() => {
    return availableExamsForBundle.filter((e) =>
      selectedBundledExams.includes(e._id)
    );
  }, [availableExamsForBundle, selectedBundledExams]);

  const totalBundleOriginalPrice = React.useMemo(() => {
    const coursesPrice = selectedCoursesList.reduce((sum, c) => {
      const p = Number(c.amount || c.pricingPlans?.[0]?.price || 0);
      return sum + p;
    }, 0);
    const examsPrice = selectedExamsList.reduce((sum, e) => {
      const p = Number(e.price || 0);
      return sum + p;
    }, 0);
    return coursesPrice + examsPrice;
  }, [selectedCoursesList, selectedExamsList]);

  const toggleCourseInBundle = (courseId) => {
    setSelectedBundledCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleExamInBundle = (examId) => {
    setSelectedBundledExams((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId]
    );
  };

  const createCourseHandler = (data) => {
    const validPlans = pricingPlans
      .filter((p) => p.duration && p.price !== "" && p.price !== undefined)
      .map((p) => ({
        duration: p.duration.trim(),
        price: Number(p.price),
        label: p.label ? p.label.trim() : "",
      }));

    const totalSelectedBundleItems = selectedBundledCourses.length + selectedBundledExams.length;
    if (isBundleMode && totalSelectedBundleItems < 2) {
      toast.error("Please select at least 2 items (courses and/or mock tests) to create a Combo Pack");
      return;
    }

    if (!isFreeMode && validPlans.length === 0) {
      toast.error("Please add at least one valid pricing plan with duration and price");
      return;
    }

    const finalAmount = isFreeMode
      ? 0
      : validPlans.length > 0
      ? validPlans[0].price
      : Number(data.amount || 0);

    const finalDuration = isFreeMode
      ? "Lifetime"
      : validPlans.length > 0
      ? validPlans.map((p) => p.duration).join(" / ")
      : data.duration || "";

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("amount", finalAmount);
    formData.append("isFree", isFreeMode ? "true" : "false");
    formData.append("duration", finalDuration);
    formData.append("courseType", courseType);
    formData.append("isBundle", isBundleMode ? "true" : "false");
    if (isBundleMode) {
      formData.append("bundledCourses", JSON.stringify(selectedBundledCourses));
      formData.append("bundledExams", JSON.stringify(selectedBundledExams));
      formData.append("bundleOriginalPrice", totalBundleOriginalPrice);
    } else {
      formData.append("bundledCourses", JSON.stringify([]));
      formData.append("bundledExams", JSON.stringify([]));
      formData.append("bundleOriginalPrice", "0");
    }

    if (!isFreeMode && validPlans.length > 0) {
      formData.append("pricingPlans", JSON.stringify(validPlans));
    } else if (isFreeMode) {
      formData.append("pricingPlans", JSON.stringify([]));
    }

    if (data.thumbnail && data.thumbnail[0]) {
      formData.append("thumbnail", data.thumbnail[0]);
    }

    if (editingCourse) {
      editCourse(
        { courseId: editingCourse._id, formData },
        {
          onSuccess: (res) => {
            handleOpenChange(false);
          },
        }
      );
    } else {
      createCourse(formData, {
        onSuccess: (res) => {
          toast.success(res.message || "Course created successfully");
          handleOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-1.5 text-sm"
        disabled={isPending}
        onClick={() => {
          resetForm({});
          setIsFreeMode(false);
          if (onCloseEdit) onCloseEdit();
        }}
      >
        + Add Course
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">
            {editingCourse ? "Edit Course" : "Create New Course"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Set course details, duration, pricing type (Free or Paid), and cover image.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-3 space-y-4 text-left"
          onSubmit={handleSubmit(createCourseHandler)}
        >
          {/* Course Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", { required: true })}
              placeholder="e.g. Complete Banking Foundation Batch 2026"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", { required: true })}
              placeholder="Detailed overview of what students will learn in this course..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Course Content Type: Video vs PDF */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Content Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourseType("video")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  courseType === "video"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Course</span>
              </button>

              <button
                type="button"
                onClick={() => setCourseType("pdf")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  courseType === "pdf"
                    ? "border-purple-600 bg-purple-50/70 text-purple-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PDF Course (Notes)</span>
              </button>
            </div>
          </div>

          {/* Bundle / Combo Course Toggle */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                    Combo / Bundle Course Pack
                  </label>
                  <p className="text-[11px] text-amber-700">
                    Group 2 or more existing courses into a discounted package
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBundleMode}
                  onChange={(e) => setIsBundleMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isBundleMode && (
              <div className="space-y-2.5 pt-2 border-t border-amber-200/70">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">
                      Combo Content:
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      {selectedBundledCourses.length} Courses, {selectedBundledExams.length} Mock Tests
                    </span>
                  </div>
                  {totalBundleOriginalPrice > 0 && (
                    <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Combined MRP: ₹{totalBundleOriginalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Sub-tabs to choose Courses vs Mock Tests */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-amber-100/60 rounded-xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setBundleSubTab("courses")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      bundleSubTab === "courses"
                        ? "bg-white text-amber-950 shadow-xs border border-amber-300"
                        : "text-amber-800 hover:text-amber-950 hover:bg-amber-100/50"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-amber-600" />
                    <span>Courses ({selectedBundledCourses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBundleSubTab("exams")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      bundleSubTab === "exams"
                        ? "bg-white text-amber-950 shadow-xs border border-amber-300"
                        : "text-amber-800 hover:text-amber-950 hover:bg-amber-100/50"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mock Tests ({selectedBundledExams.length})</span>
                  </button>
                </div>

                {/* Tab 1: Video & PDF Courses */}
                {bundleSubTab === "courses" && (
                  <div className="space-y-2">
                    {availableCoursesForBundle.length > 4 && (
                      <input
                        type="text"
                        value={bundleSearchTerm}
                        onChange={(e) => setBundleSearchTerm(e.target.value)}
                        placeholder="Search courses to add..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {availableCoursesForBundle.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No other courses available to bundle</p>
                      ) : (
                        availableCoursesForBundle
                          .filter((c) =>
                            bundleSearchTerm
                              ? c.title.toLowerCase().includes(bundleSearchTerm.toLowerCase())
                              : true
                          )
                          .map((courseItem) => {
                            const isSelected = selectedBundledCourses.includes(courseItem._id);
                            const priceVal = Number(
                              courseItem.amount || courseItem.pricingPlans?.[0]?.price || 0
                            );
                            return (
                              <div
                                key={courseItem._id}
                                onClick={() => toggleCourseInBundle(courseItem._id)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isSelected
                                    ? "bg-amber-100/70 border-amber-400 text-amber-950 font-semibold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate mr-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                                  />
                                  <div className="truncate">
                                    <span className="truncate block font-semibold">{courseItem.title}</span>
                                    <span className="text-[10px] text-slate-500">
                                      {courseItem.courseType === "pdf" ? "PDF Course" : "Video Course"}
                                    </span>
                                  </div>
                                </div>
                                <span className="shrink-0 text-slate-500 font-bold">
                                  ₹{priceVal.toLocaleString()}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Mock Tests */}
                {bundleSubTab === "exams" && (
                  <div className="space-y-2">
                    {availableExamsForBundle.length > 4 && (
                      <input
                        type="text"
                        value={bundleExamSearchTerm}
                        onChange={(e) => setBundleExamSearchTerm(e.target.value)}
                        placeholder="Search mock tests to add..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {availableExamsForBundle.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No mock tests available</p>
                      ) : (
                        availableExamsForBundle
                          .filter((e) =>
                            bundleExamSearchTerm
                              ? e.title?.toLowerCase().includes(bundleExamSearchTerm.toLowerCase()) ||
                                e.category?.toLowerCase().includes(bundleExamSearchTerm.toLowerCase())
                              : true
                          )
                          .map((examItem) => {
                            const isSelected = selectedBundledExams.includes(examItem._id);
                            const priceVal = Number(examItem.price || 0);
                            return (
                              <div
                                key={examItem._id}
                                onClick={() => toggleExamInBundle(examItem._id)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isSelected
                                    ? "bg-amber-100/70 border-amber-400 text-amber-950 font-semibold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate mr-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                                  />
                                  <div className="truncate">
                                    <span className="truncate block font-semibold">{examItem.title}</span>
                                    {examItem.category && (
                                      <span className="text-[10px] text-amber-800 font-medium">
                                        {examItem.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="shrink-0 text-slate-600 font-bold">
                                  {priceVal > 0 ? `₹${priceVal.toLocaleString()}` : "Free"}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {(selectedBundledCourses.length + selectedBundledExams.length) >= 2 &&
                  pricingPlans[0]?.price &&
                  totalBundleOriginalPrice > Number(pricingPlans[0].price) && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs text-emerald-800 font-semibold">
                      <span>🎉 Combo Discount:</span>
                      <span className="font-bold text-emerald-700">
                        Save ₹{(totalBundleOriginalPrice - Number(pricingPlans[0].price)).toLocaleString()} (
                        {Math.round(
                          ((totalBundleOriginalPrice - Number(pricingPlans[0].price)) /
                            totalBundleOriginalPrice) *
                            100
                        )}
                        % OFF)
                      </span>
                    </div>
                  )}
              </div>
            )}</div>

          {/* Free vs Paid Toggle Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Course Pricing Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleFreeMode(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  !isFreeMode
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Paid Course</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleFreeMode(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-xs transition cursor-pointer ${
                  isFreeMode
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Free Course (₹0)</span>
              </button>
            </div>
          </div>

          {/* Pricing & Validity Section */}
          {isFreeMode ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800">FREE COURSE</p>
                <p className="text-[11px] text-emerald-600">Students can enroll directly at no cost.</p>
              </div>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-black px-2.5 py-1 rounded-full">
                ₹0 / Free
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pricing & Validity Plans <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Add multiple options (e.g. 6 Months ₹999, 12 Months ₹10,000)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPricingPlan}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {pricingPlans.map((plan, idx) => {
                  const extractedDate = extractDateFromDuration(plan.duration);
                  const selectedDateVal = extractedDate || getDefaultTargetDate(6);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span>Plan Option {idx + 1}</span>
                          {plan.duration && (
                            <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                              {plan.duration}
                            </span>
                          )}
                        </span>
                        {pricingPlans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePricingPlan(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                        {/* Validity Calendar Picker */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              Select Expiry Date *
                            </span>
                          </label>
                          <input
                            type="date"
                            required
                            min={getTodayDateString()}
                            value={selectedDateVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                updatePricingPlan(idx, "duration", formatDateToValidTill(val));
                              }
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-blue-700">Display:</span> {plan.duration || formatDateToValidTill(selectedDateVal)}
                          </p>
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={plan.price}
                            onChange={(e) =>
                              updatePricingPlan(idx, "price", e.target.value)
                            }
                            placeholder="e.g. 999"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Student will pay ₹{plan.price || 0} for this plan.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modern Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Course Thumbnail
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors overflow-hidden">
              {thumbnail && thumbnail.length > 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50/50 p-2 text-center">
                  <p className="text-xs font-bold text-blue-700 mb-1">
                    Thumbnail Selected! 🎉
                  </p>
                  <p className="text-[11px] text-blue-600 truncate max-w-[85%] px-3 py-1 bg-blue-100 rounded-full font-medium">
                    {thumbnail[0].name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <UploadCloud className="w-6 h-6 mb-1.5 text-slate-400" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Click to upload course thumbnail
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Recommended: 16:9 (e.g. 1280x720)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                {...register("thumbnail", { required: !editingCourse })}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              type="submit"
              className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : editingCourse ? (
                "Update Course"
              ) : (
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;
