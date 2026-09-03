import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

import CourseSection from "@/components/userComponent/courseSection";
import HeroSection from "@/components/userComponent/HeroSection/heroSection";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import StudyMaterial from "./study.material";
import SuccessBoardDisplay from "./success.board";
import Footer from "@/components/userComponent/footer";
import QualifiedMentorsDisplay from "./qualifiedMentors.board";
import TrendingBar from "@/components/userComponent/TrendingBar";

const Home = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 30000); // 30 seconds delay

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("hasSeenPopup", "true");
    setShowPopup(false);
  };

  return (
    <div className="min-h-[88vh] bg-slate-50">
      <TrendingBar />
      <HeroSection />
      <StudyMaterial />
      <CourseSection />
      <QualifiedMentorsDisplay />
      <SuccessBoardDisplay />
      <Footer />

      <FloatingWhatsApp />

      {/* Image Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative max-w-lg w-full bg-transparent shadow-2xl transition-all transform scale-100">
            {/* Close Button */}
            <button
            onClick={handleClose}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition-all cursor-pointer border border-white/20"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>
            {/* Popup Image */}
            <img
              src="/adv.png"
              alt="Announcement"
              className="w-full h-auto max-h-[85vh] rounded-2xl object-contain block"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
