import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useForgotPasswordHook,
  useResetPasswordWithOtpHook,
} from "@/hooks/User.hook";
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = "" }) => {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP + New Password
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: sendOtp, isPending: isSendingOtp } = useForgotPasswordHook();
  const { mutate: resetPassword, isPending: isResetting } = useResetPasswordWithOtpHook();

  const handleClose = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return toast.error("Please enter your registered email address");
    }

    sendOtp(
      { email: cleanEmail },
      {
        onSuccess: () => {
          setStep(2);
        },
      }
    );
  };

  // Step 2: Submit OTP and New Password
  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      return toast.error("Please enter the 6-digit OTP");
    }

    if (otp.trim().length !== 6) {
      return toast.error("OTP must be 6 digits");
    }

    if (!newPassword.trim()) {
      return toast.error("Please enter a new password");
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    resetPassword(
      {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#073b75] via-[#0b5cb8] to-[#1976d2] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-[#d4af37]">
              <KeyRound className="w-5 h-5 text-[#f5d77f]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white leading-tight">
                Forgot Password
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-100 mt-0.5">
                {step === 1
                  ? "Enter your email to receive an OTP code"
                  : "Verify OTP and set a new password"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {step === 1 ? (
            /* STEP 1: Enter Email */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the email address associated with your account. We will send you a 6-digit verification OTP to reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="pl-9 pr-4 py-2 h-10 text-sm border-slate-200 rounded-xl focus-visible:ring-[#073b75]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSendingOtp}
                  className="rounded-xl px-4 py-2 text-sm font-medium border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingOtp || !email.trim()}
                  className="bg-[#073b75] hover:bg-[#0b5cb8] text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Reset OTP"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter OTP & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl flex items-start justify-between gap-2">
                <div className="text-xs text-slate-600 leading-snug">
                  OTP sent to <span className="font-semibold text-slate-900">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#0b5cb8] font-semibold hover:underline flex items-center gap-1 shrink-0"
                >
                  <ArrowLeft className="w-3 h-3" /> Change
                </button>
              </div>

              {/* OTP Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6-Digit Verification OTP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="pl-9 pr-4 py-2 h-10 text-sm tracking-widest font-mono border-slate-200 rounded-xl focus-visible:ring-[#073b75]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="pl-9 pr-10 py-2 h-10 text-sm border-slate-200 rounded-xl focus-visible:ring-[#073b75]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pl-9 pr-10 py-2 h-10 text-sm border-slate-200 rounded-xl focus-visible:ring-[#073b75]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Didn't receive OTP?</span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="font-semibold text-[#073b75] hover:underline disabled:opacity-50"
                >
                  {isSendingOtp ? "Resending..." : "Resend OTP"}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isResetting}
                  className="rounded-xl px-4 py-2 text-sm font-medium border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isResetting ||
                    otp.length !== 6 ||
                    !newPassword ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                  className="bg-[#073b75] hover:bg-[#0b5cb8] text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
