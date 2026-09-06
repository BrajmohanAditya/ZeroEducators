import { Loader2, ShieldCheck, BookOpen, Clock, FileText } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";
import { useGetSingleCourseHook } from "@/hooks/course.hook";
import { usePaymentHook } from "@/hooks/payment.hook";

const SingleCourse = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetSingleCourseHook(id);
  const { mutate, isPending } = usePaymentHook();
  const course = data?.course;

  const hasPlans = Boolean(course?.pricingPlans && course.pricingPlans.length > 0 && !course?.isFree);
  const [selectedPlanIndex, setSelectedPlanIndex] = React.useState(0);

  const activePlan = hasPlans ? course.pricingPlans[selectedPlanIndex] : null;
  const activePrice = activePlan ? activePlan.price : course?.amount;
  const activeDuration = activePlan
    ? activePlan.duration
    : course?.duration
    ? course.duration
    : "Lifetime Access";

  const totalPdfs = React.useMemo(() => {
    return course?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;
  }, [course?.topics]);

  const purchaseHandler = () => {
    mutate({
      products: {
        _id: course._id,
        name: course.title,
        price: activePrice,
        image: course.thumbnail,
        planId: activePlan?._id,
        planDuration: activeDuration,
      },
      planId: activePlan?._id,
      planDuration: activeDuration,
    });
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  const isCourseFree = course?.isFree || Number(activePrice) === 0;

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
                  {course.topics?.length || 0} {course.topics?.length === 1 ? "Topic" : "Topics"} • {totalPdfs} {totalPdfs === 1 ? "PDF" : "PDFs"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>
                  {course?.modules?.length || 0} {course?.modules?.length === 1 ? "Video" : "Videos"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              {activeDuration}
            </div>
          </div>

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

          {/* Price + CTA */}
          <div className="pt-3 border-t border-slate-100">
            <div className="mb-4 flex items-baseline">
              {isCourseFree ? (
                <>
                  <span className="text-3xl font-black text-emerald-600">FREE</span>
                  <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    100% OFF
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black text-slate-900">₹{activePrice}</span>
                  <span className="ml-3 text-slate-400 line-through">₹{Math.round(activePrice * 1.3)}</span>
                  {activePlan && (
                    <span className="ml-2.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {activePlan.duration}
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              disabled={isPending}
              onClick={purchaseHandler}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
                isCourseFree
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
              }`}
            >
              {isPending ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : isCourseFree ? (
                <>
                  <ShieldCheck className="w-5 h-5" /> Enroll for Free
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Enroll for ₹{activePrice}
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
