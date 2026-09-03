import { userLoginHook, userGoogleLoginHook } from "@/hooks/User.hook";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, GraduationCap } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import Divider from "@/components/userComponent/Divider";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const { mutate, isPending } = userLoginHook();
  const { mutate: googleMutate } = userGoogleLoginHook();

  const navigate = useNavigate();

  const loginFormHandler = (data) => {
    mutate(data, {
      onSuccess: () => {
        navigate("/"); // Now this will successfully trigger!
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            <GraduationCap className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Login Account</h1>
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
        <form onSubmit={handleSubmit(loginFormHandler)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
