import { useCheckoutSuccessHook } from "@/hooks/payment.hook";
import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymenSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutateAsync: mutate, isSuccess } = useCheckoutSuccessHook();

  useEffect(() => {
    const paymentId = searchParams.get("reference");
    const orderId = searchParams.get("order_id");
    const signature = searchParams.get("signature");

    // Agar teeno cheezein mil gayi, tabhi backend ko bhejo verify karne ke liye
    if (paymentId && orderId && signature) {
      mutate({ paymentId, orderId, signature });
    }
  }, [searchParams, mutate]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-green-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center border border-emerald-200">
        <div className="w-28 h-28 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8 p-6">
          <CheckCircle className="w-16 h-16 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          Thank you for your purchase. Your course access is now active.
        </p>

        <div className="space-y-4 mb-12">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 text-emerald-700">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">
                Course unlocked successfully
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 text-blue-700">
              <ArrowRight className="w-6 h-6" />
              <span className="font-semibold">
                Redirecting to dashboard in 5s...
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/dashboard">
            <button className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              Go to Dashboard
            </button>
          </Link>

          <Link to="/">
            <button className="flex items-center gap-2 px-8 py-4 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymenSuccess;
