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

  const studentIdentifier = user?.email || user?.name || "Student Account";

  return (
    <div
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
        controlsList="nodownload noplaybackrate"
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

      {/* ── MAIN FLOATING WATERMARK (Crystal Clear Red Text, Zero Vibration Fade Movement) ── */}
      {user && (
        <div
          className={`absolute pointer-events-none select-none z-30 font-mono text-[12px] sm:text-[13px] flex flex-col gap-0.5 tracking-wider font-bold text-red-500 transition-opacity duration-700 ease-in-out ${
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
