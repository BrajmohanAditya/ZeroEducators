import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  AlertOctagon,
  Users,
  BookOpen,
  Lock,
  Wrench,
  Award,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  Mail,
} from "lucide-react";

const TermsAndConditions = () => {
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
              <ShieldCheck className="w-3.5 h-3.5" /> Official Policy
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Terms & Conditions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Please read these Terms & Conditions carefully before purchasing or enrolling in any
              course/program offered by <strong>Zero Educators</strong>. By completing the enrollment
              or payment, you acknowledge that you have read, understood, and accepted these terms.
            </p>
            <p className="text-[11px] text-slate-400 mt-4">
              Last Updated: September 2026 • Governing Law: India
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* 1. Course Enrollment */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  1. Course Enrollment
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Once payment is successfully completed and course access is provided, the enrollment
                  is considered confirmed. Course access is intended <strong>only for the enrolled student</strong>{" "}
                  and must not be shared, transferred, sold, or distributed to any other person.
                </p>
              </div>
            </div>
          </div>

          {/* 2. No-Refund Policy */}
          <div
            id="refund-policy"
            className="bg-white rounded-2xl p-6 border-2 border-red-200/70 shadow-xs hover:border-red-300 transition relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Strict Policy
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 font-bold">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  2. No-Refund Policy
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold mb-3">
                  All purchases are generally non-refundable and non-transferable once course access has
                  been provided, except where a refund or other remedy is required under applicable law.
                </p>

                <div className="bg-red-50/70 rounded-xl p-4 border border-red-100 mb-2">
                  <p className="text-xs font-bold text-red-900 mb-2">
                    Refunds will ordinarily NOT be entertained for:
                  </p>
                  <ul className="space-y-1.5 text-xs text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Change of mind or personal reasons
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Not attending classes or not using the course
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Failure to complete the course
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Change in exam plans or preparation strategy
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Dissatisfaction after enrollment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Personal circumstances or lack of time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span> Any other reason attributable to the learner, subject to applicable law
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Misconduct & Misbehaviour */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  3. Misconduct & Misbehaviour
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                  Students are expected to communicate respectfully with teachers, mentors, staff, and other students.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                  Any abusive, threatening, discriminatory, offensive, or inappropriate behaviour, including repeated
                  misconduct, may result in warning, temporary suspension, or termination of course/platform access,
                  depending on the circumstances.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Termination or suspension due to misconduct does not automatically create a right to a refund, subject to
                  applicable law.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Course Content & Access */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  4. Course Content & Access
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Course content, classes, PDFs, recordings, tests, and other study materials are provided for educational
                  purposes. Content, schedules, faculty, features, or course structure may be reasonably modified, updated,
                  or replaced when required.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Account & Content Security */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  5. Account & Content Security
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                  Students must keep their login credentials confidential. Sharing credentials, recording/distributing
                  paid classes, uploading course material elsewhere, reselling content, or providing unauthorized access
                  to others is <strong>strictly prohibited</strong>.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Appropriate action may be taken against violations, including suspension or termination of access and any
                  other remedies available under applicable law.
                </p>
              </div>
            </div>
          </div>

          {/* 6. Technical Issues */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  6. Technical Issues
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                  We will make reasonable efforts to maintain access to the course and platform. Temporary technical issues,
                  maintenance, updates, or third-party service interruptions may occur.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Students should report genuine technical issues through the designated support channel so that reasonable
                  assistance can be provided.
                </p>
              </div>
            </div>
          </div>

          {/* 7. Exam & Result Disclaimer */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  7. Exam & Result Disclaimer
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Enrollment in a course does not guarantee selection, marks, rank, qualification, or employment. Results
                  depend on various factors, including the student's preparation, individual performance, and examination
                  conditions.
                </p>
              </div>
            </div>
          </div>

          {/* 8. Changes to Terms */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-bold">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  8. Changes to Terms
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Zero Educators reserves the right to reasonably update or modify these Terms & Conditions when necessary.
                  The latest applicable version will govern future use of the services, subject to applicable law.
                </p>
              </div>
            </div>
          </div>

          {/* 9. Acceptance of Terms & Official Support */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-6 sm:p-8 border border-emerald-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-emerald-950 mb-2">
                  9. Acceptance of Terms & Official Support
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  By purchasing or enrolling in a course, you confirm that you have had an opportunity to read these Terms
                  & Conditions and agree to comply with them.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  For any genuine concern or support-related issue, students are requested to contact the official support
                  channel before taking any further action.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://wa.me/919119202035"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Official WhatsApp Support (+91 91192 02035)
                  </a>
                  <a
                    href="mailto:cckumarsingh39ar@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                  >
                    <Mail className="w-4 h-4 text-slate-500" /> Email Support
                  </a>
                </div>

                <p className="text-[11px] text-slate-500 mt-5 italic border-t border-emerald-200/60 pt-3">
                  These Terms & Conditions are intended as general business terms and are subject to applicable laws and
                  regulations. Nothing in these terms is intended to exclude or restrict any consumer right or legal remedy
                  that cannot lawfully be excluded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
