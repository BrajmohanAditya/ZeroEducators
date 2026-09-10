import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  ShieldCheck,
  Lock,
  Loader2,
  FileText,
  AlertCircle,
  ChevronsUp,
} from "lucide-react";
import { toast } from "sonner";

// Single Page Canvas Component with Intersection Observer for Lazy Rendering
const PdfPageItem = memo(
  ({
    pageNum,
    pdfDoc,
    scale,
    rotation,
    user,
    containerRef,
    onPageVisible,
  }) => {
    const canvasRef = useRef(null);
    const itemRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [isRendered, setIsRendered] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [pageSize, setPageSize] = useState({ width: 600, height: 848 });

    // Measure page dimensions once loaded
    useEffect(() => {
      let active = true;
      if (!pdfDoc) return;

      pdfDoc.getPage(pageNum).then((page) => {
        if (!active) return;
        const viewport = page.getViewport({ scale, rotation });
        setPageSize({ width: viewport.width, height: viewport.height });
      });

      return () => {
        active = false;
      };
    }, [pdfDoc, pageNum, scale, rotation]);

    // Render page function
    const renderCanvas = useCallback(async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const viewport = page.getViewport({ scale, rotation });

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = "100%";
        canvas.style.maxWidth = `${Math.floor(viewport.width)}px`;
        canvas.style.height = "auto";

        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : null;

        const renderContext = {
          canvasContext: ctx,
          transform,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setIsRendering(false);
        setIsRendered(true);
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNum} render error:`, err);
        }
        setIsRendering(false);
      }
    }, [pdfDoc, pageNum, scale, rotation]);

    // Lazy load canvas using IntersectionObserver
    useEffect(() => {
      const el = itemRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Render when page is within 400px of viewport
            if (entry.isIntersecting) {
              renderCanvas();
            }

            // Update active page when centered
            if (entry.intersectionRatio > 0.4) {
              onPageVisible(pageNum);
            }
          });
        },
        {
          root: containerRef?.current || null,
          rootMargin: "400px 0px",
          threshold: [0, 0.4, 0.8],
        }
      );

      observer.observe(el);
      return () => {
        observer.disconnect();
      };
    }, [renderCanvas, pageNum, onPageVisible, containerRef]);

    return (
      <div
        ref={itemRef}
        id={`pdf-page-${pageNum}`}
        className="relative my-3 flex flex-col items-center select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Page Container */}
        <div
          className="relative bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-700/60 max-w-full"
          style={{
            width: `${pageSize.width}px`,
            minHeight: `${pageSize.height}px`,
          }}
        >
          {/* Canvas Rendering */}
          <canvas
            ref={canvasRef}
            className="block select-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Placeholder/Spinner before rendering */}
          {(!isRendered || isRendering) && (
            <div className="absolute inset-0 bg-slate-900/5 flex flex-col items-center justify-center pointer-events-none z-10">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2 opacity-80" />
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Loading Page {pageNum}...
              </span>
            </div>
          )}

          {/* Diagonal Security Watermark across the page */}
          {user && (
            <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-around items-center opacity-[0.08] -rotate-25 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="text-slate-900 font-black text-sm sm:text-base tracking-widest uppercase whitespace-nowrap"
                >
                  {user.email || user.name} • ZERO EDUCATORS • CONFIDENTIAL
                </div>
              ))}
            </div>
          )}

          {/* Subtle Page Number Badge */}
          <div className="absolute top-2 right-2 pointer-events-none select-none z-20 text-[10px] font-mono text-slate-400 bg-white/70 px-2 py-0.5 rounded shadow-2xs">
            Page {pageNum}
          </div>
        </div>
      </div>
    );
  }
);

PdfPageItem.displayName = "PdfPageItem";

const SecurePdfViewer = ({
  pdfUrl,
  title = "Document",
  user,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return Math.max(0.55, Math.min(1.0, (window.innerWidth - 32) / 600));
    }
    return 1.15;
  });
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pageInputValue, setPageInputValue] = useState("1");

  const containerRef = useRef(null);

  // Initialize PDF.js worker
  useEffect(() => {
    const initPdfJs = async () => {
      try {
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
      } catch (err) {
        console.error("Failed to load PDF.js script:", err);
      }
    };

    initPdfJs();
  }, []);

  // Load the PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    setCurrentPage(1);
    setPageInputValue("1");

    const loadDocument = async () => {
      try {
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 25) {
          await new Promise((r) => setTimeout(r, 150));
          attempts++;
        }

        if (!window.pdfjsLib) {
          throw new Error("PDF renderer could not be initialized");
        }

        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("PDF loading error:", err);
        if (isMounted) {
          setLoadError(
            err.message || "Failed to load PDF. Please try again."
          );
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Page tracking callback
  const handlePageVisible = useCallback((pageNum) => {
    setCurrentPage(pageNum);
    setPageInputValue(String(pageNum));
  }, []);

  // Scroll to a specific page
  const scrollToPage = useCallback((pageNum) => {
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Page navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      scrollToPage(prev);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const next = currentPage + 1;
      scrollToPage(next);
    }
  };

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === "Enter") {
      const parsed = parseInt(pageInputValue, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
        scrollToPage(parsed);
      } else {
        setPageInputValue(String(currentPage));
      }
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 64;
    const newScale = Math.max(0.6, Math.min(containerWidth / 620, 2.0));
    setScale(parseFloat(newScale.toFixed(2)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard navigation & security handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape for Fullscreen
      if (e.key === "Escape" && isFullscreen && onToggleFullscreen) {
        onToggleFullscreen();
        return;
      }

      // PageUp / PageDown for scrolling
      if (e.key === "PageUp") {
        handlePrevPage();
      } else if (e.key === "PageDown") {
        handleNextPage();
      }

      // Block Save & Print
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "S", "p", "P", "u", "U"].includes(e.key)
      ) {
        e.preventDefault();
        toast.error("Saving and printing are disabled to protect course materials.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, isFullscreen, onToggleFullscreen]);

  return (
    <div
      className={`flex flex-col select-none overflow-hidden bg-slate-950 ${
        isFullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen"
          : "w-full h-full rounded-3xl border border-slate-800"
      }`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* ── Top Header Toolbar ── */}
      <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800/80 shadow-md">
        {/* Document Title & Security Indicator */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-sm font-bold truncate text-slate-100" title={title}>
              {title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Lock className="w-2.5 h-2.5" /> DRM Protected
              </span>
              <span>•</span>
              <span>Vertical Scroll Active</span>
            </div>
          </div>
        </div>

        {/* User Watermark & Fullscreen Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[170px]">
                {user.email || user.name}
              </span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "View Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Scrollable Viewport Area (Vertical Continuous Scroll via Mouse Wheel) ── */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-auto bg-slate-950 flex flex-col items-center py-6 px-2 sm:px-4 relative select-none scroll-smooth custom-scrollbar"
        onContextMenu={(e) => e.preventDefault()}
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8 my-auto">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm font-medium">Loading document pages...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 text-red-400 max-w-md text-center p-8 bg-red-950/20 border border-red-900/40 rounded-2xl my-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-semibold">{loadError}</p>
            <p className="text-xs text-slate-400">
              Please ensure you are enrolled in this course or refresh the page.
            </p>
          </div>
        ) : (
          /* Render continuous list of all pages */
          <div className="flex flex-col items-center w-full">
            {Array.from({ length: numPages }, (_, index) => index + 1).map(
              (pageNum) => (
                <PdfPageItem
                  key={pageNum}
                  pageNum={pageNum}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  rotation={rotation}
                  user={user}
                  containerRef={containerRef}
                  onPageVisible={handlePageVisible}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Floating Controls Toolbar ── */}
      {!isLoading && !loadError && numPages > 0 && (
        <div className="px-4 py-2.5 bg-slate-950/95 backdrop-blur-md text-white flex items-center justify-between border-t border-slate-800/80 shrink-0 gap-2 select-none z-30">
          {/* Page Navigation & Jump */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-200"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
              <span>Page</span>
              <input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                onBlur={() => setPageInputValue(String(currentPage))}
                className="w-10 px-1 py-0.5 text-center bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
              <span>of {numPages}</span>
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-200"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom and Fit Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.6}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-300 font-mono min-w-[45px] text-center hidden sm:inline">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 2.5}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleFitWidth}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer hidden md:inline"
              title="Fit to Width"
            >
              Fit Width
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer hidden sm:inline"
              title="Rotate Page"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title="Scroll to Top"
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurePdfViewer;
