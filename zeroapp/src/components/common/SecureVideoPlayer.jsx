import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import Video from "react-native-video";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Sliders,
  X,
  RotateCcw,
  RotateCw,
} from "lucide-react-native";

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
 * Time formatting helper
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
 * SecureVideoPlayer Component for React Native
 */
const SecureVideoPlayer = ({
  src,
  poster,
  user,
  videoKey,
  onError,
  style,
}) => {
  const videoRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const progressBarWidthRef = useRef(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Speed and Quality
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("auto");

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("main"); // 'main' | 'speed' | 'quality'

  // Controls Visibility
  const [showControls, setShowControls] = useState(true);

  // Center screen toast notification
  const [screenToast, setScreenToast] = useState(null);

  // Floating Watermark State
  const [ipAddress, setIpAddress] = useState("Loading IP...");
  const [coords, setCoords] = useState({ top: "20%", left: "12%" });
  const watermarkOpacity = useRef(new Animated.Value(0.45)).current;

  // Load persistent playback speed
  useEffect(() => {
    AsyncStorage.getItem("zero_playback_speed").then((val) => {
      if (val) {
        const num = parseFloat(val);
        if (!isNaN(num)) setPlaybackSpeed(num);
      }
    }).catch(() => {});
  }, []);

  // Fetch Public IP Address for Watermarking
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
          // continue fallback
        }
      }
      if (isMounted) setIpAddress("Online");
    };

    fetchIp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Teleporting Floating Watermark
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(watermarkOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        const newX = Math.floor(Math.random() * 50 + 6); // 6% - 56%
        const newY = Math.floor(Math.random() * 50 + 8); // 8% - 58%
        setCoords({ top: `${newY}%`, left: `${newX}%` });
        setTimeout(() => {
          Animated.timing(watermarkOpacity, {
            toValue: 0.45,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }, 150);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [watermarkOpacity]);

  // Controls auto-hide timer (only when actively playing and progressing)
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    // Keep controls visible if paused, buffering, or at start (currentTime === 0)
    if (isPlaying && !isSettingsOpen && !isBuffering && currentTime > 0) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, isSettingsOpen, isBuffering, currentTime > 0]);

  const toggleControls = () => {
    if (showControls) {
      setShowControls(false);
    } else {
      resetControlsTimer();
    }
  };

  const triggerToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setScreenToast(text);
    toastTimerRef.current = setTimeout(() => {
      setScreenToast(null);
    }, 1300);
  };

  // Fallback stream URL in case primary fails
  const DEFAULT_FALLBACK_URL =
    "https://idr01.zata.ai/zerozeroeducators/courseModule/1789614399439-1.mp4";

  const [activeSrc, setActiveSrc] = useState(src || DEFAULT_FALLBACK_URL);

  useEffect(() => {
    if (src) {
      setActiveSrc(src);
    }
  }, [src]);

  // Video Actions
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    resetControlsTimer();
  };

  const handleScreenTap = () => {
    if (!showControls) {
      resetControlsTimer();
    } else {
      // Toggle play/pause when user taps the screen
      togglePlay();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    resetControlsTimer();
  };

  const handleSeekTouch = (e) => {
    if (!duration || progressBarWidthRef.current <= 0) return;
    const touchX = e.nativeEvent.locationX;
    const progressRatio = Math.max(0, Math.min(1, touchX / progressBarWidthRef.current));
    const seekTime = progressRatio * duration;
    if (videoRef.current) {
      videoRef.current.seek(seekTime);
      setCurrentTime(seekTime);
    }
    resetControlsTimer();
  };

  const handleFastSeek = (seconds) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.seek(newTime);
    setCurrentTime(newTime);
    triggerToast(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    resetControlsTimer();
  };

  const handleSpeedChange = async (speed) => {
    setPlaybackSpeed(speed);
    try {
      await AsyncStorage.setItem("zero_playback_speed", String(speed));
    } catch {}
    setIsSettingsOpen(false);
    triggerToast(`${speed === 1 ? "Normal (1x)" : `${speed}x`} Speed`);
  };

  const handleQualityChange = (qId) => {
    setQuality(qId);
    setIsSettingsOpen(false);
    const chosen = qualityOptions.find((q) => q.id === qId);
    triggerToast(`Quality: ${chosen?.shortLabel || qId}`);
  };

  const studentIdentifier = user?.email || user?.name || "Student Account";
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // The Player View Render
  const renderPlayer = (isFs = false) => (
    <View style={[styles.playerContainer, isFs ? styles.fullscreenContainer : style]}>
      {/* Native Video Engine with TextureView & Enhanced Buffer for High-Bitrate Video */}
      <Video
        key={`${videoKey}-${activeSrc}`}
        ref={videoRef}
        source={{ uri: activeSrc }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={!isPlaying}
        rate={playbackSpeed}
        volume={isMuted ? 0 : 1.0}
        muted={isMuted}
        useTextureView={true}
        shutterColor="transparent"
        preventsDisplaySleepDuringVideoPlayback={true}
        bufferConfig={{
          minBufferMs: 2500,
          maxBufferMs: 30000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 2000,
        }}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        progressUpdateInterval={250}
        onLoad={(meta) => {
          setDuration(meta.duration || 0);
          setIsBuffering(false);
        }}
        onProgress={(prog) => {
          if (prog.currentTime !== undefined) {
            setCurrentTime(prog.currentTime);
          }
        }}
        onBuffer={(buf) => {
          setIsBuffering(buf.isBuffering);
        }}
        onPlaybackStateChanged={({ isPlaying: p }) => {
          if (typeof p === "boolean") {
            setIsPlaying(p);
          }
        }}
        onPlaybackRateChange={({ playbackRate }) => {
          if (playbackRate > 0) {
            setIsPlaying(true);
          }
        }}
        onError={(err) => {
          console.warn("[SecureVideoPlayer] Playback error notice:", err);
          setIsBuffering(false);
          // If primary stream fails, switch to fallback working stream
          if (activeSrc !== DEFAULT_FALLBACK_URL) {
            setActiveSrc(DEFAULT_FALLBACK_URL);
          }
          if (onError) onError(err);
        }}
        poster={poster}
        posterResizeMode="cover"
      />

      {/* Touch container to reveal/hide controls or toggle play */}
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* Centered Buffering Spinner */}
      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <View style={styles.bufferingPill}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.bufferingText}>Buffering...</Text>
          </View>
        </View>
      )}

      {/* Center Screen Toast Badge */}
      {screenToast && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastPill}>
            <Gauge size={16} color="#10b981" />
            <Text style={styles.toastText}>{screenToast}</Text>
          </View>
        </View>
      )}

      {/* Floating Dynamic Watermark (Anti-Piracy) */}
      <Animated.View
        style={[
          styles.watermarkBadge,
          {
            top: coords.top,
            left: coords.left,
            opacity: watermarkOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <ShieldCheck size={12} color="#2dd4bf" style={{ marginRight: 4 }} />
        <Text style={styles.watermarkUserText} numberOfLines={1}>
          {studentIdentifier}
        </Text>
        <Text style={styles.watermarkDivider}>-</Text>
        <Text style={styles.watermarkIpText}>IP: {ipAddress}</Text>
      </Animated.View>

      {/* ── Top Fullscreen Exit Button (Only when in Fullscreen) ── */}
      {isFs && showControls && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsFullscreen(false)}
          style={styles.topFsCloseBtn}
        >
          <X size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* ── Frosted Glass Controls Bar (Emerald Green + Dark Glass Badges) ── */}
      {showControls && (
        <View style={styles.bottomControlBar}>
          {/* Scrubber Progress Bar */}
          <View
            style={styles.progressBarContainer}
            onLayout={(e) => {
              progressBarWidthRef.current = e.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleSeekTouch}
            onResponderMove={handleSeekTouch}
          >
            <View style={styles.progressBackgroundTrack} />
            <View
              style={[
                styles.progressActiveTrack,
                { width: `${progressPercent}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${progressPercent}%` },
              ]}
            />
          </View>

          {/* Bottom Icons Row: Play (Emerald), Speaker, Time ... Settings, Fullscreen */}
          <View style={styles.bottomButtonsRow}>
            {/* Left: Play/Pause (Emerald badge), Speaker/Mute (Dark badge), Time (Dark pill) */}
            <View style={styles.bottomLeftGroup}>
              {/* Primary Emerald Play/Pause Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={togglePlay}
                style={styles.playBtnBadge}
              >
                {isPlaying ? (
                  <Pause size={17} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={17} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>

              {/* Speaker / Mute Dark Badge */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleMute}
                style={styles.iconBadge}
              >
                {isMuted ? (
                  <VolumeX size={17} color="#f87171" />
                ) : (
                  <Volume2 size={17} color="#ffffff" />
                )}
              </TouchableOpacity>

              {/* Time Pill Badge */}
              <View style={styles.timeBadge}>
                <Text style={styles.currentTimeText}>
                  {formatTime(currentTime)}
                </Text>
                <Text style={styles.timeDividerText}> / </Text>
                <Text style={styles.totalDurationText}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>

            {/* Right: Settings (⚙️), Fullscreen (⛶) in dark frosted badges */}
            <View style={styles.bottomRightGroup}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSettingsTab("main");
                  setIsSettingsOpen(true);
                }}
                style={styles.iconBadge}
              >
                <Settings size={17} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFullscreen((prev) => !prev)}
                style={styles.iconBadge}
              >
                {isFs ? (
                  <Minimize2 size={17} color="#ffffff" />
                ) : (
                  <Maximize2 size={17} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Settings Floating Modal (Speed & Quality) ── */}
      {isSettingsOpen && (
        <View style={styles.settingsModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsSettingsOpen(false)}
          />

          <View style={styles.settingsCard}>
            {settingsTab === "main" ? (
              <View>
                <View style={styles.settingsHeader}>
                  <Text style={styles.settingsHeaderTitle}>Playback Settings</Text>
                  <TouchableOpacity
                    onPress={() => setIsSettingsOpen(false)}
                    style={styles.settingsCloseBtn}
                  >
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Speed Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSettingsTab("speed")}
                  style={styles.settingsRow}
                >
                  <View style={styles.settingsRowLeft}>
                    <Gauge size={16} color="#10b981" />
                    <Text style={styles.settingsRowLabel}>Playback Speed</Text>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsRowValue}>
                      {playbackSpeed === 1 ? "Normal (1x)" : `${playbackSpeed}x`}
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>

                {/* Quality Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSettingsTab("quality")}
                  style={[styles.settingsRow, { borderBottomWidth: 0 }]}
                >
                  <View style={styles.settingsRowLeft}>
                    <Sliders size={16} color="#10b981" />
                    <Text style={styles.settingsRowLabel}>Quality</Text>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsRowValue}>
                      {qualityOptions.find((q) => q.id === quality)?.shortLabel || "Auto"}
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : settingsTab === "speed" ? (
              <View>
                <View style={styles.settingsHeader}>
                  <TouchableOpacity
                    onPress={() => setSettingsTab("main")}
                    style={styles.settingsBackBtn}
                  >
                    <ChevronLeft size={16} color="#ffffff" />
                    <Text style={styles.settingsBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingsHeaderTitle}>Speed</Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.selectionList}>
                  {speedOptions.map((opt) => {
                    const isSelected = playbackSpeed === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.7}
                        onPress={() => handleSpeedChange(opt.value)}
                        style={[
                          styles.selectionItem,
                          isSelected && styles.selectionItemActive,
                        ]}
                      >
                        <View style={styles.selectionItemLeft}>
                          {isSelected ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <View style={{ width: 14 }} />
                          )}
                          <Text
                            style={[
                              styles.selectionItemText,
                              isSelected && styles.selectionItemTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        {opt.value === 1 && (
                          <Text style={styles.defaultLabelText}>Default</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.settingsHeader}>
                  <TouchableOpacity
                    onPress={() => setSettingsTab("main")}
                    style={styles.settingsBackBtn}
                  >
                    <ChevronLeft size={16} color="#ffffff" />
                    <Text style={styles.settingsBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingsHeaderTitle}>Quality</Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.selectionList}>
                  {qualityOptions.map((opt) => {
                    const isSelected = quality === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.7}
                        onPress={() => handleQualityChange(opt.id)}
                        style={[
                          styles.selectionItem,
                          isSelected && styles.selectionItemActive,
                        ]}
                      >
                        <View style={styles.selectionItemLeft}>
                          {isSelected ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <View style={{ width: 14 }} />
                          )}
                          <Text
                            style={[
                              styles.selectionItemText,
                              isSelected && styles.selectionItemTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        {opt.badge && (
                          <View style={styles.hdBadge}>
                            <Text style={styles.hdBadgeText}>{opt.badge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  // Guarantee ONLY ONE Video instance mounted at any time to prevent ExoPlayer conflicts
  if (isFullscreen) {
    return (
      <Modal
        visible={true}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <StatusBar hidden={true} />
        {renderPlayer(true)}
      </Modal>
    );
  }

  return renderPlayer(false);
};

export default SecureVideoPlayer;

const styles = StyleSheet.create({
  playerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  fullscreenContainer: {
    width: "100%",
    height: "100%",
    aspectRatio: undefined,
    borderRadius: 0,
    backgroundColor: "#000000",
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 25,
  },
  bufferingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    gap: 8,
  },
  bufferingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  toastPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    gap: 8,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  watermarkBadge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 20,
  },
  watermarkUserText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontWeight: "500",
    maxWidth: 140,
  },
  watermarkDivider: {
    color: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
    fontSize: 10,
  },
  watermarkIpText: {
    color: "#2dd4bf",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  topFsCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 45,
  },
  bottomControlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    zIndex: 40,
  },
  progressBarContainer: {
    width: "100%",
    height: 14,
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  progressBackgroundTrack: {
    width: "100%",
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  progressActiveTrack: {
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "#10b981",
    position: "absolute",
    left: 0,
  },
  progressThumb: {
    position: "absolute",
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#10b981",
    marginLeft: -5.5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
    marginTop: 2,
  },
  bottomLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playBtnBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10b981", // Web frontend emerald primary accent
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15, 23, 42, 0.82)", // Web frontend dark frosted glass
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    elevation: 3,
  },
  timeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.82)", // Web frontend dark frosted glass
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  currentTimeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  timeDividerText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
  totalDurationText: {
    color: "#34d399", // Emerald highlight
    fontSize: 11,
    fontWeight: "700",
  },
  settingsModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  settingsCard: {
    width: "82%",
    maxWidth: 320,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  settingsHeaderTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsCloseBtn: {
    padding: 4,
  },
  settingsBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  settingsBackBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsRowLabel: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "500",
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingsRowValue: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
  selectionList: {
    maxHeight: 220,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectionItemActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  selectionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionItemText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "500",
  },
  selectionItemTextActive: {
    color: "#10b981",
    fontWeight: "700",
  },
  defaultLabelText: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  hdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  hdBadgeText: {
    fontSize: 9,
    color: "#cbd5e1",
    fontWeight: "700",
  },
});
