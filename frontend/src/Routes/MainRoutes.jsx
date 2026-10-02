import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Home from "../pages/User/Home";
import { ProtectedRoutes } from "./protectedRoute";
import UserLayout from "../layout/userLayout";

// Lazy-loaded routes for performance & code-splitting
const SingleCourse = lazy(() => import("@/pages/User/SingleCourse"));
const YourAllPurchasedCourse = lazy(() => import("@/pages/User/yourAllPurchasedCourse"));
const SinglePurchasedCourse = lazy(() => import("@/pages/User/SinglePurchasedCourse"));
const QuizeDetail = lazy(() => import("@/pages/User/quize/quize.detail"));
const QuizResult = lazy(() => import("@/pages/User/quize/quize.result"));
const QuizeInterface = lazy(() => import("@/pages/User/quize/quize.interface"));
const QualifiedMentors = lazy(() => import("@/pages/Admin/qualifiedMentors"));
const AllEbooks = lazy(() => import("@/pages/User/eBooks.jsx/All.eBook"));
const EbookQuestionPractice = lazy(() => import("@/pages/User/eBooks.jsx/eBook.ui"));
const TermsAndConditions = lazy(() => import("@/pages/User/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("@/pages/User/PrivacyPolicy"));
const VerifyOtp = lazy(() => import("@/pages/Auth/verifyOtp"));
const PaymenSuccess = lazy(() => import("@/pages/User/PaymenSuccess"));

// Admin pages (only loaded when admin visits)
const Dashboard = lazy(() => import("../pages/Admin/dashboard"));
const DashboardProducts = lazy(() => import("../pages/Admin/course"));
const ModulePage = lazy(() => import("../pages/Admin/module"));
const TopicPdfManager = lazy(() => import("../pages/Admin/TopicPdfManager"));
const HeroSectionManagement = lazy(() => import("@/pages/Admin/heroSection"));
const QuizManagement = lazy(() => import("@/pages/Admin/Quiz.management"));
const PremiumStudent = lazy(() => import("@/pages/Admin/premiumStudent"));
const SuccessBoard = lazy(() => import("@/pages/Admin/Success.board"));
const EbookCreate = lazy(() => import("@/pages/Admin/ebook"));
const CouponManagement = lazy(() => import("@/pages/Admin/CouponManagement"));
const AnalyticsDashboard = lazy(() => import("@/pages/Admin/AnalyticsDashboard"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-[#0b5cb8] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const MainRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* --- User Routes (Wrapped with Navbar) --- */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />

        <Route
          path="/singleCourse/:id"
          element={
            <ProtectedRoutes>
              <SingleCourse />
            </ProtectedRoutes>
          }
        />

        <Route
          path="/yourAllPurchasedCourse"
          element={
            <ProtectedRoutes>
              <YourAllPurchasedCourse />
            </ProtectedRoutes>
          }
        />

        <Route
          path="/SinglePurchasedCourse/:id"
          element={
            <ProtectedRoutes>
              <SinglePurchasedCourse />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/quizeDetail"
          element={
            <ProtectedRoutes>
              <QuizeDetail />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/quiz-result/:id"
          element={
            <ProtectedRoutes>
              <QuizResult />
            </ProtectedRoutes>
          }
        />

        <Route
          path="/qualifiedMentors"
          element={
            <ProtectedRoutes>
              <QualifiedMentors />
            </ProtectedRoutes>
          }
        />

        <Route
          path="/ebooks"
          element={
            <ProtectedRoutes>
              <AllEbooks />
            </ProtectedRoutes>
          }
        />

        {/* Legal & Policy Pages */}
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* --- Full Screen Mock Test (No Navbar) --- */}
      <Route
        path="/quizeInterface/:id"
        element={
          <ProtectedRoutes>
            <QuizeInterface />
          </ProtectedRoutes>
        }
      />
              <Route
          path="/ebooks/practice/:id"
          element={
            <ProtectedRoutes>
              <EbookQuestionPractice />
            </ProtectedRoutes>
          }
        />

      {/* --- Admin Routes (No Main Navbar) --- */}
      <Route
        path="/admindashboard"
        element={
          <ProtectedRoutes requireAdmin={true}>
            <Dashboard />
          </ProtectedRoutes>
        }
      >
        {/* Default / Index route: Analytics Dashboard */}
        <Route
          index
          element={
            <ProtectedRoutes>
              <AnalyticsDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoutes>
              <AnalyticsDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="dashboardProduct"
          element={
            <ProtectedRoutes>
              <DashboardProducts />
            </ProtectedRoutes>
          }
        />
        <Route
          path="coupons"
          element={
            <ProtectedRoutes>
              <CouponManagement />
            </ProtectedRoutes>
          }
        />
        <Route
          path="module/:id"
          element={
            <ProtectedRoutes>
              <ModulePage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="course-topics/:id"
          element={
            <ProtectedRoutes>
              <TopicPdfManager />
            </ProtectedRoutes>
          }
        />
        <Route
          path="heroSection"
          element={
            <ProtectedRoutes>
              <HeroSectionManagement />
            </ProtectedRoutes>
          }
        />
        <Route
          path="QuizManagement"
          element={
            <ProtectedRoutes>
              <QuizManagement />
            </ProtectedRoutes>
          }
        />
        <Route
          path="PremiumStudent"
          element={
            <ProtectedRoutes>
              <PremiumStudent />
            </ProtectedRoutes>
          }
        />
        <Route
          path="selectedStudent"
          element={
            <ProtectedRoutes>
              <SuccessBoard />
            </ProtectedRoutes>
          }
        />
          <Route
          path="qualifiedMentor"
          element={
            <ProtectedRoutes>
              <QualifiedMentors />
            </ProtectedRoutes>
          }
        />

        <Route
          path="ebook"
          element={
            <ProtectedRoutes>
              <EbookCreate />
            </ProtectedRoutes>
          }
        />
      </Route>

      {/* --- Auth Routes (No Navbar) --- */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoutes>
            <PaymenSuccess />
          </ProtectedRoutes>
        }
      />
    </Routes>
    </Suspense>
  );
};

export default MainRoutes;
