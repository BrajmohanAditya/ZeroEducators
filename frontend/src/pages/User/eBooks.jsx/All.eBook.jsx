import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  ExternalLink,
  Search,
  ArrowLeft,
  Loader2,
  Play,
  Lock,
} from "lucide-react";
import { useGetEbooksHook } from "../../../hooks/eBook.jsx/ebook.hook";
import { toast } from "sonner";

const AllEbooks = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetEbooksHook();
  const ebooks = data?.ebooks || [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEbooks = ebooks.filter((ebook) =>
    ebook.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate("/studyMaterial")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold mb-4 transition text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Practice Books & eBooks
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Select an eBook to study chapters or practice topic-wise
              questions.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search eBook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm shadow-sm transition"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 mt-2 text-sm">Loading eBooks...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-red-500 bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="font-semibold">Failed to load eBooks.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-5 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredEbooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              No eBooks Found
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              There are no matching eBooks available. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredEbooks.map((ebook) => (
              <div
                key={ebook._id}
                className="bg-white border border-slate-100 hover:border-indigo-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-350 flex flex-col group max-w-[220px] w-full mx-auto"
              >
                {/* Thumbnail Container */}
                <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {ebook.thumbnail ? (
                    <img
                      src={ebook.thumbnail}
                      alt={ebook.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-300" />
                  )}

                  {/* Price Tag Overlay */}
                  <div className="absolute top-2 right-2">
                    {ebook.amount > 0 ? (
                      <span className="bg-slate-900/90 text-white font-extrabold text-[10px] px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                        ₹{ebook.amount}
                      </span>
                    ) : (
                      <span className="bg-emerald-600/90 text-white font-extrabold text-[10px] px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* eBook Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ebook.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold text-slate-500 mt-1.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        {ebook.numberOfChapters || 0} Ch
                      </span>
                      {ebook.maxQuestionsPerChapter > 0 && (
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                          Limit: {ebook.maxQuestionsPerChapter} Qs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5 space-y-1.5">
                    <button
                      onClick={() => navigate(`/ebooks/practice/${ebook._id}`)}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-sm hover:shadow"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Practice Chapters
                    </button>
                    {ebook.pdfUrl ? (
                      <a
                        href={ebook.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition text-center shadow-sm"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Read PDF
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full py-1.5 bg-slate-50 border border-slate-200 text-slate-400 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEbooks;
