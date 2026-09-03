import React, { useState, useEffect } from "react";
import { useGetHeroSectionHook } from "@/hooks/hero.hook";
import ExamSyllabusModal from "./examSyllabus";

const HeroSection = () => {
  const { data, isLoading } = useGetHeroSectionHook();
  const exams = data?.upcomingExams || [];
  const banners = data?.banners || [];

  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  return (
    // Main Container
    <div className="pt-8 pb-4 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Flex row banayenge jo badi screen par side-by-side hoga, aur mobile par upar-neeche */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ========================================= */}
          {/* LEFT SIDE: Upcoming Exams (50% width)     */}
          {/* ========================================= */}
          <div className=" w-full lg:w-[50%] bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:h-[240px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                Upcoming Exams
              </h2>
            </div>

            {/* Exam Icons Grid (Responsive) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {isLoading ? (
                <p className="text-sm text-slate-500 col-span-4 text-center py-4">
                  Loading exams...
                </p>
              ) : exams.length === 0 ? (
                <p className="text-sm text-slate-500 col-span-4 text-center py-4">
                  No upcoming exams available.
                </p>
              ) : (
                exams.slice(0, 4).map((exam) => (
                  <div
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-full h-16 mb-4 flex items-center justify-center">
                      <img
                        src={exam.imageUrl}
                        alt={exam.title}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <span className="text-sm font-bold text-center text-slate-700 leading-tight px-1">
                      {exam.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================= */}
          {/* RIGHT SIDE: Offer Banner (50% width)      */}
          {/* ========================================= */}
          <div className=" w-full lg:w-[50%] bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden relative h-[180px] sm:h-[200px] lg:h-[240px] flex items-center justify-center p-3 lg:p-0">
            {isLoading ? (
              <h2 className="text-slate-800 text-xl font-bold z-10">
                Loading banner...
              </h2>
            ) : banners.length > 0 ? (
              <div className="relative w-full h-auto lg:h-full flex items-center justify-center">
                <img
                  key={banners[currentBanner]._id}
                  src={banners[currentBanner].imageUrl}
                  alt={banners[currentBanner].title || "Offer Banner"}
                  className="w-full h-auto lg:h-full object-cover lg:absolute lg:inset-0 transition-opacity duration-500 ease-in-out rounded-xl lg:rounded-none will-change-auto"
                />
              </div>
            ) : (
              <h2 className="text-slate-800 text-2xl font-bold z-10">
                Your Offer Banner Here
              </h2>
            )}

            {/* Carousel Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-1 lg:bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    className={`h-2 rounded-full transition-all duration-2000 ${
                      currentBanner === idx
                        ? "w-8 bg-blue-500"
                        : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Syllabus and Selection Process Modal */}
      <ExamSyllabusModal
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        examTitle={selectedExam?.title}
        examImageUrl={selectedExam?.imageUrl}
      />
    </div>
  );
};

export default HeroSection;
