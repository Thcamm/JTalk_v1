import crypto from "crypto";
import config from "../config/index.js";

// In-memory cache for synthesized audio to ensure 0ms repeat latency
const audioCache = new Map();
const MAX_CACHE_SIZE = 250;

// State tracker to prevent spamming failed connections when Voicevox app is closed
let isEngineOnline = null;
let lastHealthCheckTimestamp = 0;
const HEALTH_CHECK_COOLDOWN_MS = 20000; // Check at most every 20 seconds when offline

export class VoicevoxService {
  static getEndpoint() {
    return (config.ai.voicevoxEndpoint || "http://localhost:50021").replace(/\/$/, "");
  }

  static getDefaultSpeaker() {
    return config.ai.voicevoxSpeaker || 2; // 2: 四国めたん (Shikoku Metan - Normal)
  }

  /**
   * Check if Voicevox Engine is alive and responding
   */
  static async checkHealth(force = false) {
    const endpoint = this.getEndpoint();
    const now = Date.now();

    if (!force && isEngineOnline === false && now - lastHealthCheckTimestamp < HEALTH_CHECK_COOLDOWN_MS) {
      return { isOnline: false, version: null, endpoint, cooledDown: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`${endpoint}/version`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const version = await response.text();
        isEngineOnline = true;
        lastHealthCheckTimestamp = now;
        return { isOnline: true, version: version.replace(/"/g, ""), endpoint };
      }
    } catch (_) {
      // Connection failed (ECONNREFUSED, timeout, etc.)
    }

    isEngineOnline = false;
    lastHealthCheckTimestamp = now;
    return { isOnline: false, version: null, endpoint };
  }

  /**
   * Get available speaker characters from Voicevox Engine
   */
  static async getSpeakers() {
    const endpoint = this.getEndpoint();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch(`${endpoint}/speakers`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (_) {
      // Offline fallback
    }

    return [
      {
        name: "四国めたん",
        speaker_uuid: "7ffcb7ce-00ec-41ec-be5f-e10b864a66b1",
        styles: [{ id: 2, name: "ノーマル (Gia sư Nữ)" }],
      },
      {
        name: "ずんだもん",
        speaker_uuid: "388f246a-8c52-4f44-aa87-46ba76186100",
        styles: [{ id: 3, name: "ノーマル (Dễ thương)" }],
      },
      {
        name: "青山龍星",
        speaker_uuid: "4f51116a-7b36-453c-bc4d-519b14b1b369",
        styles: [{ id: 13, name: "ノーマル (Nam công sở Tokyo)" }],
      },
    ];
  }

  /**
   * Synthesize natural Japanese speech using Voicevox Engine
   * Returns audioContent (base64) when online, or null if engine is offline
   */
  static async synthesize({
    text,
    speakerId = null,
    speedScale = 0.95,
    pitchScale = 0.0,
  }) {
    if (!text || !text.trim()) {
      return { isOnline: false, audioContent: null, error: "Thiếu văn bản tiếng Nhật." };
    }

    const cleanText = text.trim();
    const speaker = speakerId ?? this.getDefaultSpeaker();
    const endpoint = this.getEndpoint();
    const now = Date.now();

    // 1. Check in-memory audio cache first (0ms latency)
    const cacheKey = crypto
      .createHash("md5")
      .update(`${cleanText}:${speaker}:${speedScale}`)
      .digest("hex");

    if (audioCache.has(cacheKey)) {
      return {
        isOnline: true,
        audioContent: audioCache.get(cacheKey),
        mimeType: "audio/wav",
        speakerId: speaker,
        cached: true,
      };
    }

    // 2. Cooldown check: if engine was confirmed offline recently, skip network attempt to avoid ECONNREFUSED
    if (isEngineOnline === false && now - lastHealthCheckTimestamp < HEALTH_CHECK_COOLDOWN_MS) {
      return { isOnline: false, audioContent: null, reason: "VOICEVOX_OFFLINE" };
    }

    try {
      // 3. Query audio parameters (AudioQuery) with 1500ms timeout
      const queryController = new AbortController();
      const queryTimeoutId = setTimeout(() => queryController.abort(), 1500);

      const queryUrl = `${endpoint}/audio_query?text=${encodeURIComponent(cleanText)}&speaker=${speaker}`;
      const queryRes = await fetch(queryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: queryController.signal,
      });
      clearTimeout(queryTimeoutId);

      if (!queryRes.ok) {
        return { isOnline: false, audioContent: null, reason: `Query error ${queryRes.status}` };
      }

      const audioQuery = await queryRes.json();
      audioQuery.speedScale = speedScale;
      audioQuery.pitchScale = pitchScale;

      // 4. Synthesize audio wave with 4000ms timeout
      const synthController = new AbortController();
      const synthTimeoutId = setTimeout(() => synthController.abort(), 4000);

      const synthUrl = `${endpoint}/synthesis?speaker=${speaker}`;
      const synthRes = await fetch(synthUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/wav",
        },
        body: JSON.stringify(audioQuery),
        signal: synthController.signal,
      });
      clearTimeout(synthTimeoutId);

      if (!synthRes.ok) {
        return { isOnline: false, audioContent: null, reason: `Synthesis error ${synthRes.status}` };
      }

      const arrayBuffer = await synthRes.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      // Mark engine as confirmed online
      isEngineOnline = true;
      lastHealthCheckTimestamp = now;

      // Save to cache
      if (audioCache.size >= MAX_CACHE_SIZE) {
        const firstKey = audioCache.keys().next().value;
        audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, base64Audio);

      return {
        isOnline: true,
        audioContent: base64Audio,
        mimeType: "audio/wav",
        speakerId: speaker,
        cached: false,
      };
    } catch (err) {
      // Connection refused (ECONNREFUSED) or timeout
      isEngineOnline = false;
      lastHealthCheckTimestamp = now;

      // Log informative one-line notice instead of throwing unhandled error
      const isConnRefused =
        err?.code === "ECONNREFUSED" ||
        err?.cause?.code === "ECONNREFUSED" ||
        err?.name === "AbortError";

      if (isConnRefused) {
        // Voicevox desktop app or docker is not running on port 50021
        return {
          isOnline: false,
          audioContent: null,
          reason: "VOICEVOX_NOT_RUNNING",
        };
      }

      console.warn("[Voicevox] Notice:", err?.message || err);
      return { isOnline: false, audioContent: null, reason: err?.message };
    }
  }
}

export default VoicevoxService;
