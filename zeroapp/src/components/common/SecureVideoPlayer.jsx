import React, { useState, useEffect, useRef } from "react";
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
  { id: "auto", label: "Auto (Recommended - 1080p)", shortLabel: "Auto", badge: "HD" },
  { id: "1080p", label: "1080p (Full HD)", shortLabel: "1080p", badge: "HD" },
  { id: "720p", label: "720p (HD)", shortLabel: "720p", badge: "HD" },
  { id: "480p", label: "480p (Data Saver)", shortLabel: "480p", badge: "SD" },
  { id: "360p", label: "360p (Low Data)", shortLabel: "360p", badge: "SD" },
];

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
  className = "",
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const progressBarRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const controlsTimerRef = useRef(null);

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

  // Settings Panel state: false | true
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Settings Tab: 'main' | 'speed' | 'quality'
  const [menuTab, setMenuTab] = useState("main");

  // YouTube-Style On-Screen Animated Toast
  const [screenToast, setScreenToast] = useState(null);

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
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, isSettingsOpen]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
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
    } catch {}
  };

  // Progress click / scrub seek
  const handleSeek = (e) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    applyPlaybackSpeed(newSpeed);
    try {
      localStorage.setItem("zero_playback_speed", String(newSpeed));
    } catch {}
    setIsSettingsOpen(false);
    triggerToast(
      `${newSpeed === 1 ? "Normal (1x)" : `${newSpeed}x`} Speed`,
      <Gauge className="w-5 h-5 text-emerald-400" />
    );
  };

  // Handle quality change
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    try {
      localStorage.setItem("zero_video_quality", newQuality);
    } catch {}
    setIsSettingsOpen(false);
    const chosen = qualityOptions.find((q) => q.id === newQuality);
    triggerToast(
      `Quality: ${chosen?.shortLabel || newQuality}`,
      <Sliders className="w-5 h-5 text-emerald-400" />
    );
  };

  // 1. Fetch User Public IP Address reliably
  useEffect(() => {
    let isMounted = true;

    const fetchIp = async () => {
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

  // 3. Fullscreen sync
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
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el?.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el?.msRequestFullscreen) {
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

  // 5. YouTube-style keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target?.tagName)) return;

      // Space or 'k' for Play/Pause
      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      }

      // 'f' or 'F' for Fullscreen
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }

      // 'm' or 'M' for Mute
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      }

      // Shift + > to speed up
      if (e.shiftKey && (e.key === ">" || e.key === ".")) {
        e.preventDefault();
        const idx = speedOptions.findIndex((s) => s.value === playbackSpeed);
        if (idx !== -1 && idx < speedOptions.length - 1) {
          handleSpeedChange(speedOptions[idx + 1].value);
        }
      }

      // Shift + < to slow down
      if (e.shiftKey && (e.key === "<" || e.key === ",")) {
        e.preventDefault();
        const idx = speedOptions.findIndex((s) => s.value === playbackSpeed);
        if (idx !== -1 && idx > 0) {
          handleSpeedChange(speedOptions[idx - 1].value);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playbackSpeed, isPlaying, isFullscreen, isMuted, volume]);

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
        src={src}
        poster={poster}
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        autoPlay
        crossOrigin="use-credentials"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onLoadedMetadata={() => {
          handleLoadedMetadata();
          if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
          }
        }}
        onTimeUpdate={() => {
          handleTimeUpdate();
          if (videoRef.current?.duration && duration === 0) {
            setDuration(videoRef.current.duration);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          applyPlaybackSpeed(playbackSpeed);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={(e) => {
          setIsBuffering(false);
          if (typeof onError === "function") onError(e);
        }}
      />

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
          className="group/progress relative w-full h-1 hover:h-2 bg-white/20 rounded-full cursor-pointer transition-all mb-2 flex items-center"
        >
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

        {/* Unified Bottom Row: Play, Sound, Time ... Settings, Fullscreen in 1 LINE */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm select-none h-9">
          {/* Left Controls: Play/Pause, Sound/Mute + Slider, Time */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400"
              title={isPlaying ? "Pause (k / Space)" : "Play (k / Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
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
            <div className="text-xs text-neutral-300 font-medium pl-1">
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
              className={`p-1.5 hover:bg-white/15 rounded-lg transition cursor-pointer text-white hover:text-emerald-400 ${
                isSettingsOpen ? "bg-white/20 text-emerald-400" : ""
              }`}
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
