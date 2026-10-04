import { useState, useEffect, useRef } from "react";
import HlsLib from "hls.js";

// Resilient HLS reference: prioritize global window.Hls if loaded via CDN, fallback to bundled HlsLib
const Hls = typeof window !== "undefined" && window.Hls ? window.Hls : HlsLib;
import {
  ShieldCheck,
  Loader2,
  Settings,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Sliders,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  RotateCcw,
  RotateCw,
} from "lucide-react";

/**
 * Playback Speed Options
 */
const speedOptions = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "Normal (1x)" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
];

/**
 * Video Quality Options
 */
const qualityOptions = [
  { id: "auto", label: "Auto (Recommended - Adaptive)", shortLabel: "Auto", badge: "Auto" },
  { id: "720p", label: "720p (HD)", shortLabel: "720p", badge: "HD" },
  { id: "480p", label: "480p (Data Saver)", shortLabel: "480p", badge: "SD" },
  { id: "360p", label: "360p (Low Data)", shortLabel: "360p", badge: "SD" },
];

/**
 * Appends or updates the quality query param in a video streaming URL
 */
const getQualityUrl = (originalSrc, targetQuality) => {
  if (!originalSrc || typeof originalSrc !== "string") return "";
  // CRITICAL: S3 / Zata / pre-signed URLs ko kabhi mutate mat karo —
  // yeh cryptographic SigV4 signature tod deta hai aur buffering/403 errors cause karta hai.
  // Koi bhi http(s) URL jo hum serve karte hain direct return karo.
  if (
    originalSrc.startsWith("http://") ||
    originalSrc.startsWith("https://")
  ) {
    return originalSrc; // Direct URL — no tampering
  }
  // Only modify relative URLs (local dev / proxy routes)
  try {
    const parsed = new URL(originalSrc, window.location.origin);
    if (targetQuality && targetQuality !== "auto") {
      parsed.searchParams.set("quality", targetQuality);
    } else {
      parsed.searchParams.delete("quality");
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return originalSrc;
  }
};

/**
 * Helper to format seconds into M:SS or H:MM:SS
 */
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return "0:00";
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/**
 * SecureVideoPlayer
 * Unified YouTube-style video player with:
 * 1. Perfectly aligned controls (Play, Volume, Timeline, Time, Settings, Fullscreen)
 * 2. Speed (0.25x - 2x) & Quality (Auto - 360p) in Settings menu
 * 3. Forensically protected floating dynamic watermark
 * 4. Keyboard shortcuts (Space/K for play, M for mute, F for fullscreen, Shift+>/< for speed)
 */
const SecureVideoPlayer = ({
  src,
  poster,
  user,
  videoKey,
  onError,
  onQualityChange,
  className = "",
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const progressBarRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const hlsRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  // Volume state
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem("zero_video_volume");
      return saved !== null ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(false);

  // User Public IP Address state
  const [ipAddress, setIpAddress] = useState("Loading IP...");

  // Floating watermark coordinates & opacity state
  const [coords, setCoords] = useState({ top: "20%", left: "15%" });
  const [visible, setVisible] = useState(true);

  // Buffering indicator state
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Controls auto-hide visibility
  const [showControls, setShowControls] = useState(true);

  // Playback Speed State (persistent in localStorage)
  const [playbackSpeed, setPlaybackSpeed] = useState(() => {
    try {
      const saved = localStorage.getItem("zero_playback_speed");
      return saved ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });

  // Video Quality State
  const [quality, setQuality] = useState(() => {
    try {
      return localStorage.getItem("zero_video_quality") || "auto";
    } catch {
      return "auto";
    }
  });

  const effectiveSrc = getQualityUrl(src, quality);
  const isHls = Boolean(
    effectiveSrc &&
      (effectiveSrc.includes(".m3u8") ||
        effectiveSrc.includes("/hls/") ||
        effectiveSrc.includes("format=m3u8"))
  );


  // Settings Panel state: false | true
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Settings Tab: 'main' | 'speed' | 'quality'
  const [menuTab, setMenuTab] = useState("main");

  // YouTube-Style On-Screen Animated Toast
  const [screenToast, setScreenToast] = useState(null);

  // Hover timestamp tooltip on progress bar
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPercent, setHoverPercent] = useState(0);

  const triggerToast = (text, icon) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setScreenToast({ text, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setScreenToast(null);
    }, 1200);
  };

  // Helper to apply speed
  const applyPlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  useEffect(() => {
    applyPlaybackSpeed(playbackSpeed);
  }, [playbackSpeed, videoKey, src]);

  // Controls auto-hide timer
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !isSettingsOpen) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  };

  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !isSettingsOpen) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, isSettingsOpen]);

  // Resolve HLS stream URL — use direct Zata S3 URL (no backend proxy)
  // CORS is configured on Zata S3 bucket to allow all origins for GET/HEAD,
  // so browser can stream .m3u8 and .ts chunks directly without going through EC2.
  // This removes the double-trip bottleneck: Student → EC2 → Zata → EC2 → Student
  // Now it's:                                 Student → Zata S3 directly
  const resolveStreamUrl = (rawSrc) => {
    if (!rawSrc || typeof rawSrc !== "string") return rawSrc;
    // Direct URL — return as-is (Zata S3 CORS allows browser to fetch directly)
    return rawSrc;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveSrc) return;

    const streamSource = resolveStreamUrl(effectiveSrc);

    if (isHls) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,           // false = better for pre-recorded lectures (not live)
          maxBufferLength: 30,             // Buffer 30s ahead (sweet spot for mobile & desktop)
          maxMaxBufferLength: 60,          // Max 60s on fast connections (was 120s — caused mobile tab crashes)
          backBufferLength: 15,            // Keep 15s behind current position (was 30s)
          maxBufferSize: 20 * 1000 * 1000, // 20MB max buffer (was 60MB — budget phones (2-3GB RAM) crashed)
          startLevel: -1,                  // Auto quality selection at start
          abrEwmaDefaultEstimate: 1500000, // Assume 1.5Mbps initially = India average 4G (was 5Mbps — caused startup buffering)
          abrBandWidthFactor: 0.85,        // Use 85% of measured bandwidth (safety margin for unstable networks)
          abrBandWidthUpFactor: 0.7,       // Conservative upshift (don't rush to 720p on a brief speed spike)
          progressive: true,               // Start playing as soon as first segment loads
          fragLoadingTimeOut: 20000,       // 20s timeout per .ts segment (was default 20s, explicit)
          manifestLoadingTimeOut: 15000,   // 15s timeout for .m3u8 manifest
          levelLoadingTimeOut: 15000,      // 15s timeout for quality level manifests
          fragLoadingMaxRetry: 4,          // Retry failed .ts segments up to 4 times
          manifestLoadingMaxRetry: 3,      // Retry failed manifest up to 3 times
        });
        hlsRef.current = hls;

        hls.loadSource(streamSource);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          updateDuration();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("[HLS] Network notice, recovering...", data.details);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("[HLS] Media error, recovering...", data.details);
                hls.recoverMediaError();
                break;
              default:
                console.warn("[HLS] Fatal error, destroying instance:", data.details);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS for Safari / iOS WebKit
        video.src = streamSource;
      }
    } else {
      // Standard MP4 stream: clean up any Hls instance so native src takes over
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveSrc, isHls, videoKey]);

  // Resilient duration updater
  const updateDuration = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const d = vid.duration;
    if (typeof d === "number" && !isNaN(d) && isFinite(d) && d > 0) {
      setDuration(d);
    }
  };

  // Resilient buffer progress updater
  const updateBuffered = () => {
    const vid = videoRef.current;
    if (!vid || !vid.buffered || vid.buffered.length === 0) return;
    try {
      const current = vid.currentTime;
      for (let i = 0; i < vid.buffered.length; i++) {
        if (vid.buffered.start(i) <= current && current <= vid.buffered.end(i)) {
          setBufferedEnd(vid.buffered.end(i));
          return;
        }
      }
      setBufferedEnd(vid.buffered.end(vid.buffered.length - 1));
    } catch {
      // ignore buffer read errors
    }
  };

  // Video metadata loaded handler
  const handleLoadedMetadata = () => {
    updateDuration();
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      // Seamlessly restore playback position when switching quality
      if (pendingSeekRef.current) {
        const { time, play } = pendingSeekRef.current;
        pendingSeekRef.current = null;
        if (typeof time === "number" && isFinite(time) && time > 0) {
          videoRef.current.currentTime = time;
        }
        if (play) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  };

  // Video time update tick
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isBuffering) {
      setIsBuffering(false);
    }
    setCurrentTime(vid.currentTime);
    if (!duration || !isFinite(duration)) {
      updateDuration();
    }
    updateBuffered();
  };

  // YouTube-Style Skip forward / backward (+10s / -10s)
  const handleSkip = (seconds) => {
    const vid = videoRef.current;
    if (!vid) return;
    const maxDur = duration && isFinite(duration) ? duration : vid.duration || Infinity;
    const target = Math.max(0, Math.min(maxDur, vid.currentTime + seconds));
    vid.currentTime = target;
    setCurrentTime(target);
    triggerToast(
      seconds > 0 ? `+${seconds}s` : `${seconds}s`,
      seconds > 0 ? (
        <RotateCw className="w-5 h-5 text-emerald-400" />
      ) : (
        <RotateCcw className="w-5 h-5 text-emerald-400" />
      )
    );
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch((err) => {
        console.log("Playback start notice:", err?.message || err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle Mute / Unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
    if (!newMute && volume === 0) {
      handleVolumeChange(0.5);
    }
  };

  // Volume slider change
  const handleVolumeChange = (newVol) => {
    const v = Math.max(0, Math.min(1, parseFloat(newVol)));
    setVolume(v);
    setIsMuted(v === 0);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    try {
      localStorage.setItem("zero_video_volume", String(v));
    } catch {
      // ignore
    }
  };

  // Progress bar seek calculation
  const calculateSeekTime = (clientX) => {
    if (!progressBarRef.current || !duration) return null;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return { time: pos * duration, percent: pos * 100 };
  };

  // Progress click / scrub seek
  const handleSeek = (e) => {
    const seekData = calculateSeekTime(e.clientX);
    if (!seekData || !videoRef.current) return;
    videoRef.current.currentTime = seekData.time;
    setCurrentTime(seekData.time);
  };

  // Progress hover tracking
  const handleProgressMouseMove = (e) => {
    const seekData = calculateSeekTime(e.clientX);
    if (seekData) {
      setHoverTime(seekData.time);
      setHoverPercent(seekData.percent);
    }
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    applyPlaybackSpeed(newSpeed);
    try {
      localStorage.setItem("zero_playback_speed", String(newSpeed));
    } catch {
      // ignore
    }
    setIsSettingsOpen(false);
    triggerToast(
      `${newSpeed === 1 ? "Normal (1x)" : `${newSpeed}x`} Speed`,
      <Gauge className="w-5 h-5 text-emerald-400" />
    );
  };

  // Handle quality change with real stream switching
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    try {
      localStorage.setItem("zero_video_quality", newQuality);
    } catch {
      // ignore
    }
    setIsSettingsOpen(false);

    // If HLS stream is active, switch quality level adaptively in hls.js
    if (hlsRef.current && hlsRef.current.levels && hlsRef.current.levels.length > 0) {
      if (newQuality === "auto") {
        hlsRef.current.currentLevel = -1; // Auto adaptive
      } else {
        const targetHeight = parseInt(newQuality, 10);
        const matchIdx = hlsRef.current.levels.findIndex(
          (lvl) => lvl.height === targetHeight
        );
        hlsRef.current.currentLevel = matchIdx !== -1 ? matchIdx : -1;
      }
    } else if (videoRef.current) {
      // MP4 quality switch — spinner dikhao jab tak nayi file load na ho
      setIsBuffering(true);
      const savedTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      pendingSeekRef.current = { time: savedTime, play: wasPlaying };
      if (typeof onQualityChange === "function") {
        onQualityChange(newQuality);
      }
    }

    const chosen = qualityOptions.find((q) => q.id === newQuality);
    triggerToast(
      `Quality: ${chosen?.shortLabel || newQuality}`,
      <Sliders className="w-5 h-5 text-emerald-400" />
    );
  };

  // 1. Fetch User Public IP Address reliably (with sessionStorage caching)
  useEffect(() => {
    let isMounted = true;

    // Check cached IP first to avoid unnecessary network calls
    try {
      const cached = sessionStorage.getItem("cached_user_ip");
      if (cached) {
        setIpAddress(cached);
        return;
      }
    } catch {
      // sessionStorage might fail in restricted iframe / storage
    }

    const fetchIp = async () => {
      const apis = [
        "https://api.ipify.org?format=json",
        "https://api64.ipify.org?format=json",
        "https://api.seeip.org/jsonip",
      ];

      for (const url of apis) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            const foundIp = data.ip || data.origin;
            if (foundIp && isMounted) {
              const cleanIp = foundIp.split(",")[0].trim();
              setIpAddress(cleanIp);
              try {
                sessionStorage.setItem("cached_user_ip", cleanIp);
              } catch {}
              return;
            }
          }
        } catch {
          // continue
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

  // 2. Teleport Floating Watermark (Fade Out -> Jump -> Fade In)
  useEffect(() => {
    const moveWatermark = () => {
      setVisible(false);
      setTimeout(() => {
        const newX = Math.floor(Math.random() * 68 + 8) + "%";
        const newY = Math.floor(Math.random() * 65 + 8) + "%";
        setCoords({ top: newY, left: newX });
        setTimeout(() => {
          setVisible(true);
        }, 150);
      }, 800);
    };

    const interval = setInterval(moveWatermark, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fullscreen sync & Screen Orientation unlock listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentFs);

      // If user exited fullscreen via back button, ESC, or swipe gesture, restore orientation
      if (!isCurrentFs && window.screen?.orientation?.unlock) {
        try {
          window.screen.orientation.unlock();
        } catch {
          // ignore
        }
      }
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
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el?.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el?.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }

        // 🚀 Automatically lock to landscape mode on mobile/tablet devices
        if (window.screen?.orientation?.lock) {
          try {
            await window.screen.orientation.lock("landscape");
          } catch (orientErr) {
            console.log("Landscape orientation note:", orientErr?.message || orientErr);
          }
        }
      } else {
        // Unlock orientation back to portrait / auto
        if (window.screen?.orientation?.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch {
            // ignore
          }
        }

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

  // 4. Outside click to close settings menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isSettingsOpen &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(e.target) &&
        !e.target.closest("button[data-settings-trigger]")
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSettingsOpen]);

  // 5. YouTube-style keyboard shortcuts with stable actions ref
  const keyboardActionsRef = useRef({});
  useEffect(() => {
    keyboardActionsRef.current = {
      togglePlay,
      toggleFullscreen,
      toggleMute,
      handleSkip,
      handleVolumeChange,
      handleSpeedChange,
      playbackSpeed,
      volume,
      duration,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target?.tagName)) return;
      const actions = keyboardActionsRef.current;

      // Space or 'k' for Play/Pause
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        actions.togglePlay?.();
      }

      // 'f' or 'F' for Fullscreen
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        actions.toggleFullscreen?.();
      }

      // 'm' or 'M' for Mute
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        actions.toggleMute?.();
      }

      // ArrowRight or 'l' or 'L' for Forward 10s
      if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        actions.handleSkip?.(10);
      }

      // ArrowLeft or 'j' or 'J' for Rewind 10s
      if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        actions.handleSkip?.(-10);
      }

      // ArrowUp for Volume Up (5%)
      if (e.key === "ArrowUp") {
        e.preventDefault();
        actions.handleVolumeChange?.(Math.min(1, actions.volume + 0.05));
      }

      // ArrowDown for Volume Down (5%)
      if (e.key === "ArrowDown") {
        e.preventDefault();
        actions.handleVolumeChange?.(Math.max(0, actions.volume - 0.05));
      }

      // Numbers 0 - 9 to jump to percentage
      if (e.key >= "0" && e.key <= "9" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const curDuration = actions.duration;
        if (curDuration > 0 && videoRef.current) {
          const target = (parseInt(e.key, 10) / 10) * curDuration;
          videoRef.current.currentTime = target;
          setCurrentTime(target);
          triggerToast(`${parseInt(e.key, 10) * 10}%`, <Gauge className="w-5 h-5 text-emerald-400" />);
        }
      }

      // Shift + > to speed up
      if (e.shiftKey && (e.key === ">" || e.key === ".")) {
        e.preventDefault();
        const curSpeed = actions.playbackSpeed;
        const idx = speedOptions.findIndex((s) => s.value === curSpeed);
        if (idx !== -1 && idx < speedOptions.length - 1) {
          actions.handleSpeedChange?.(speedOptions[idx + 1].value);
        }
      }

      // Shift + < to slow down
      if (e.shiftKey && (e.key === "<" || e.key === ",")) {
        e.preventDefault();
        const curSpeed = actions.playbackSpeed;
        const idx = speedOptions.findIndex((s) => s.value === curSpeed);
        if (idx !== -1 && idx > 0) {
          actions.handleSpeedChange?.(speedOptions[idx - 1].value);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const studentIdentifier = user?.email || user?.name || "Student Account";
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none group ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onMouseMove={resetControlsTimer}
      onMouseEnter={resetControlsTimer}
      onMouseLeave={() => {
        if (isPlaying && !isSettingsOpen) {
          setShowControls(false);
        }
      }}
    >
      {/* ── HTML5 Video Element ── */}
      <video
        key={videoKey}
        ref={videoRef}
        className="h-full w-full object-contain bg-black select-none pointer-events-auto cursor-pointer"
        src={isHls ? undefined : effectiveSrc}
        poster={poster}
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onLoadStart={() => {
          setCurrentTime(0);
          setDuration(0);
          setBufferedEnd(0);
          setIsBuffering(true);
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => {
          updateDuration();
          setIsBuffering(false); // metadata + data loaded = ready to play
        }}
        onDurationChange={updateDuration}
        onTimeUpdate={handleTimeUpdate}
        onProgress={updateBuffered}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
          applyPlaybackSpeed(playbackSpeed);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onStalled={() => setIsBuffering(true)}
        onSuspend={() => {
          // suspend = browser ne download temporarily roka
          // Agar enough data hai (readyState >= 3 = HAVE_FUTURE_DATA) to spinner mat dikhao
          const vid = videoRef.current;
          if (vid && !vid.paused && vid.readyState < 3) {
            setIsBuffering(true);
          } else {
            // Buffer kaafi hai — spinner hatao agar dikh raha ho
            setIsBuffering(false);
          }
        }}
        onPlaying={() => setIsBuffering(false)}
        onSeeked={() => {
          // Seek ke baad check karo ki data hai ya nahi
          const vid = videoRef.current;
          if (vid && vid.readyState >= 3) {
            setIsBuffering(false);
          }
        }}
        onCanPlayThrough={() => setIsBuffering(false)}
        onCanPlay={() => {
          setIsBuffering(false);
          updateDuration();
        }}
        onError={(e) => {
          setIsBuffering(false);
          if (typeof onError === "function") onError(e);
        }}
      />

      {/* ── YouTube-Style Big Center Play Button Overlay (when paused) ── */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={togglePlay}
            className="p-4 sm:p-5 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-2xl backdrop-blur-xs transition-all transform hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer flex items-center justify-center ring-4 ring-white/20 group/playbtn"
            title="Play Video"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5 group-hover/playbtn:scale-105 transition-transform" />
          </button>
        </div>
      )}

      {/* ── Centered Buffering Spinner Overlay ── */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/35 backdrop-blur-[2px] transition-all animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-black/80 border border-white/10 shadow-lg text-white text-sm font-semibold">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            <span>Buffering...</span>
          </div>
        </div>
      )}

      {/* ── Centered On-Screen Toast Overlay (YouTube Style) ── */}
      {screenToast && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35 animate-in fade-in zoom-in-90 duration-150">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md shadow-2xl text-white text-sm sm:text-base font-bold tracking-wide">
            {screenToast.icon}
            <span>{screenToast.text}</span>
          </div>
        </div>
      )}

      {/* ── YouTube-Style Settings Floating Panel ── */}
      {isSettingsOpen && (
        <div
          ref={settingsMenuRef}
          className="absolute bottom-16 right-3.5 z-50 w-64 sm:w-72 bg-neutral-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
        >
          {menuTab === "main" ? (
            /* Main Settings Menu */
            <div className="py-1.5 divide-y divide-white/10">
              <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <span>Video Settings</span>
              </div>
              <div className="py-1">
                {/* Speed Row */}
                <button
                  type="button"
                  onClick={() => setMenuTab("speed")}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/10 transition cursor-pointer text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Playback Speed</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400 font-semibold text-xs">
                    <span className="text-white font-bold">
                      {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Quality Row */}
                <button
                  type="button"
                  onClick={() => setMenuTab("quality")}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/10 transition cursor-pointer text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2.5 text-neutral-200">
                    <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Quality</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400 font-semibold text-xs">
                    <span className="text-white font-bold truncate max-w-[100px]">
                      {qualityOptions.find((q) => q.id === quality)?.shortLabel || "Auto"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          ) : menuTab === "speed" ? (
            /* Speed Submenu */
            <div className="py-1.5 max-h-72 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setMenuTab("main")}
                className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Playback Speed</span>
              </button>

              <div className="py-1">
                {speedOptions.map((opt) => {
                  const isSelected = playbackSpeed === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSpeedChange(opt.value)}
                      className={`w-full px-4 py-2 flex items-center justify-between text-xs sm:text-sm transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600/20 text-emerald-400 font-bold"
                          : "text-neutral-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </div>
                      {opt.value === 1 && (
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Default</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Quality Submenu */
            <div className="py-1.5 max-h-72 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setMenuTab("main")}
                className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quality</span>
              </button>

              <div className="py-1">
                {qualityOptions.map((opt) => {
                  const isSelected = quality === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleQualityChange(opt.id)}
                      className={`w-full px-4 py-2 flex items-center justify-between text-xs sm:text-sm transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600/20 text-emerald-400 font-bold"
                          : "text-neutral-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </div>
                      {opt.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Unified YouTube-Style Controls Bar (100% Shared Row & Orientation) ── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying || isSettingsOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar (Scrubber) */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
          className="group/progress relative w-full h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer transition-all mb-2 flex items-center"
        >
          {/* Hover timestamp tooltip */}
          {hoverTime !== null && duration > 0 && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/15 text-[11px] font-mono text-white pointer-events-none shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${Math.max(4, Math.min(96, hoverPercent))}%`,
              }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Buffered track */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full transition-all"
            style={{ width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%` }}
          />
          {/* Played track */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Scrubber thumb circle */}
          <div
            className="absolute -translate-x-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Unified Bottom Row: Play, Rewind 10s, Forward 10s, Sound, Time ... Settings, Fullscreen in 1 LINE */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm select-none h-9">
          {/* Left Controls: Play/Pause, Rewind 10s, Forward 10s, Sound/Mute + Slider, Time */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400"
              title={isPlaying ? "Pause (k / Space)" : "Play (k / Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Rewind 10s Button */}
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400 flex items-center justify-center"
              title="Rewind 10s (Left Arrow / J)"
            >
              <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Forward 10s Button */}
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400 flex items-center justify-center"
              title="Forward 10s (Right Arrow / L)"
            >
              <RotateCw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Sound / Volume Control */}
            <div className="flex items-center gap-1 group/volume">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400"
                title={isMuted || volume === 0 ? "Unmute (m)" : "Mute (m)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Volume Slider smoothly opens on hover */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className="w-0 group-hover/volume:w-16 sm:group-hover/volume:w-20 transition-all duration-200 accent-emerald-500 h-1 cursor-pointer opacity-0 group-hover/volume:opacity-100"
                title="Volume"
              />
            </div>

            {/* Time Display */}
            <div className="text-xs text-neutral-300 font-medium pl-1 font-mono select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-neutral-500">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Settings (⚙️), Fullscreen (⛶) in SAME ORIENTATION */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Settings Gear Button */}
            <button
              data-settings-trigger
              type="button"
              onClick={() => {
                setIsSettingsOpen((prev) => !prev);
                setMenuTab("main");
              }}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white"
              title="Settings (Playback speed, Quality)"
            >
              <Settings
                className={`w-5 h-5 transition-transform duration-300 ${
                  isSettingsOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400"
              title={isFullscreen ? "Exit Fullscreen (f)" : "Fullscreen (f)"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN FLOATING WATERMARK (Forensic Protection Layer) ── */}
      {user && (
        <div
          className={`absolute pointer-events-none select-none z-50 transition-opacity duration-700 ease-in-out ${
            visible ? "opacity-45" : "opacity-0"
          }`}
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-xs border border-white/10 shadow-xs text-xs font-sans whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400/80 shrink-0 stroke-[2]" />
            <span className="text-white/80 font-medium tracking-normal">{studentIdentifier}</span>
            <span className="text-white/30">-</span>
            <span className="text-teal-400/80 font-mono text-xs tracking-wider">IP: {ipAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
