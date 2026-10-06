import { ENV } from "./env.js";

const BASE_URL = "https://video.bunnycdn.com";

/**
 * Creates a new video entry in Bunny Stream
 */
export const createBunnyVideo = async (title, collectionId = "") => {
  const libraryId = ENV.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = ENV.BUNNY_STREAM_API_KEY;

  const res = await fetch(`${BASE_URL}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      title: title || "Lecture Video",
      collectionId: collectionId || undefined,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Bunny video (${res.status}): ${errorText}`);
  }

  return await res.json();
};

/**
 * Tells Bunny Stream to pull/download and transcode a video from a remote URL (e.g. S3 presigned URL)
 */
export const fetchBunnyVideo = async (url, title = "Lecture Video") => {
  const libraryId = ENV.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = ENV.BUNNY_STREAM_API_KEY;

  const res = await fetch(`${BASE_URL}/library/${libraryId}/videos/fetch`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      url,
      title,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to trigger Bunny video fetch (${res.status}): ${errorText}`);
  }

  return await res.json();
};

/**
 * Gets details/status of a video in Bunny Stream
 */
export const getBunnyVideo = async (videoId) => {
  const libraryId = ENV.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = ENV.BUNNY_STREAM_API_KEY;

  const res = await fetch(`${BASE_URL}/library/${libraryId}/videos/${videoId}`, {
    headers: {
      AccessKey: apiKey,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get Bunny video (${res.status}): ${errorText}`);
  }

  return await res.json();
};

/**
 * Deletes a video from Bunny Stream
 */
export const deleteBunnyVideo = async (videoId) => {
  if (!videoId) return null;
  const libraryId = ENV.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = ENV.BUNNY_STREAM_API_KEY;

  const res = await fetch(`${BASE_URL}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      AccessKey: apiKey,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.warn(`Bunny delete warning (${res.status}): ${errorText}`);
    return false;
  }

  return true;
};

/**
 * Returns the HLS manifest URL for a Bunny video ID
 */
export const getBunnyHlsUrl = (videoId) => {
  const cdnHostname = ENV.BUNNY_STREAM_CDN_HOSTNAME;
  return `https://${cdnHostname}/${videoId}/playlist.m3u8`;
};

/**
 * Returns the embed iframe URL for a Bunny video ID
 */
export const getBunnyIframeUrl = (videoId) => {
  const libraryId = ENV.BUNNY_STREAM_LIBRARY_ID;
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
};

/**
 * Returns the thumbnail URL for a Bunny video ID
 */
export const getBunnyThumbnailUrl = (videoId) => {
  const cdnHostname = ENV.BUNNY_STREAM_CDN_HOSTNAME;
  return `https://${cdnHostname}/${videoId}/thumbnail.jpg`;
};
