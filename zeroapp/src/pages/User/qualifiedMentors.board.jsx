import React from "react";
import { useGetQualifiedMentorsHook } from "../../hooks/qualifiedMentors.hook.js";
import { GraduationCap, Briefcase, BookOpen, User } from "lucide-react";
import SmoothCarousel from "@/components/ui/SmoothCarousel";

const QualifiedMentorsDisplay = () => {
  const { data: mentorsResp, isLoading } = useGetQualifiedMentorsHook();
  const mentors = mentorsResp?.mentors || [];
  
  // Duplicate mentors for infinite carousel scroll
  const displayMentors = mentors.length > 0 ? Array(8).fill(mentors).flat() : [];

  // Helper to get high-quality, perfectly cropped square images from Cloudinary
  const optimizeImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("ui-avatars")) return url;
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      if (!url.includes("/upload/c_")) {
        // c_thumb + g_face + z_0.7 zooms into the face nicely for a closer portrait look
        return url.replace("/upload/", "/upload/c_thumb,g_face,z_0.7,h_400,w_400,q_auto:best,f_auto/");
      }
    }
    return url;
  };

  // Helper to format qualifications text into a nice point-wise list
  const formatTextToList = (text) => {
    if (!text) return null;
    
    // If text already has newlines, use them
    if (text.includes("\n")) {
      return text.split("\n").map((line, i) => {
        const t = line.trim();
        return t ? <div key={i} className="mb-1.5 last:mb-0">{t}</div> : null;
      });
    }

    try {
      // Split by emojis to create a point-wise list automatically
      const parts = text.split(/(?=\p{Extended_Pictographic})/gu);
      if (parts.length > 1) {
        return parts.map((part, i) => {
          const t = part.trim();
          return t ? <div key={i} className="mb-2 last:mb-0 flex items-start gap-2"><span>{t}</span></div> : null;
        });
      }
    } catch (e) {}

    // Check if it's a comma-separated list
    if (text.includes(",")) {
      let prefix = "";
      let mainText = text;
      
      const colonIdx = text.indexOf(":");
      if (colonIdx > -1 && colonIdx < text.indexOf(",")) {
        prefix = text.substring(0, colonIdx + 1);
        mainText = text.substring(colonIdx + 1);
      }

      const items = mainText.split(",").map(i => i.trim()).filter(Boolean);
      
      if (items.length > 1) {
        return (
          <div>
            {prefix && <div className="mb-1.5 font-bold text-slate-800">{prefix}</div>}
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-500 mt-1 flex-shrink-0 text-[10px]">■</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
    }

    return <div>{text}</div>;
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (mentors.length === 0) return null;

  return (
    <div className="py-16 bg-slate-50 overflow-hidden font-sans relative">
      {/* Decorative Background Patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-100 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Meet Our <span className="text-blue-600">Expert Mentors</span>
          </h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <p className="max-w-2xl mx-auto text-slate-600 text-base md:text-lg leading-relaxed">
            Learn from the best. Our highly qualified and experienced faculty members are dedicated to guiding you towards your dream career.
          </p>
        </div>

        {/* Mentors Carousel */}
        <div className="max-w-7xl mx-auto">
          <SmoothCarousel itemsPerSet={mentors.length} autoSlideInterval={4000}>
            {displayMentors.map((mentor, index) => (
              <div 
                key={`${mentor._id}-${index}`} 
                className="w-[85vw] max-w-[340px] sm:min-w-[340px] sm:max-w-[360px] group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0 relative"
              >
              {/* Header Gradient (subtle) */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50/80 to-transparent"></div>
              
              {/* Image Section */}
              <div className="relative pt-8 pb-4 px-6 flex flex-col items-center">
                <div className="w-28 h-28 shrink-0 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                  {mentor.imageUrl ? (
                    <img 
                      src={optimizeImageUrl(mentor.imageUrl)} 
                      alt={mentor.name}
                      className="w-full h-full aspect-square shrink-0 object-cover object-top"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                {/* Name */}
                <h3 className="mt-4 text-[19px] font-extrabold text-slate-900 tracking-tight text-center relative z-10">
                  {mentor.name}
                </h3>
                
                {/* Subject Badge */}
                <div className="mt-2.5 relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100 shadow-sm">
                    <BookOpen className="w-3.5 h-3.5" />
                    {mentor.subject}
                  </span>
                </div>
              </div>

              <div className="px-6">
                <div className="h-px w-full bg-slate-100 mt-2 mb-5"></div>
              </div>

              {/* Content Body */}
              <div className="px-6 pb-8 flex-1 flex flex-col">
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {/* Qualifications */}
                  {mentor.qualifications && (
                    <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/60 shadow-sm hover:shadow-md hover:bg-blue-50/70 transition-all duration-300">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        Qualifications
                      </h4>
                      <div className="text-[13.5px] font-semibold text-slate-700 leading-relaxed">
                        {formatTextToList(mentor.qualifications)}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {mentor.experience && (
                    <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/60 shadow-sm hover:shadow-md hover:bg-amber-50/70 transition-all duration-300">
                      <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        Experience
                      </h4>
                      <div className="text-[13.5px] font-semibold text-slate-700 leading-relaxed">
                        {formatTextToList(mentor.experience)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </SmoothCarousel>
        </div>

      </div>
    </div>
  );
};

export default QualifiedMentorsDisplay;
