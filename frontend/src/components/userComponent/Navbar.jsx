import React, { useEffect } from "react";
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
        label: "Profile",
        icon: User,
        onClick: () => navigate("/#"),
      },
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

  return (
    <div className="sticky top-0 z-50 bg-white min-h-[12vh] w-full flex flex-wrap items-center justify-between px-4 md:px-6 py-3 md:py-0 shadow-md border-b-[3px] border-[#d4af37] gap-y-2">
      <div
        className="flex items-center  order-1 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/logo3rd.png"
          alt="Tejas Defence Logo"
          className="h-20 w-auto object-contain drop-shadow-md"
        />

        <h1
          className="text-2xl lg:text-3xl font-extrabold tracking-tight uppercase drop-shadow-sm"
          style={{
            color: "#050e08",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}
        >
          Tejas
          <span style={{ color: "#d4af37" }} className="ml-1">
            Defence
          </span>
        </h1>
      </div>

      {/* Search Bar in Navbar */}
      <div className="w-full md:w-auto md:flex-1 flex justify-center order-3 md:order-2">
        <SearchBar />
      </div>

      <div className="order-2 md:order-3">
        <Popover>
          <PopoverTrigger className="flex items-center gap-3 p-2 hover:bg-[#d4af37]/15 rounded-xl transition-all duration-300 group cursor-pointer">
            <Avatar className="w-10 h-10 border-[3px] border-[#d4af37] shadow-sm group-hover:shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-300">
              <AvatarImage
                src={user?.profilePhoto || ""}
                className="object-cover"
              />
              <AvatarFallback className="bg-white w-full h-full text-[#050e08] flex items-center justify-center">
                <StudentIcon />
              </AvatarFallback>
            </Avatar>

            <div className="hidden md:block text-left">
              <p className="font-semibold text-sm text-slate-900 leading-tight">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : " "}
              </p>
            </div>

            <svg
              className="w-4 h-4 text-slate-400 ml-1 group-hover:text-slate-600 transition-colors"
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

          <PopoverContent className="w-64 p-1 mt-2 border-slate-200 shadow-2xl rounded-2xl">
            <div className="p-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900 text-sm tracking-tight">
                {user?.name || "Welcome back"}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Manage your account
              </p>
            </div>

            <div className="py-2 space-y-1">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  disabled={item.loading}
                  className="group relative w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 hover:bg-slate-50 hover:shadow-md text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
};

export default Navbar;
