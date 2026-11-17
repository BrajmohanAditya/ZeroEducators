import React, { useState, useEffect, useMemo } from "react";
import { useGetHeroSectionHook } from "@/hooks/hero.hook";
import { Wallet, Sparkles, Flame, Clock } from "lucide-react";

const OfferTimerPill = () => {
  const { data } = useGetHeroSectionHook();
  const offerTimer = data?.offerTimer;

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!offerTimer || !offerTimer.isActive || !offerTimer.endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(offerTimer.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${String(totalHours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      setTimeLeft(formatted);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [offerTimer]);

  if (!offerTimer || !offerTimer.isActive || !timeLeft) {
    return null;
  }

  const handlePillClick = () => {
    const targetId = (offerTimer.targetUrl || "#hero-banner").replace("#", "");
    const el =
      document.getElementById(targetId) ||
      document.getElementById("hero-banner") ||
      document.getElementById("courses");

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight pulse effect on target banner
      el.classList.add("ring-4", "ring-rose-500", "ring-offset-2", "transition-all", "duration-500");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-rose-500", "ring-offset-2");
      }, 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePillClick}
      title={`${offerTimer.title} - Click to see offer`}
      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all duration-300 group cursor-pointer shrink-0 select-none max-w-full"
    >
      {/* Wallet / Festive Icon */}
      <span className="text-sm sm:text-base leading-none shrink-0">👛</span>

      {/* Offer Title */}
      <span className="text-[11px] sm:text-xs font-black text-slate-800 tracking-tight leading-none group-hover:text-rose-700 transition-colors truncate max-w-[130px] sm:max-w-none">
        {offerTimer.title || "Dussehra Dhamaka"}
      </span>

      {/* Countdown Timer Pill (Matching screenshot red/pink pill) */}
      <span className="inline-flex items-center gap-1 font-mono font-black text-[11px] sm:text-xs bg-gradient-to-r from-rose-600 to-pink-600 text-white px-2 py-0.5 rounded-full shadow-2xs tracking-wider shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
        <span>{timeLeft}</span>
      </span>
    </button>
  );
};

export default OfferTimerPill;
