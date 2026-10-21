import { Readable } from "stream";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, uploadToZata } from "../config/zata.js";
import { ENV } from "../config/env.js";
import { fetchBunnyVideo, getBunnyVideo } from "../config/bunny.js";

const CDN_HOST = ENV.BUNNY_STREAM_CDN_HOSTNAME;
const LIB_ID = ENV.BUNNY_STREAM_LIBRARY_ID;
const API_KEY = ENV.BUNNY_STREAM_API_KEY;

/**
 * Check if a file already exists on Zata S3 to make backup incremental
 */
export const checkZataBackupExists = async (fileKey) => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: ENV.ZATA_BUCKET_NAME,
        Key: fileKey,
      })
    );
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
};

/**
 * Fetch all videos from Bunny Stream Library (supports pagination)
 */
export const getAllBunnyVideos = async () => {
  let page = 1;
  const itemsPerPage = 100;
  let allVideos = [];
  let totalItems = 0;

  do {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${LIB_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}`,
      {
        headers: {
          AccessKey: API_KEY,
          accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch Bunny videos (page ${page}): ${res.statusText}`);
    }

    const data = await res.json();
    totalItems = data.totalItems || 0;
    const items = data.items || [];
    allVideos.push(...items);

    if (items.length < itemsPerPage || allVideos.length >= totalItems) {
      break;
    }
    page++;
  } while (true);

  return { total: totalItems, videos: allVideos };
};

/**
 * Stream a Bunny video (either direct MP4 fallback or concatenated HLS TS segments)
 * directly into Zata S3 using AWS SDK lib-storage streaming.
 */
