import React from "react";
import { useNavigate } from "react-router-dom";

import {
  PlaySquare,

  FileCheck,
  Book,
  FileBox,
  Calendar,
  MessageCircle,
  Send,
  Target,
  Megaphone,
  Crown,
} from "lucide-react";

import { useGetQuizzesHook } from "@/hooks/quiz/quiz.hook";
import InstagramIcon from "@/components/icons/InstagramIcon";
const StudyMaterial = () => {
  const navigate = useNavigate();

  // (The old 'quizzes' variable was removed because 'data' is no longer defined)
  // Fetch Free Quizzes
  const { data: freeData, isLoading: isFreeLoading } =
    useGetQuizzesHook("Free");
  const freeQuizzes = freeData?.quizzes || [];
  // Fetch Paid Quizzes
  const { data: paidData, isLoading: isPaidLoading } =
    useGetQuizzesHook("Paid");
  const paidQuizzes = paidData?.quizzes || [];
  // ... rest of your code

  const cards = [
    {
      title: "Today Live Test",
      bgColor: "bg-[#F3E8FF]", // Light purple
      titleColor: "text-purple-700",
      mainIcon: (
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute w-8 h-8 bg-red-400 rounded-full animate-pulse opacity-60"></div>
          <div className="relative w-6 h-6 bg-red-500 rounded-full shadow-lg border-2 border-white"></div>
        </div>
      ),
      items: [...freeQuizzes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map((quiz, index) => {
          // Keep rotating background colors for a nice UI
          const bgStyles = [
            "bg-purple-100",
            "bg-orange-100",
            "bg-amber-100",
          "bg-teal-100",
        ];

        const bg = bgStyles[index % bgStyles.length];

        return {
          name: quiz.nameOfExam || "Unknown Exam",
          action: () => navigate("/quizeDetail?type=Free"),
          icon: quiz.logoUrl ? (
            <img
              src={quiz.logoUrl}
              alt={quiz.nameOfExam || "Exam logo"}
              className="w-14 h-14 object-contain hover:scale-110 transition-transform rounded-lg mix-blend-multiply"
            />
          ) : (
            // Fallback icon just in case a quiz doesn't have a logo
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200" />
          ),
          iconBg: "", // Empty to prevent the colored background circle
        };
      }),
    },

    {
      title: "Premium Test",
      bgColor: "bg-[#E6F8EA]", // Light green
      titleColor: "text-emerald-700",
      mainIcon: (
        <Crown
          className="w-20 h-20 text-emerald-300 drop-shadow-md"
          strokeWidth={1}
        />
      ),
      items: paidQuizzes.slice(0, 4).map((quiz, index) => {
        return {
          name: quiz.nameOfExam || "Unknown Exam",
          action: () => navigate("/quizeDetail?type=Paid"),
          icon: quiz.logoUrl ? (
            <img
              src={quiz.logoUrl}
              alt={quiz.nameOfExam || "Exam logo"}
              className="w-14 h-14 object-contain hover:scale-110 transition-transform rounded-lg mix-blend-multiply"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200" />
          ),
          iconBg: "", // Empty to prevent the colored background circle
        };
      }),
    },

    {
      title: "Study Materials",
      bgColor: "bg-[#E6EFFF]", // Light blue
      titleColor: "text-blue-700",
      mainIcon: (
        <Target
          className="w-20 h-20 text-blue-300 drop-shadow-md"
          strokeWidth={1}
        />
      ),
      items: [
        {
          name: "Free PDFs",
          icon: <FileCheck className="w-5 h-5 text-blue-500" />,
          iconBg: "bg-blue-100",
        },
        {
          name: "Practice Book",
          icon: <Book className="w-5 h-5 text-pink-500" />,
          iconBg: "bg-pink-100",
          action: () => navigate("/ebooks"),
        },
        {
          name: "PYP",
          icon: <FileBox className="w-5 h-5 text-emerald-600" />,
          iconBg: "bg-emerald-100",
        },
        {
          name: "Daily CA",
          icon: <Calendar className="w-5 h-5 text-purple-600" />,
          iconBg: "bg-purple-100",
        },
      ],
    },

    {
      title: "Follow Us",
      bgColor: "bg-[#FFF4E5]", // Light orange/beige
      titleColor: "text-orange-700",
      mainIcon: (
        <Megaphone
          className="w-20 h-20 text-orange-300 drop-shadow-md"
          strokeWidth={1}
        />
      ),
      items: [
        {
          name: "WhatsApp",
          icon: <MessageCircle className="w-5 h-5 text-green-500" />,
          iconBg: "bg-green-100",
          action: () => window.open("https://chat.whatsapp.com/D0zaMV3rs8V02UWbB8cmz4", "_blank"),
        },
        {
          name: "Instagram",
          icon: <InstagramIcon className="w-5 h-5 text-pink-600" />,
          iconBg: "bg-pink-100",
          action: () => window.open("https://instagram.com/", "_blank"),
        },
        {
          name: "Channel",
          icon: <Send className="w-5 h-5 text-blue-500" />,
          iconBg: "bg-blue-100",
          action: () => window.open("https://t.me/+pjxH9qZmjyo0MTFl", "_blank"),
        },
        {
          name: "Group",
          icon: <Send className="w-5 h-5 text-sky-500" />,
          iconBg: "bg-sky-100",
          action: () => window.open("https://t.me/+2ogEgNHN7OljMTE1", "_blank"),
        },
      ],
    },
  ];

  return (
    <div className="p-8 pb-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Study Dashboard
        </h1>
        <p className="text-slate-500 font-medium mb-10 text-lg">
          Access your materials, tests, and community in one place.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-[2rem] p-6 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}
            >
              {/* Large Background Icon */}
              <div className="absolute right-4 top-4 opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                {card.mainIcon}
              </div>

              {/* Card Header */}
              <div className="relative z-10 mb-8 min-h-[4rem]">
                <h2
                  className={`text-2xl font-extrabold ${card.titleColor} mb-2`}
                >
                  {card.title}
                </h2>
                {card.subtitle && (
                  <p className="text-slate-600 font-medium text-sm leading-relaxed max-w-[85%]">
                    {card.subtitle}
                  </p>
                )}
              </div>

              {/* Card Items Grid */}
              {card.items && card.items.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {card.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={item.action}
                      className={`flex flex-col items-center justify-center bg-white rounded-2xl p-1 transition-all duration-300 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 ${item.action ? "cursor-pointer" : ""}`}
                    >
                      {item.iconBg ? (
                        <div
                          className={`${item.iconBg} p-3 rounded-xl mb-3 shadow-sm flex items-center justify-center`}
                        >
                          {item.icon}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center mb-3 mt-1 h-16">
                          {item.icon}
                        </div>
                      )}
                      <span
                        className="text-xs font-bold text-slate-700 text-center truncate w-full block px-1"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center relative z-10 h-32 mt-4">
                  <div
                    className={`px-8 py-3 bg-white/60 backdrop-blur-md rounded-xl font-bold ${card.titleColor} border border-white/60 hover:bg-white transition-colors cursor-pointer shadow-sm w-full text-center flex items-center justify-center gap-2`}
                  >
                    <PlaySquare className="w-5 h-5" />
                    Enter Now
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyMaterial;
