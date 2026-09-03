import { userRegisterHook, userGoogleLoginHook } from "@/hooks/User.hook";
import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Loader2, GraduationCap, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Divider from "@/components/userComponent/Divider";

const Register = () => {
  const { register, handleSubmit } = useForm();
  const { mutate, isPending } = userRegisterHook();
  const { mutate: googleMutate } = userGoogleLoginHook();
  const navigate = useNavigate();
  const registerFormHandler = (data) => {
    mutate(data, {
      onSuccess: () => {
        navigate("/verify-otp", { state: { email: data.email } });
      },
    });
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-indigo-100 px-4 py-6 sm:py-0">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
            <GraduationCap className="w-6 h-6 animate-bounce" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Signup Account</h1>
        </div>

        {/* Google Signin Button */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            theme="filled_blue"
            onSuccess={(credentialResponse) => {
              googleMutate(
                { token: credentialResponse.credential },
                {
                  onSuccess: () => {
                    // Redirect user to dashboard on success
                    navigate("/");
                  },
                },
              );
            }}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </div>

        <Divider text="Or continue with Email" />
        {/* Form */}
        <form
          onSubmit={handleSubmit(registerFormHandler)}
          className="space-y-2"
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0">
              Full Name
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="John Doe"
                {...register("name", { required: true })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", { required: true })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0">
              Mobile No
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                placeholder=""
                {...register("mobileNo", { required: true })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-0">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                placeholder="••••••••"
                {...register("password", { required: true })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-600 mt-3">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
