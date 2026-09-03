import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userVerifyOtpHook } from "@/hooks/User.hook";
import { Loader2, KeyRound, CheckCircle } from "lucide-react";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  
  // Register.jsx se aayi hui email nikalna
  const email = location.state?.email;

  const { mutate: verifyOtpMutate, isPending } = userVerifyOtpHook();

  // Agar galti se koi direct is page par aa jaye bina email ke, to wapas register pe bhej do
  if (!email) {
    navigate("/register");
    return null;
  }

  const otpSubmitHandler = (e) => {
    e.preventDefault();
    verifyOtpMutate(
      { email, otp },
      {
        onSuccess: () => {
          // Success hone par seedha Home page pe bhej dein, login auto ho jayega
          navigate("/");
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            <CheckCircle className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-sm text-gray-500 mt-1">
            We've sent a 4-digit code to <span className="font-semibold text-indigo-600">{email}</span>
          </p>
        </div>

        <form onSubmit={otpSubmitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1234"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition tracking-widest text-center text-lg font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || otp.length !== 4}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              "Verify Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
