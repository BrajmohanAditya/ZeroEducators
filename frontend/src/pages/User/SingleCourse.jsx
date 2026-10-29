import {
  Loader2,
  ShieldCheck,
  BookOpen,
  Clock,
  FileText,
  Tag,
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Percent,
  Package,
  Layers,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGetSingleCourseHook } from "@/hooks/course.hook";
import { usePaymentHook } from "@/hooks/payment.hook";
import { useValidateCouponHook, useGetApplicableCouponsHook } from "@/hooks/coupon.hook";
import { toast } from "sonner";

const SingleCourse = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetSingleCourseHook(id);
  const { mutate, isPending } = usePaymentHook();
  const { mutate: validateCoupon, isPending: isValidatingCoupon } = useValidateCouponHook();
  const course = data?.course;

  // Applicable Coupons for this course
  const { data: couponsData, isLoading: isLoadingCoupons } = useGetApplicableCouponsHook(course?._id);
  const availableCoupons = couponsData?.coupons || [];

  const hasPlans = Boolean(course?.pricingPlans && course.pricingPlans.length > 0 && !course?.isFree);
  const [selectedPlanIndex, setSelectedPlanIndex] = React.useState(0);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, finalAmount }
  const [copiedCode, setCopiedCode] = useState(null);

  const activePlan = hasPlans ? course.pricingPlans[selectedPlanIndex] : null;
  const activePrice = activePlan ? activePlan.price : course?.amount;
  const activeDuration = activePlan
    ? activePlan.duration
    : course?.duration
    ? course.duration
    : "Lifetime Access";

  const totalPdfs = React.useMemo(() => {
    const subjectPdfs =
      course?.subjects?.reduce(
        (acc, s) =>
          acc +
          (s.chapters?.reduce((cAcc, c) => cAcc + (c.pdfs?.length || 0), 0) || 0),
        0
      ) || 0;
    const topicPdfs =
      course?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;
    return subjectPdfs + topicPdfs;
  }, [course?.subjects, course?.topics]);

  const totalSubjectVideos = React.useMemo(() => {
    return (
      course?.subjects?.reduce(
        (acc, s) =>
          acc +
          (s.chapters?.reduce(
            (cAcc, c) => cAcc + (c.videos?.length || 0),
            0
          ) || 0),
        0
      ) || 0
    );
  }, [course?.subjects]);

  const totalTopicVideos = React.useMemo(() => {
    return (
      course?.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0
    );
  }, [course?.topics]);

  const totalVideos =
    totalSubjectVideos + totalTopicVideos > 0
      ? totalSubjectVideos + totalTopicVideos
      : course?.modules?.length || 0;

  const totalSubjectsCount = course?.subjects?.length || 0;
  const totalChaptersCount =
    course?.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) ||
    course?.topics?.length ||
    0;

  // When selected plan changes, reset applied coupon so user can re-apply for new price
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      toast.info("Pricing plan changed. Please re-apply your coupon code.");
    }
  }, [selectedPlanIndex]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    validateCoupon(
      {
        code: couponInput.trim().toUpperCase(),
        courseId: course._id,
        planId: activePlan?._id,
        planDuration: activeDuration,
      },
      {
        onSuccess: (data) => {
          setAppliedCoupon({
            code: data.coupon.code,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
          });
        },
      }
    );
  };

  const handleApplyDirectCode = (code) => {
    setCouponInput(code);
    validateCoupon(
      {
        code: code.trim().toUpperCase(),
        courseId: course._id,
        planId: activePlan?._id,
        planDuration: activeDuration,
      },
      {
        onSuccess: (data) => {
          setAppliedCoupon({
            code: data.coupon.code,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
          });
        },
      }
    );
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed");
  };

  const finalPayablePrice = appliedCoupon ? appliedCoupon.finalAmount : activePrice;
  const isCourseFree = course?.isFree || Number(activePrice) === 0;
  const isFinalFree = isCourseFree || (appliedCoupon && appliedCoupon.finalAmount === 0);

  const purchaseHandler = () => {
    mutate({
      products: {
        _id: course._id,
        name: course.title,
        price: finalPayablePrice,
        image: course.thumbnail,
        planId: activePlan?._id,
        planDuration: activeDuration,
        couponCode: appliedCoupon?.code,
      },
      planId: activePlan?._id,
      planDuration: activeDuration,
      couponCode: appliedCoupon?.code,
    });
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Thumbnail — small fixed height */}
        <div className="w-full p-2 h-52 bg-slate-100">
          <img src={course?.thumbnail} alt={course?.title} className="w-full h-full object-cover rounded-2xl" />
        </div>

        {/* Details below */}
        <div className="flex flex-col p-6 gap-4">
          <h1 className="text-2xl font-black text-slate-900">{course?.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-slate-600">
            {course?.courseType === "pdf" ? (
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>
                  {totalSubjectsCount > 0
                    ? `${totalSubjectsCount} Subjects • `
                    : totalChaptersCount > 0
                    ? `${totalChaptersCount} Chapters • `
                    : ""}
                  {totalPdfs} {totalPdfs === 1 ? "PDF" : "PDFs"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>
                  {totalSubjectsCount > 0
                    ? `${totalSubjectsCount} Subjects • `
                    : totalChaptersCount > 0
                    ? `${totalChaptersCount} Chapters • `
                    : ""}
                  {totalVideos} {totalVideos === 1 ? "Video" : "Videos"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              {activeDuration}
            </div>
          </div>

          {/* What's Included in this Combo */}
          {course?.isBundle && ((course?.bundledCourses && course.bundledCourses.length > 0) || (course?.bundledExams && course.bundledExams.length > 0)) && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  What's Included:
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/60">
                  {(course.bundledCourses?.length || 0)} Courses + {(course.bundledExams?.length || 0)} Mocks
                </span>
              </div>
              <div className="space-y-1.5">
                {course.bundledCourses?.map((bc, idx) => (
                  <div
                    key={bc._id || idx}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200/80 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate">{bc.title}</span>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500">
                      {bc.courseType === "pdf" ? "PDF Course" : "Full Video Batch"}
                    </span>
                  </div>
                ))}
                {course.bundledExams?.map((be, idx) => (
                  <div
                    key={be._id || idx}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200/80 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-black shrink-0">
                        {(course.bundledCourses?.length || 0) + idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate">{be.title}</span>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Mock Test Series
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Plan Validity Selector (if multiple options available) */}
          {hasPlans && course.pricingPlans.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Choose Validity & Plan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {course.pricingPlans.map((plan, idx) => {
                  const isSelected = idx === selectedPlanIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPlanIndex(idx)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-blue-900" : "text-slate-700"
                          }`}
                        >
                          {plan.duration}
                        </span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        ₹{plan.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coupon Code Box (only for paid courses) */}
          {!isCourseFree && (
            <div className="pt-3 border-t border-slate-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5 font-mono">
                        {appliedCoupon.code}
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                          APPLIED
                        </span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        You save ₹{appliedCoupon.discountAmount}!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" /> Have a Coupon Code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                      }
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 shrink-0"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                </form>
              )}
              {/* 🏷️ Available Offers / Coupons List */}
              {availableCoupons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Available Offers
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {availableCoupons.length}
                      </span>
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-0.5">
                    {availableCoupons.map((c) => {
                      const isCurrentApplied = appliedCoupon?.code === c.code;
                      const discountText =
                        c.discountType === "flat"
                          ? `Flat ₹${c.discountAmount} OFF`
                          : `${c.discountAmount}% OFF${
                              c.maxDiscountLimit ? ` (Max ₹${c.maxDiscountLimit})` : ""
                            }`;

                      return (
                        <div
                          key={c._id || c.code}
                          className={`p-2 rounded-xl border transition-all ${
                            isCurrentApplied
                              ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20"
                              : "bg-slate-50 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="px-2 py-0.5 border border-dashed border-blue-500/60 bg-white text-blue-700 font-mono font-black text-[11px] rounded tracking-wider uppercase shrink-0">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyCode(c.code, e)}
                                title="Copy coupon code"
                                className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer shrink-0"
                              >
                                {copiedCode === c.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {isCurrentApplied ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Applied
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isValidatingCoupon}
                                onClick={() => handleApplyDirectCode(c.code)}
                                className="text-[11px] font-black text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50/80 border border-blue-200 hover:border-blue-600 px-2.5 py-0.5 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                Apply
                              </button>
                            )}
                          </div>

                          <div className="mt-1 flex items-baseline justify-between gap-1 text-[11px]">
                            <span className="font-bold text-slate-800 text-[11px]">{discountText}</span>
                            {c.minOrderAmount > 0 && (
                              <span className="text-[10px] text-slate-500 shrink-0">
                                Min ₹{c.minOrderAmount}
                              </span>
                            )}
                          </div>

                          {c.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {c.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price + CTA */}
          <div className="pt-3 border-t border-slate-100">
            <div className="mb-4">
              {isCourseFree ? (
                <div className="flex items-baseline">
                  <span className="text-3xl font-black text-emerald-600">FREE</span>
                  <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    100% OFF
                  </span>
                </div>
              ) : appliedCoupon ? (
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-black text-slate-900">
                      {isFinalFree ? "FREE" : `₹${finalPayablePrice}`}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      ₹{activePrice}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      -₹{appliedCoupon.discountAmount} OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    Coupon discount applied on this course!
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline flex-wrap gap-2">
                  <span className="text-3xl font-black text-slate-900">₹{activePrice}</span>
                  {course?.isBundle && Number(course?.bundleOriginalPrice) > Number(activePrice) ? (
                    <>
                      <span className="text-slate-400 line-through">
                        ₹{Number(course.bundleOriginalPrice).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {Math.round(((course.bundleOriginalPrice - activePrice) / course.bundleOriginalPrice) * 100)}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 line-through">
                      ₹{Math.round(activePrice * 1.3)}
                    </span>
                  )}
                  {activePlan && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {activePlan.duration}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              disabled={isPending}
              onClick={purchaseHandler}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
                isFinalFree
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
              }`}
            >
              {isPending ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : isFinalFree ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {appliedCoupon ? "Enroll for Free (Coupon Applied)" : "Enroll for Free"}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Enroll for ₹{finalPayablePrice}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SingleCourse;
