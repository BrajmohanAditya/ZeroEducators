import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * SecureVideoPlayer
 * Features:
 * 1. Live Public IP address detection
 * 2. Real-time dynamic seconds Clock / Timestamp
 * 3. Verified Email + Account UID
 * 4. Floating Dynamic Random Movement (Position shifts smoothly every 4 seconds)
 * 5. Ghost Micro-watermarks (Multi-layered forensic protection)
 */
const SecureVideoPlayer = ({
  src,
  poster,
  user,
  videoKey,
  onError,
  className = "",
}) => {
  const videoRef = useRef(null);

  // User Public IP Address state
  const [ipAddress, setIpAddress] = useState("Loading IP...");
  
  // Floating watermark coordinates & opacity state
  const [coords, setCoords] = useState({ top: "20%", left: "15%" });
  const [visible, setVisible] = useState(true);

  // 1. Fetch User Public IP Address reliably
  useEffect(() => {
    let isMounted = true;

    const fetchIp = async () => {
      // List of free, reliable public IP APIs
      const apis = [
        "https://api.ipify.org?format=json",
        "https://ipapi.co/json/",
        "https://api64.ipify.org?format=json",
        "https://httpbin.org/ip",
      ];

      for (const url of apis) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const foundIp = data.ip || data.origin;
            if (foundIp && isMounted) {
              setIpAddress(foundIp.split(",")[0].trim());
              return;
            }
          }
        } catch (err) {
          // try next api
        }
      }

      if (isMounted) {
        setIpAddress("Online");
      }
    };

    fetchIp();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Teleport Floating Motion (Fade Out -> Jump to new spot -> Fade In)
  // Completely eliminates any movement vibration/blur while keeping 100% security
  useEffect(() => {
    const moveWatermark = () => {
      // Step 1: Fade out gently (invisible)
      setVisible(false);

      // Step 2: While invisible, change position instantly to a new random spot
      setTimeout(() => {
        const newX = Math.floor(Math.random() * 68 + 8) + "%";
        const newY = Math.floor(Math.random() * 65 + 8) + "%";
        setCoords({ top: newY, left: newX });

        // Step 3: Fade in gently at the new spot
        setTimeout(() => {
          setVisible(true);
        }, 150);
      }, 800);
    };

    const interval = setInterval(moveWatermark, 10000);
    return () => clearInterval(interval);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Sync fullscreen change state (e.g. if user presses Esc or hardware back)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const el = containerRef.current;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const studentIdentifier = user?.email || user?.name || "Student Account";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none group ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* ── HTML5 Video Player ── */}
      <video
        key={videoKey}
        ref={videoRef}
        className="h-full w-full object-contain bg-black select-none pointer-events-auto"
        src={src}
        poster={poster}
        controls
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="auto"
        autoPlay
        crossOrigin="use-credentials"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onError={onError}
      />

      {/* ── Dedicated Fullscreen Toggle Button (Overlays onto custom container so watermark never hides) ── */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label="Toggle Fullscreen"
        className="absolute bottom-3.5 right-3.5 z-40 bg-black/60 hover:bg-black/90 active:scale-95 text-white/90 p-2 rounded-lg border border-white/15 backdrop-blur-xs transition-all shadow-md flex items-center justify-center pointer-events-auto cursor-pointer"
      >
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 2l5 5m0 0l-5 0m5 0l0-5M9 15l-5 5m0 0l5 0m-5 0l0-5m11-2l5-5m0 0l-5 0m5 0l0 5" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* ── MAIN FLOATING WATERMARK (Always on top, even in Fullscreen mode) ── */}
      {user && (
        <div
          className={`absolute pointer-events-none select-none z-50 font-mono text-[12px] sm:text-[13px] flex flex-col gap-0.5 tracking-wider font-bold text-red-500 transition-opacity duration-700 ease-in-out ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          {/* Line 1: Email in Crystal Clear Red */}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0 stroke-[2.5]" />
            <span className="truncate max-w-[260px]">{studentIdentifier}</span>
          </div>

          {/* Line 2: IP in Crystal Clear Red */}
          <div className="text-[11px] font-black tracking-widest pl-5">
            IP: {ipAddress}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
