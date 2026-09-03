import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Home from "../pages/User/Home";
import { ProtectedRoutes } from "./protectedRoute";
import DashboardProducts from "../pages/Admin/course";
import Dashboard from "../pages/Admin/dashboard";
import UserLayout from "../layout/userLayout";
import ModulePage from "../pages/Admin/module";
import SingleCourse from "@/pages/User/SingleCourse";
import PaymenSuccess from "@/pages/User/PaymenSuccess";
import YourAllPurchasedCourse from "@/pages/User/yourAllPurchasedCourse";
import SinglePurchasedCourse from "@/pages/User/SinglePurchasedCourse";
import VerifyOtp from "@/pages/Auth/verifyOtp";
import HeroSectionManagement from "@/pages/Admin/heroSection";
import QuizManagement from "@/pages/Admin/Quiz.management";
import QuizeInterface from "@/pages/User/quize/quize.interface";
import QuizeDetail from "@/pages/User/quize/quize.detail";
import QuizResult from "@/pages/User/quize/quize.result";
import PremiumStudent from "@/pages/Admin/premiumStudent";
import SuccessBoard from "@/pages/Admin/Success.board";
import QualifiedMentors from "@/pages/Admin/qualifiedMentors";
import EbookCreate from "@/pages/Admin/ebook";
import AllEbooks from "@/pages/User/eBooks.jsx/All.eBook";
import EbookQuestionPractice from "@/pages/User/eBooks.jsx/eBook.ui";
// UserLayout wraps routes that SHOULD have the top Navbar

const MainRoutes = () => {
  return (
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
        <Route
          path="dashboardProduct"
          element={
            <ProtectedRoutes>
              <DashboardProducts />
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
  );
};

export default MainRoutes;
