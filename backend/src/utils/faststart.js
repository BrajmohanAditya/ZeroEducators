import { execFile } from "child_process";
import fs from "fs";

/**
 * Moves MP4 moov atom to the beginning of the file (FastStart / Web Optimized)
 * Uses '-c copy' so there is ZERO quality loss and completes in 1-2 seconds.
 * 
 * @param {string} inputPath - path to original MP4
 * @param {string} outputPath - path to optimized MP4
 * @returns {Promise<boolean>} - true if succeeded, false if failed
 */
export const applyFaststart = async (inputPath, outputPath) => {
  let ffmpegPath = "ffmpeg";
  try {
    const installer = await import("@ffmpeg-installer/ffmpeg");
    if (installer?.default?.path) {
      ffmpegPath = installer.default.path;
    }
  } catch {
    // If installer package is not yet loaded, fallback gracefully to system ffmpeg
  }

  return new Promise((resolve) => {
    try {
      execFile(
        ffmpegPath,
        ["-y", "-i", inputPath, "-c", "copy", "-movflags", "+faststart", outputPath],
        { maxBuffer: 10 * 1024 * 1024 },
        (error) => {
          if (error) {
            console.warn("[FastStart] Notice (will use original file):", error.message || error);
            resolve(false);
          } else if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
    } catch (err) {
      console.warn("[FastStart] Execution exception:", err?.message || err);
      resolve(false);
    }
  });
};
