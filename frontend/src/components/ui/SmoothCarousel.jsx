import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SmoothCarousel = ({ children, itemsPerSet, autoSlideInterval = 4000 }) => {
  const sliderRef = useRef(null);

  const getItemWidth = () => {
    if (sliderRef.current && sliderRef.current.children.length > 0) {
      // 24 is the gap (gap-6)
      return sliderRef.current.children[0].offsetWidth + 24; 
    }
    return 0;
  };

  const smoothScrollTo = (element, targetScrollLeft, duration) => {
    const startScrollLeft = element.scrollLeft;
    const distance = targetScrollLeft - startScrollLeft;
    let startTime = null;

    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t * t + b;
      t -= 2;
      return (c / 2) * (t * t * t + 2) + b;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      element.scrollLeft = ease(timeElapsed, startScrollLeft, distance, duration);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        element.scrollLeft = targetScrollLeft;
      }
    };
    requestAnimationFrame(animation);
  };

  const handleScroll = () => {
    if (!sliderRef.current || itemsPerSet === 0) return;
    const slider = sliderRef.current;
    
    if (slider.children.length === 0) return;
    const itemWidth = getItemWidth();
    const setWidth = itemWidth * itemsPerSet;

    if (slider.scrollLeft < itemWidth) {
      slider.scrollLeft += setWidth * 2;
    } else if (slider.scrollLeft > slider.scrollWidth - slider.clientWidth - itemWidth) {
      slider.scrollLeft -= setWidth * 2;
    }
  };

  useEffect(() => {
    // Timeout ensures children are fully rendered and layout is computed before scrolling
    const timer = setTimeout(() => {
      if (sliderRef.current && itemsPerSet > 0) {
        const itemWidth = getItemWidth();
        sliderRef.current.scrollLeft = itemWidth * itemsPerSet * 3;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [itemsPerSet]);

  const scrollLeftBtn = () => {
    if (sliderRef.current) smoothScrollTo(sliderRef.current, sliderRef.current.scrollLeft - getItemWidth(), 800);
  };

  const scrollRightBtn = () => {
    if (sliderRef.current) smoothScrollTo(sliderRef.current, sliderRef.current.scrollLeft + getItemWidth(), 800);
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const startDragging = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const stopDragging = () => setIsDragging(false);

  const onDrag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  useEffect(() => {
    if (isHovered || itemsPerSet <= 1) return;
    const interval = setInterval(() => scrollRightBtn(), autoSlideInterval);
    return () => clearInterval(interval);
  }, [isHovered, itemsPerSet, autoSlideInterval]);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        onClick={scrollLeftBtn}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 bg-slate-800 text-white p-2.5 rounded-full shadow-lg hover:bg-slate-900 transition transform hover:scale-105 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        onClick={scrollRightBtn}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-20 bg-slate-800 text-white p-2.5 rounded-full shadow-lg hover:bg-slate-900 transition transform hover:scale-105 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div 
        ref={sliderRef}
        className={`flex gap-6 overflow-x-auto py-6 px-4 no-scrollbar cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={startDragging}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={onDrag}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
};

export default SmoothCarousel;
