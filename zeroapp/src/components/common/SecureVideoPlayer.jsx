import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Modal,
  StatusBar,
  ScrollView,
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
  { id: "auto", label: "Auto (Recommended - 720p HD)", shortLabel: "Auto", badge: "HD" },
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
  const containerWidthRef = useRef(0);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);

  // YouTube Double-Tap Animation state
  const [doubleTapSide, setDoubleTapSide] = useState(null);
  const doubleTapAnim = useRef(new Animated.Value(0)).current;

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

  const hasStartedPlaying = currentTime > 0;

  // Controls auto-hide timer (only when actively playing and progressing)
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    // Keep controls visible if paused, buffering, or at start (currentTime === 0)
    if (isPlaying && !isSettingsOpen && !isBuffering && hasStartedPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !isSettingsOpen && !isBuffering && hasStartedPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, isSettingsOpen, isBuffering, hasStartedPlaying]);

  const triggerToast = (text, type = "gauge") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setScreenToast({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setScreenToast(null);
    }, 1300);
  };

  // Video Actions
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    resetControlsTimer();
  };

  const triggerDoubleTapAnimation = (side) => {
    setDoubleTapSide(side);
    doubleTapAnim.setValue(1);
    Animated.timing(doubleTapAnim, {
      toValue: 0,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      setDoubleTapSide(null);
    });
  };

  const handleScreenTap = (e) => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }

    const touchX = e?.nativeEvent?.locationX || 0;
    const width = containerWidthRef.current || 360;
    const now = Date.now();

    if (now - lastTapRef.current < 320) {
      // YouTube Double-Tap to Seek!
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      lastTapRef.current = 0;

      if (touchX < width / 2) {
        handleFastSeek(-10);
        triggerDoubleTapAnimation("left");
      } else {
        handleFastSeek(10);
        triggerDoubleTapAnimation("right");
      }
    } else {
      // Candidate single tap (wait 300ms to verify it wasn't a double-tap)
      lastTapRef.current = now;
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        if (showControls) {
          setShowControls(false);
        } else {
          resetControlsTimer();
        }
      }, 300);
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
    triggerToast(seconds > 0 ? `+${seconds}s` : `${seconds}s`, seconds > 0 ? "forward" : "rewind");
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
    <View
      style={[styles.playerContainer, isFs ? styles.fullscreenContainer : style]}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
      }}
    >
      {/* Native Video Engine with TextureView & Enhanced Buffer for High-Bitrate Video */}
      <Video
        key={`${videoKey || "video"}-${src}`}
        ref={videoRef}
        source={{ uri: src }}
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
          if (onError) onError(err);
        }}
        poster={poster}
        posterResizeMode="cover"
      />

      {/* Touch container to handle double-tap seek or toggle controls */}
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* ── YouTube-Style Double-Tap Left Ripple Overlay ── */}
      {doubleTapSide === "left" && (
        <Animated.View
          style={[styles.doubleTapRippleLeft, { opacity: doubleTapAnim }]}
          pointerEvents="none"
        >
          <RotateCcw size={28} color="#ffffff" />
          <Text style={styles.doubleTapText}>10 seconds</Text>
        </Animated.View>
      )}

      {/* ── YouTube-Style Double-Tap Right Ripple Overlay ── */}
      {doubleTapSide === "right" && (
        <Animated.View
          style={[styles.doubleTapRippleRight, { opacity: doubleTapAnim }]}
          pointerEvents="none"
        >
          <RotateCw size={28} color="#ffffff" />
          <Text style={styles.doubleTapText}>10 seconds</Text>
        </Animated.View>
      )}

      {/* ── YouTube-Style Center Screen Controls Overlay ── */}
      {showControls && !isBuffering && (
        <View style={styles.centerControlsOverlay} pointerEvents="box-none">
          {/* Rewind 10s Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleFastSeek(-10)}
            style={styles.centerActionBtn}
          >
            <RotateCcw size={36} color="#ffffff" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Forward 10s Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleFastSeek(10)}
            style={styles.centerActionBtn}
          >
            <RotateCw size={36} color="#ffffff" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      )}

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
            {typeof screenToast === "object" && screenToast.type === "forward" ? (
              <RotateCw size={16} color="#10b981" />
            ) : typeof screenToast === "object" && screenToast.type === "rewind" ? (
              <RotateCcw size={16} color="#10b981" />
            ) : (
              <Gauge size={16} color="#10b981" />
            )}
            <Text style={styles.toastText}>
              {typeof screenToast === "object" ? screenToast.text : screenToast}
            </Text>
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
        <ShieldCheck size={12} color="#2dd4bf" style={styles.watermarkIcon} />
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
                  <Play size={17} color="#ffffff" fill="#ffffff" style={styles.playIconOffset} />
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
                  setIsSettingsOpen((prev) => !prev);
                  setSettingsTab("main");
                  resetControlsTimer();
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

      {/* ── Settings Compact Floating Dropdown (Speed & Quality) ── */}
      {isSettingsOpen && (
        <View style={styles.settingsCard}>
            {settingsTab === "main" ? (
              <View>
                <View style={styles.settingsHeader}>
                  <Text style={styles.settingsHeaderTitle}>Playback Settings</Text>
                  <TouchableOpacity
                    onPress={() => setIsSettingsOpen(false)}
                    style={styles.settingsCloseBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={13} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Speed Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSettingsTab("speed")}
                  style={styles.settingsRow}
                >
                  <View style={styles.settingsRowLeft}>
                    <Gauge size={14} color="#10b981" />
                    <Text style={styles.settingsRowLabel}>Speed</Text>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsRowValue}>
                      {playbackSpeed === 1 ? "Normal (1x)" : `${playbackSpeed}x`}
                    </Text>
                    <ChevronRight size={13} color="#64748b" />
                  </View>
                </TouchableOpacity>

                {/* Quality Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSettingsTab("quality")}
                  style={[styles.settingsRow, styles.settingsRowLast]}
                >
                  <View style={styles.settingsRowLeft}>
                    <Sliders size={14} color="#10b981" />
                    <Text style={styles.settingsRowLabel}>Quality</Text>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsRowValue}>
                      {qualityOptions.find((q) => q.id === quality)?.shortLabel || "Auto"}
                    </Text>
                    <ChevronRight size={13} color="#64748b" />
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
                    <ChevronLeft size={14} color="#ffffff" />
                    <Text style={styles.settingsBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingsHeaderTitle}>Speed</Text>
                  <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.selectionList} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
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
                            <Check size={12} color="#10b981" />
                          ) : (
                            <View style={styles.iconSpacer} />
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
                </ScrollView>
              </View>
            ) : (
              <View>
                <View style={styles.settingsHeader}>
                  <TouchableOpacity
                    onPress={() => setSettingsTab("main")}
                    style={styles.settingsBackBtn}
                  >
                    <ChevronLeft size={14} color="#ffffff" />
                    <Text style={styles.settingsBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingsHeaderTitle}>Quality</Text>
                  <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.selectionList} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
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
                            <Check size={12} color="#10b981" />
                          ) : (
                            <View style={styles.iconSpacer} />
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
                </ScrollView>
              </View>
            )}
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
    gap: 6,
  },
  bottomRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  headerSpacer: {
    width: 28,
  },
  iconSpacer: {
    width: 12,
  },
  settingsCard: {
    position: "absolute",
    bottom: 48,
    right: 10,
    width: 200,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 30,
    zIndex: 99,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 4,
  },
  settingsHeaderTitle: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsCloseBtn: {
    padding: 2,
  },
  settingsBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  settingsBackBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  settingsRowLabel: {
    color: "#f1f5f9",
    fontSize: 11,
    fontWeight: "500",
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  settingsRowValue: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "600",
  },
  selectionList: {
    maxHeight: 130,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  selectionItemActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  selectionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectionItemText: {
    color: "#cbd5e1",
    fontSize: 10.5,
    fontWeight: "500",
  },
  selectionItemTextActive: {
    color: "#10b981",
    fontWeight: "700",
  },
  defaultLabelText: {
    fontSize: 8.5,
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
  watermarkIcon: {
    marginRight: 4,
  },
  centerControlsOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 35,
  },
  centerActionBtn: {
    width: 60,
    height: 60,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  playIconOffset: {
    marginLeft: 2,
  },
  doubleTapRippleLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "42%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderTopRightRadius: 120,
    borderBottomRightRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  doubleTapRippleRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "42%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderTopLeftRadius: 120,
    borderBottomLeftRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  doubleTapText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
