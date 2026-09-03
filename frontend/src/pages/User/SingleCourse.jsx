import { useGetSingleCourseHook } from "@/hooks/course.hook";
import { Loader2, ShieldCheck, BookOpen, Clock } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";
import { usePaymentHook } from "@/hooks/payment.hook";

const SingleCourse = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetSingleCourseHook(id);
  const { mutate, isPending } = usePaymentHook();
  const course = data?.course;

  const purchaseHandler = () => {
    mutate({ products: { _id: course._id, name: course.title, price: course.amount, image: course.thumbnail } });
  };

  const randomModulesCount = React.useMemo(() => {
    return Math.floor(Math.random() * 11) + 10; // Random number between 10 and 20
  }, [course?._id]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Thumbnail — small fixed height */}
        <div className="w-full p-2  h-52 bg-slate-100">
          <img src={course?.thumbnail} alt={course?.title} className="w-full h-full object-cover rounded-2xl" />
        </div>

        {/* Details below */}
        <div className="flex flex-col p-7 gap-4">
          <h1 className="text-2xl font-black text-slate-900">{course?.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {course?.modules?.length ? course.modules.length : randomModulesCount} Modules
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              {course?.duration ? course.duration : "Lifetime Access"}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="pt-4 border-t border-slate-100">
            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900">₹{course?.amount}</span>
              <span className="ml-3 text-slate-400 line-through">₹{Math.round(course?.amount * 1.3)}</span>
            </div>
            <button
              disabled={isPending}
              onClick={purchaseHandler}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><ShieldCheck className="w-5 h-5" /> Enroll Now</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SingleCourse;
