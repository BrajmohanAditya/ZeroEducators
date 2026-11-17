import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Video,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import { useGetActiveCategoryBarsHook } from "../../hooks/categoryBar.hook";

const CategoryBifurcationBar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useGetActiveCategoryBarsHook();
  const categories = useMemo(() => data?.categories || [], [data]);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 16, isMobile: false });

  const containerRef = useRef(null);
  const scrollRowRef = useRef(null);
  const buttonRefs = useRef({});
  const timeoutRef = useRef(null);

  const activeCategoryId = searchParams.get("categoryId");

  // Calculate position of dropdown relative to the clicked/hovered button
  const updateDropdownPosition = (catId) => {
    const btn = buttonRefs.current[catId];
    const container = containerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const screenWidth = window.innerWidth;

    if (screenWidth < 640) {
      setDropdownPos({ left: 12, right: 12, isMobile: true });
    } else {
      const dropdownWidth = 380;
      let left = btnRect.left - containerRect.left;
      // Prevent overflow past right edge of container
      if (left + dropdownWidth > containerRect.width - 16) {
        left = Math.max(16, containerRect.width - dropdownWidth - 16);
      }
      setDropdownPos({ left: Math.max(16, left), right: "auto", isMobile: false });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Update position on window resize if open
  useEffect(() => {
    if (openDropdownId) {
      updateDropdownPosition(openDropdownId);
    }
  }, [openDropdownId]);

  const handleMouseEnter = (catId) => {
    if (window.innerWidth >= 768) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOpenDropdownId(catId);
      updateDropdownPosition(catId);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      timeoutRef.current = setTimeout(() => {
        setOpenDropdownId(null);
      }, 220);
    }
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDropdownMouseLeave = () => {
    if (window.innerWidth >= 768) {
      timeoutRef.current = setTimeout(() => {
        setOpenDropdownId(null);
      }, 220);
    }
  };

  // When clicking a category pill
  const handleCategoryClick = (cat) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const isCurrentActive = activeCategoryId === cat._id;
    const isCurrentlyOpen = openDropdownId === cat._id;

    if (isCurrentlyOpen) {
      // Toggle close
      setOpenDropdownId(null);
    } else {
      // Open dropdown and update position
      setOpenDropdownId(cat._id);
      updateDropdownPosition(cat._id);
    }

    // Always apply category filter on click
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("category", cat.title);
    nextParams.set("categoryId", cat._id);
    setSearchParams(nextParams, { replace: true });
  };

  // "All Courses" pill clicked
  const handleAllCoursesClick = () => {
    setOpenDropdownId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("categoryId");
    setSearchParams(nextParams, { replace: true });

    // Smooth scroll down to courses
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCourseClick = (courseId) => {
    setOpenDropdownId(null);
    navigate(`/singleCourse/${courseId}`);
  };

  const handleViewAllInPage = (e) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading || categories.length === 0) {
    return null;
  }

  const activeDropdownCategory = categories.find((c) => c._id === openDropdownId);
  const activeDropdownCourses = activeDropdownCategory?.courses || [];

  return (
    <div
      ref={containerRef}
      className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] select-none relative z-40 overflow-visible"
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 relative overflow-visible">
        {/* Pills Horizontal Scroll Row */}
        <div
          ref={scrollRowRef}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 scroll-smooth"
        >
          {/* "All Courses" reset pill */}
          <button
            type="button"
            onClick={handleAllCoursesClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
              !activeCategoryId
                ? "bg-[#073b75] text-white shadow-xs"
                : "text-slate-700 dark:text-slate-200 hover:text-[#073b75] hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Courses</span>
          </button>

          {/* Separator */}
          <span className="text-slate-300 dark:text-slate-700 font-bold select-none shrink-0">|</span>

          {/* Category Pills */}
          {categories.map((cat) => {
            const isFilterActive = activeCategoryId === cat._id;
            const isMenuOpen = openDropdownId === cat._id;
            const coursesCount = (cat.courses || []).length;

            return (
              <div
                key={cat._id}
                className="relative shrink-0"
                onMouseEnter={() => handleMouseEnter(cat._id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  ref={(el) => (buttonRefs.current[cat._id] = el)}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  aria-expanded={isMenuOpen}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isFilterActive
                      ? "bg-[#073b75] text-white shadow-xs ring-2 ring-[#073b75]/20"
                      : isMenuOpen
                      ? "bg-slate-200/80 dark:bg-slate-800 text-[#073b75] dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:text-[#073b75] hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate max-w-[150px] sm:max-w-none">{cat.title}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMenuOpen
                        ? "rotate-180 " + (isFilterActive ? "text-white" : "text-[#073b75]")
                        : isFilterActive
                        ? "text-white/80"
                        : "text-slate-400"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Floating Dropdown Menu (Positioned outside the scrolling row to avoid clipping) */}
        {activeDropdownCategory && (
          <div
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
            style={
              dropdownPos.isMobile
                ? { left: "12px", right: "12px", top: "100%" }
                : { left: `${dropdownPos.left}px`, top: "100%" }
            }
            className="absolute mt-1 w-auto sm:w-80 md:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Dropdown Header */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                  {activeDropdownCategory.title}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#073b75] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900 shrink-0">
                {activeDropdownCourses.length} {activeDropdownCourses.length === 1 ? "Course" : "Courses"}
              </span>
            </div>

            {/* Courses List */}
            <div className="py-1.5 max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
              {activeDropdownCourses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No courses added to this category yet.
                </div>
              ) : (
                activeDropdownCourses.map((course) => {
                  const isPdf = course.courseType === "pdf";
                  const isBundle = course.isBundle;

                  return (
                    <button
                      key={course._id}
                      type="button"
                      onClick={() => handleCourseClick(course._id)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 group cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700"
                    >
                      {/* Icon Badge */}
                      <div
                        className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isBundle
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
                            : isPdf
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-blue-100 text-[#073b75] dark:bg-blue-950/50 dark:text-blue-400"
                        }`}
                      >
                        {isBundle ? (
                          <Layers className="w-4 h-4" />
                        ) : isPdf ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-[#073b75] dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                            {isBundle ? "Bundle" : isPdf ? "PDF Course" : "Video"}
                          </span>
                          {course.amount > 0 ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{course.amount}
                            </span>
                          ) : course.isFree ? (
                            <span className="text-[10px] font-bold text-green-600 uppercase">
                              Free
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#073b75] group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom "View all courses on page" button */}
            {activeDropdownCourses.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleViewAllInPage}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-[#073b75] hover:text-white dark:bg-slate-800 dark:hover:bg-[#073b75] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                >
                  <span>View all {activeDropdownCourses.length} in Courses section</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBifurcationBar;
