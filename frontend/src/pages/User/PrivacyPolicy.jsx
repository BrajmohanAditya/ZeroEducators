import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Smartphone,
  CreditCard,
  UserCheck,
  Trash2,
  Mail,
  MessageCircle,
  ArrowLeft,
  FileCheck
} from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Google Play Compliant
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              At <strong>Zero Educators</strong>, your privacy and personal data security are our top priorities. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our mobile application (Zero Educators) and our website (zeroeducators.com).
            </p>
            <p className="text-[11px] text-slate-400 mt-4">
              Effective Date: September 2026 • Governing Law: Information Technology Act, India
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-6">
          {/* 1. Information We Collect */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  1. Information We Collect
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  We collect information necessary to deliver educational services, course videos, test series, and personalized mentoring:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Personal Information:</strong> Name, Email Address, Phone/WhatsApp Number, and student profile details when you register or log in.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Academic & Course Progress:</strong> Quizzes attempted, mock test scores, course completion status, and study preferences.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Device & Technical Data:</strong> Device model, operating system version, unique device identifiers, and crash logs to optimize app stability.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. How We Use Your Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  2. How We Use Your Information
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  Your information is used strictly for legitimate educational and service delivery purposes:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>To create and manage your student account.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>To provide enrolled courses, eBooks, mock test results, and ranking analysis.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>To process secure payments via RBI-authorized payment gateways.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>To send essential notifications, OTP verification, and customer support responses.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. App Permissions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  3. Android App Permissions
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  The Zero Educators mobile app requests only the minimum permissions essential for functioning:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Internet Access (android.permission.INTERNET):</strong> Required to fetch courses, stream educational video lectures, and conduct quizzes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Network State:</strong> To verify if the device is connected to WiFi or mobile data before downloading high-resolution educational content.</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-500 mt-2 italic">
                  Note: We do NOT request access to contacts, microphone, camera, or device location.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Payment Security */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  4. Payment & Financial Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We <strong>never store or process</strong> your credit card, debit card numbers, UPI PINs, or net-banking passwords on our servers. All financial transactions are encrypted and processed through PCI-DSS certified, RBI-licensed payment gateways (such as Cashfree).
                </p>
              </div>
            </div>
          </div>

          {/* 5. Data Sharing & Third Parties */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  5. No Sale of Personal Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <strong>We do NOT sell, rent, or trade your personal information to third-party advertising companies.</strong> Your data is shared only with trusted infrastructure providers (cloud hosting, database encryption, SMS/WhatsApp gateways for OTP verification) strictly to operate the platform.
                </p>
              </div>
            </div>
          </div>

          {/* 6. User Rights & Account Deletion */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  6. User Rights & Account Deletion Request
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  Under applicable data protection guidelines, you have the right to access, correct, or request deletion of your account and personal data.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  If you wish to delete your account or erase your data, email our support team at{" "}
                  <a href="mailto:cckumarsingh39ar@gmail.com" className="text-emerald-600 font-semibold underline">
                    cckumarsingh39ar@gmail.com
                  </a>{" "}
                  with the subject line <em>"Account Deletion Request"</em>. We will verify and process the request within 7 business days.
                </p>
              </div>
            </div>
          </div>

          {/* 7. Children's Privacy */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  7. Children & Student Privacy
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Zero Educators is an educational preparation platform. If students under the age of 18 use the platform, enrollment must be guided by a parent or legal guardian. We do not knowingly collect deceptive or harmful data from minors.
                </p>
              </div>
            </div>
          </div>

          {/* 8. Contact & Grievance Officer */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-6 sm:p-8 border border-emerald-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-emerald-950 mb-2">
                  8. Contact Us & Grievance Redressal
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  If you have any questions, concerns, or grievances regarding this Privacy Policy or our data practices, please reach out to our official Grievance Officer:
                </p>

                <div className="space-y-2 text-xs sm:text-sm text-slate-700 mb-4">
                  <p><strong>Organization:</strong> Zero Educators</p>
                  <p><strong>Website:</strong> <a href="https://zeroeducators.com" className="text-emerald-700 underline">https://zeroeducators.com</a></p>
                  <p><strong>Email:</strong> <a href="mailto:cckumarsingh39ar@gmail.com" className="text-emerald-700 underline">cckumarsingh39ar@gmail.com</a></p>
                  <p><strong>WhatsApp Support:</strong> +91 91192 02035</p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://wa.me/919119202035"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp Support
                  </a>
                  <a
                    href="mailto:cckumarsingh39ar@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    <Mail className="w-4 h-4 text-slate-500" /> Email Grievance Officer
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
