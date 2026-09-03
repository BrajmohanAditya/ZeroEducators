import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ShoppingBag,
  X,
  Menu,
  Home,
  BarChart3,
  FileText,
  Users,
  ClipboardList,
  Presentation,
  Book,
} from "lucide-react";

const DashboardSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/", label: "Analytics", icon: BarChart3 },
    {
      to: "/admindashboard/dashboardProduct",
      label: "Courses",
      icon: ShoppingBag,
    },
    {
      to: "/admindashboard/heroSection",
      label: "Banners & Upcomming Exams",
      icon: FileText,
    },
    {
      to: "/admindashboard/PremiumStudent",
      label: "Premium Students",
      icon: Users,
    },
    {
      to: "/admindashboard/QuizManagement",
      label: "Quiz Management",
      icon: ClipboardList,
    },
    {
      to: "/admindashboard/selectedStudent",
      label: "Selected Student",
      icon: Users,
    },
    {
      to: "/admindashboard/QualifiedMentor",
      label: "Qualified Mentors",
      icon: Presentation,
    },
    {
      to: "/admindashboard/ebook",
      label: "eBooks",
      icon: Book,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center bg-white border-b border-slate-200 p-4 sticky top-0 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-md mr-3"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Tejas Defence
        </h1>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`w-64 lg:w-72 bg-white shadow-xl border-r border-slate-200 h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 lg:p-6 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            {/* The Stylized 'K' Monogram */}
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/50 shrink-0">
              <span className="text-white font-black text-lg lg:text-xl font-sans tracking-tighter">
                T
              </span>
            </div>

            {/* Title and Subtitle */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-base lg:text-lg font-black text-slate-900 tracking-tight truncate lg:overflow-visible lg:whitespace-nowrap leading-none">
                Tejas Defence
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase leading-none truncate lg:overflow-visible">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* 3. Add a Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md"
              }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default DashboardSidebar;
