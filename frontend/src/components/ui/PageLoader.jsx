import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Global PageLoader — wraps any page/component to block rendering
 * until all data is fully loaded.
 *
 * Usage:
 *   <PageLoader isLoading={isLoading} isError={isError} errorMessage="Custom error">
 *     <YourPageContent />
 *   </PageLoader>
 *
 * Props:
 *   isLoading     {boolean}   — show spinner while true
 *   isError       {boolean}   — show error UI while true
 *   errorMessage  {string}    — optional custom error message
 *   children      {ReactNode} — rendered only when !isLoading && !isError
 */
const PageLoader = ({
  isLoading,
  isError,
  errorMessage = "Something went wrong. Please try again.",
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#158993] animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <p className="text-red-500 font-semibold text-base">Error</p>
          <p className="text-slate-500 text-sm max-w-xs">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageLoader;