export const backupSingleBunnyVideo = async (video, onProgress) => {
  const guid = video.guid;
  const title = video.title || "Untitled";

  // Check if already backed up on Zata
  const mp4Key = `bunny-backups/${guid}.mp4`;
  const tsKey = `bunny-backups/${guid}.ts`;

  if (await checkZataBackupExists(mp4Key)) {
    return { status: "skipped", reason: "Already backed up as MP4", fileKey: mp4Key };
  }
  if (await checkZataBackupExists(tsKey)) {
    return { status: "skipped", reason: "Already backed up as TS", fileKey: tsKey };
  }

  // 1. Check for MP4 fallback options (original or play_{res}.mp4)
  const candidateMp4s = [
    `https://${CDN_HOST}/${guid}/play_1080p.mp4`,
    `https://${CDN_HOST}/${guid}/play_720p.mp4`,
    `https://${CDN_HOST}/${guid}/play_480p.mp4`,
    `https://${CDN_HOST}/${guid}/play_360p.mp4`,
    `https://${CDN_HOST}/${guid}/original`,
  ];

  let directMp4Url = null;
  for (const testUrl of candidateMp4s) {
    try {
      const head = await fetch(testUrl, { method: "HEAD", headers: { AccessKey: API_KEY } });
      if (head.status >= 200 && head.status < 300) {
        directMp4Url = testUrl;
        break;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If a direct MP4 is available from Bunny, stream that
  if (directMp4Url) {
    console.log(`[Bunny-Backup] Found direct MP4 for ${title} (${guid}): ${directMp4Url}`);
    const res = await fetch(directMp4Url, { headers: { AccessKey: API_KEY } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching MP4`);

    const nodeStream = Readable.fromWeb(res.body);
    const uploadRes = await uploadToZata(
      nodeStream,
      `${guid}.mp4`,
      "video/mp4",
      "bunny-backups",
      onProgress,
      mp4Key
    );

    return { status: "uploaded", format: "mp4", fileKey: mp4Key, url: uploadRes.url };
  }

  // 2. Otherwise, stream the highest resolution HLS MPEG-TS segments sequentially
  const masterUrl = `https://${CDN_HOST}/${guid}/playlist.m3u8`;
  const masterRes = await fetch(masterUrl);
  if (!masterRes.ok) {
    throw new Error(`Cannot fetch master playlist for video ${guid} (Status: ${masterRes.status})`);
  }

  const masterText = await masterRes.text();

  // Find sub-playlists in master
  // Format:
  // #EXT-X-STREAM-INF:BANDWIDTH=...,RESOLUTION=854x480,...
  // 480p/video.m3u8
  const lines = masterText.split(/\r?\n/);
  const streamVariants = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const height = resolutionMatch ? parseInt(resolutionMatch[2], 10) : 0;
      const subPlaylist = lines[i + 1]?.trim();
      if (subPlaylist && !subPlaylist.startsWith("#")) {
        streamVariants.push({ height, path: subPlaylist });
      }
    }
  }

  // Pick highest resolution variant (e.g. 720p or 480p)
  streamVariants.sort((a, b) => b.height - a.height);
  const selectedVariant = streamVariants[0] || { path: "video.m3u8" };
  const variantUrl = `https://${CDN_HOST}/${guid}/${selectedVariant.path}`;

  const variantRes = await fetch(variantUrl);
  if (!variantRes.ok) {
    throw new Error(`Failed to fetch variant playlist: ${variantUrl}`);
  }

  const variantText = await variantRes.text();
  const segmentFiles = [];
  const variantLines = variantText.split(/\r?\n/);
  for (const vLine of variantLines) {
    const trimmed = vLine.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      segmentFiles.push(trimmed);
    }
  }

  if (segmentFiles.length === 0) {
    throw new Error(`No TS segments found in playlist: ${variantUrl}`);
  }

  // Base directory for segments
  const basePath = variantUrl.substring(0, variantUrl.lastIndexOf("/") + 1);

  console.log(
    `[Bunny-Backup] Streaming ${segmentFiles.length} segments for ${title} (${guid}) via ${selectedVariant.height || "adaptive"}p...`
  );

  // High-performance Sliding Window Prefetching (downloads up to 8 segments in parallel in advance)
  const CONCURRENCY = 8;
  const segmentStream = Readable.from(
    (async function* () {
      const activeFetches = new Map();
      let nextFetchIdx = 0;

      const startFetch = (idx) => {
        const segFile = segmentFiles[idx];
        const segUrl = segFile.startsWith("http") ? segFile : `${basePath}${segFile}`;
        return (async () => {
          let attempts = 0;
          while (attempts < 3) {
            try {
              const segRes = await fetch(segUrl);
              if (!segRes.ok) throw new Error(`HTTP ${segRes.status}`);
              const ab = await segRes.arrayBuffer();
              return Buffer.from(ab);
            } catch (err) {
              attempts++;
              if (attempts >= 3) throw new Error(`Failed segment ${segFile}: ${err.message}`);
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        })();
      };

      // Prime the pipeline with initial CONCURRENCY fetches
      while (nextFetchIdx < segmentFiles.length && activeFetches.size < CONCURRENCY) {
        activeFetches.set(nextFetchIdx, startFetch(nextFetchIdx));
        nextFetchIdx++;
      }

      for (let i = 0; i < segmentFiles.length; i++) {
        // Enqueue next segment to keep pipeline filled
        if (nextFetchIdx < segmentFiles.length) {
          activeFetches.set(nextFetchIdx, startFetch(nextFetchIdx));
          nextFetchIdx++;
        }

        // Await current segment in strict sequence
        const buffer = await activeFetches.get(i);
        activeFetches.delete(i);

        if ((i + 1) % 50 === 0 || i + 1 === segmentFiles.length) {
          console.log(`[Bunny-Backup] ⚡ Fast-Streamed ${i + 1}/${segmentFiles.length} segments (${title})...`);
        }
        yield buffer;
      }
    })()
  );

  const uploadRes = await uploadToZata(
    segmentStream,
    `${guid}.ts`,
    "video/mp2t",
    "bunny-backups",
    onProgress,
    tsKey
  );

  return {
    status: "uploaded",
    format: "ts",
    fileKey: tsKey,
    url: uploadRes.url,
    totalSegments: segmentFiles.length,
  };
};

/**
 * 🚀 SUCK BACK FROM ZATA S3 INTO BUNNY.NET (Disaster Recovery / Restore)
 * Generates a presigned URL for the video in Zata S3, and tells Bunny Stream to fetch and transcode it!
 */
export const restoreVideoFromZataToBunny = async (fileKey, videoTitle = "Restored Lecture") => {
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");

  const getCmd = new GetObjectCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: fileKey,
  });

  // Pre-signed URL valid for 24 hours so Bunny has plenty of time to suck the video
  const presignedUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 86400 });

  // Tell Bunny Stream to pull/download from Zata S3
  const bunnyResult = await fetchBunnyVideo(presignedUrl, videoTitle);
  return {
    success: true,
    message: "Bunny Stream is now fetching and transcoding the video from Zata S3!",
    newBunnyVideo: bunnyResult,
    sourceFileKey: fileKey,
  };
};

/**
 * ⚡ Real-Time Auto Backup Hook for Newly Uploaded Video:
 * Automatically waits for Bunny to finish transcoding, then immediately backs it up to Zata S3!
 */
export const queueSingleBunnyVideoBackup = (guid, title = "New Lecture") => {
  if (!guid) return;

  // Run in background without blocking response
  (async () => {
    try {
      console.log(`[Bunny-Auto-Backup] Queued real-time Zata S3 backup for newly uploaded video: ${title} (${guid})`);

      // Wait for Bunny Stream to complete transcoding (status === 4 means completed)
      let isTranscoded = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 * 20s = 10 minutes max wait

      while (!isTranscoded && attempts < maxAttempts) {
        attempts++;
        await new Promise((r) => setTimeout(r, 20000)); // check every 20 seconds
        try {
          const videoInfo = await getBunnyVideo(guid);
          if (videoInfo && (videoInfo.status === 4 || videoInfo.encodeProgress === 100)) {
            isTranscoded = true;
            console.log(`[Bunny-Auto-Backup] Video ${title} (${guid}) finished transcoding on Bunny. Starting Zata S3 backup...`);
            const res = await backupSingleBunnyVideo(videoInfo);
            console.log(`[Bunny-Auto-Backup] ✅ Real-time backup complete for: ${title} (${guid})!`, res);
            break;
          }
        } catch (pollErr) {
          console.warn(`[Bunny-Auto-Backup] Poll notice for ${guid}:`, pollErr.message);
        }
      }

      if (!isTranscoded) {
        console.warn(`[Bunny-Auto-Backup] Video ${guid} did not finish transcoding within 10 minutes. The daily 24h cron will back it up later.`);
      }
    } catch (err) {
      console.error(`[Bunny-Auto-Backup] Error in real-time backup for ${guid}:`, err.message);
    }
  })();
};
