import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Shield,
  User,
  BookOpen,
  LogOut,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { userLogoutHook } from "../../hooks/User.hook";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user.store";
import StudentIcon from "../icons/StudentIcon";
import SearchBar from "./searchBar";

const Navbar = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  
  const navigate = useNavigate();
  const { mutate, isPending } = userLogoutHook();
  const { user } = useUserStore();

  const logoutHandler = () => {
    mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: ["get-user"] });
        setUser(null); // This instantly clears the global state!
        navigate("/login"); // Optional: send them to the login page
      },
    });
  };

  let navItems = [];

  if (user) {
    // What to show if they ARE logged in
    navItems = [
      // Only show Admin Dashboard if they are an admin!
      ...(user.role === "admin"
        ? [
            {
              label: "Admin Dashboard",
              icon: Shield,
              onClick: () => navigate("/admindashboard"),
            },
          ]
        : []),
      {
        label: "Your Courses",
        icon: BookOpen,
        onClick: () => navigate("/yourAllPurchasedCourse"),
      },
      {
        label: "Logout",
        icon: LogOut,
        onClick: logoutHandler,
        loading: isPending,
      },
    ];
  } else {
    // What to show if they ARE NOT logged in
    navItems = [
      {
        label: "Log in",
        icon: LogIn,
        onClick: () => navigate("/login"),
      },
      {
        label: "Sign up",
        icon: UserPlus,
        onClick: () => navigate("/register"), // Change this to "/signup" if you have a separate signup page!
      },
    ];
  }

  const renderUserMenu = () => (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 p-1 sm:p-1.5 hover:bg-[#d4af37]/15 rounded-xl transition-all duration-300 group cursor-pointer shrink-0">
        <Avatar className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border-2 border-[#d4af37] shadow-xs group-hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all duration-300">
          <AvatarImage
            src={user?.profilePhoto || ""}
            className="object-cover"
          />
          <AvatarFallback className="bg-white w-full h-full text-[#050e08] flex items-center justify-center">
            <StudentIcon />
          </AvatarFallback>
        </Avatar>

        <div className="hidden lg:block text-left max-w-[100px]">
          <p className="font-semibold text-xs text-slate-900 leading-tight truncate">
            {user?.name ? user.name : "Account"}
          </p>
        </div>

        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </PopoverTrigger>

      <PopoverContent className="w-60 sm:w-64 p-1 mt-2 border-slate-200 shadow-2xl rounded-2xl" align="end">
        <div className="p-3 sm:p-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900 text-sm tracking-tight truncate">
            {user?.name || "Welcome back"}
          </p>
          <p className="text-xs text-slate-500 font-medium truncate">
            {user?.email || "Manage your account"}
          </p>
        </div>

        <div className="py-2 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={item.loading}
              className="group relative w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl transition-all duration-200 hover:bg-slate-50 hover:shadow-xs text-xs sm:text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-700 shrink-0" />
              <span className="truncate">{item.label}</span>

              {item.loading && (
                <div className="absolute right-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <header className="sticky top-0 z-50 bg-white w-full shadow-sm border-b-[3px] border-[#d4af37]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 md:py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6">
        
        {/* Top row: Brand Logo on Left, Profile Avatar on Right on Mobile */}
        <div className="w-full md:w-auto flex items-center justify-between gap-3 shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
            onClick={() => navigate("/")}
          >
            <img
              src="/logo3rd.png"
              alt="Zero Educators Logo"
              className="h-8 sm:h-10 md:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
            />

            <h1
              className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight uppercase flex items-center leading-none"
              style={{
                fontFamily: "'Outfit', 'Poppins', sans-serif",
              }}
            >
              <span className="bg-gradient-to-r from-[#073b75] via-[#0b5cb8] to-[#1976d2] bg-clip-text text-transparent font-black drop-shadow-[0_1px_1px_rgba(7,59,117,0.2)]">
                ZEROEDUCATORS
              </span>
            </h1>
          </div>

          {/* User Profile Trigger on Mobile (< md) */}
          <div className="md:hidden">
            {renderUserMenu()}
          </div>
        </div>

        {/* Center: Search Bar (Full width row on mobile, centered row on desktop) */}
        <div className="w-full md:flex-1 md:max-w-xl lg:max-w-2xl flex justify-center">
          <SearchBar />
        </div>

        {/* User Profile Trigger on Desktop (>= md) */}
        <div className="hidden md:flex items-center shrink-0">
          {renderUserMenu()}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
