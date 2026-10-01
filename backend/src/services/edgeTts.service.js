import crypto from "crypto";
import config from "../config/index.js";

// In-memory LRU cache for synthesized audio to ensure 0ms repeat latency
const audioCache = new Map();
const MAX_CACHE_SIZE = 500;

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

/**
 * High-quality Japanese voices available on Microsoft Edge Neural TTS
 */
export const EDGE_JAPANESE_VOICES = {
  NANAMI: "ja-JP-NanamiNeural", // Giọng nữ chuẩn Tokyo, tự nhiên, ấm áp (Mặc định cho giáo viên/học viên)
  KEITA: "ja-JP-KeitaNeural",   // Giọng nam tự nhiên, chuẩn giao tiếp công sở & thường ngày
  AOI: "ja-JP-AoiNeural",       // Giọng nữ trẻ trung, dễ thương
  DAICHI: "ja-JP-DaichiNeural", // Giọng nam trầm, dõng dạc
  MAYU: "ja-JP-MayuNeural",     // Giọng nữ trẻ
  SHIORI: "ja-JP-ShioriNeural", // Giọng nữ nhẹ nhàng
};

export class EdgeTtsService {
  /**
   * Escape XML entities for SSML
   */
  static escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  }

  /**
   * Synthesize audio from text using Microsoft Edge Neural TTS
   * @param {Object} options
   * @param {string} options.text - Japanese text to speak
   * @param {string} [options.voice] - Voice name, defaults to ja-JP-NanamiNeural
   * @param {number} [options.rate] - Speed rate multiplier (e.g. 0.95 for learners)
   * @param {number} [options.pitch] - Pitch adjustment (e.g. 0 for neutral)
   * @returns {Promise<{ audioContent: string, mimeType: string, voice: string, cached: boolean, provider: string }>}
   */
  static async synthesize({
    text,
    voice = null,
    rate = 0.95,
    pitch = 0,
  }) {
    if (!text || !text.trim()) {
      throw new Error("Văn bản tiếng Nhật không được để trống.");
    }

    const cleanText = text.trim();
    const selectedVoice = voice || config.ai.edgeTtsDefaultVoice || EDGE_JAPANESE_VOICES.NANAMI;

    // 1. Check in-memory audio cache first (0ms latency)
    const ratePercent = Math.round((rate - 1) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;

    const cacheKey = crypto
      .createHash("md5")
      .update(`${cleanText}:${selectedVoice}:${rateStr}:${pitchStr}`)
      .digest("hex");

    if (audioCache.has(cacheKey)) {
      return {
        audioContent: audioCache.get(cacheKey),
        mimeType: "audio/mp3",
        voice: selectedVoice,
        cached: true,
        provider: "edge-tts-cache",
      };
    }

    // 2. Primary Engine: Microsoft Edge Neural TTS
    try {
      const audioBuffer = await this.synthesizeWithEdge(cleanText, selectedVoice, rateStr, pitchStr);
      const base64Audio = audioBuffer.toString("base64");

      // Save to LRU cache
      if (audioCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = audioCache.keys().next().value;
        audioCache.delete(oldestKey);
      }
      audioCache.set(cacheKey, base64Audio);

      return {
        audioContent: base64Audio,
        mimeType: "audio/mp3",
        voice: selectedVoice,
        cached: false,
        provider: "edge-tts",
      };
    } catch (edgeError) {
      console.warn("[Edge-TTS] Primary engine failed, attempting resilient fallbacks:", edgeError.message);
    }

    // 3. Fallback 1: OpenAI TTS (if API key available)
    if (config.ai.openaiApiKey) {
      try {
        const audioBuffer = await this.synthesizeWithOpenAI(cleanText, selectedVoice, rate);
        const base64Audio = audioBuffer.toString("base64");
        return {
          audioContent: base64Audio,
          mimeType: "audio/mp3",
          voice: selectedVoice,
          cached: false,
          provider: "openai-tts",
        };
      } catch (openAiError) {
        console.warn("[Edge-TTS] OpenAI fallback failed:", openAiError.message);
      }
    }

    // 4. Fallback 2: Google Cloud Text-to-Speech (if configured)
    if (config.ai.googleApiKey) {
      try {
        const googleRes = await this.synthesizeWithGoogle(cleanText, selectedVoice, rate);
        return {
          audioContent: googleRes.audioContent,
          mimeType: "audio/mp3",
          voice: selectedVoice,
          cached: false,
          provider: "google-tts",
        };
      } catch (googleError) {
        console.warn("[Edge-TTS] Google fallback failed:", googleError.message);
      }
    }

    throw new Error("Không thể tạo giọng đọc tiếng Nhật từ các nhà cung cấp TTS đám mây.");
  }

  /**
   * Native Microsoft Edge TTS WebSocket synthesis implementation
   */
  static synthesizeWithEdge(text, voice, rateStr, pitchStr) {
    return new Promise((resolve, reject) => {
      const connectionId = crypto.randomUUID().replace(/-/g, "");
      const requestId = crypto.randomUUID().replace(/-/g, "");
      const wsUrl = `${WSS_URL}&ConnectionId=${connectionId}`;

      const audioChunks = [];
      let isTurnEnd = false;
      let timeoutId = null;

      const wsHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkgikdelobnnjgnt",
      };

      // Use Node 22 native WebSocket with custom headers
      const ws = new globalThis.WebSocket(wsUrl, {
        headers: wsHeaders,
      });

      timeoutId = setTimeout(() => {
        try {
          ws.close();
        } catch (_) {}
        reject(new Error("Timeout khi kết nối tới Microsoft Edge TTS WebSocket (8s)."));
      }, 8000);

      ws.onopen = () => {
        // 1. Send speech.config
        const configPayload = JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "false",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });

        const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${configPayload}`;
        ws.send(configMessage);

        // 2. Send SSML request
        const escaped = this.escapeXml(text);
        const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ja-JP'><voice name='${voice}'><prosody pitch='${pitchStr}' rate='${rateStr}'>${escaped}</prosody></voice></speak>`;
        const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}\r\nPath:ssml\r\n\r\n${ssmlPayload}`;
        ws.send(ssmlMessage);
      };

      ws.onmessage = async (event) => {
        const data = event.data;

        // Text metadata frames
        if (typeof data === "string") {
          if (data.includes("Path:turn.end")) {
            isTurnEnd = true;
            clearTimeout(timeoutId);
            try {
              ws.close();
            } catch (_) {}

            if (audioChunks.length === 0) {
              return reject(new Error("Không nhận được dữ liệu âm thanh từ Edge TTS."));
            }
            return resolve(Buffer.concat(audioChunks));
          }
          return;
        }

        // Binary frame (ArrayBuffer or Blob)
        let buffer;
        if (data instanceof ArrayBuffer) {
          buffer = Buffer.from(data);
        } else if (typeof Blob !== "undefined" && data instanceof Blob) {
          const arrayBuf = await data.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } else if (Buffer.isBuffer(data)) {
          buffer = data;
        } else {
          return;
        }

        // Edge TTS Binary Protocol:
        // First 2 bytes = UInt16 big endian text header length
        if (buffer.length < 2) return;
        const headerLength = buffer.readUInt16BE(0);
        if (buffer.length < 2 + headerLength) return;

        const headerText = buffer.subarray(2, 2 + headerLength).toString("utf-8");
        if (headerText.includes("Path:audio")) {
          const audioPayload = buffer.subarray(2 + headerLength);
          if (audioPayload.length > 0) {
            audioChunks.push(audioPayload);
          }
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Edge TTS WebSocket error: ${err.message || "Failed to connect"}`));
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
        if (!isTurnEnd && audioChunks.length === 0) {
          reject(new Error("Edge TTS WebSocket closed prematurely without audio data."));
        } else if (!isTurnEnd && audioChunks.length > 0) {
          // If connection closed after receiving some audio chunks
          resolve(Buffer.concat(audioChunks));
        }
      };
    });
  }

  /**
   * Fallback using OpenAI TTS (tts-1)
   */
  static async synthesizeWithOpenAI(text, voice, rate = 0.95) {
    const isMale = voice?.toLowerCase().includes("keita") || voice?.toLowerCase().includes("daichi");
    const selectedVoice = isMale ? "onyx" : "nova";

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: selectedVoice,
        input: text,
        speed: rate,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI TTS Error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Fallback using Google Cloud Text-to-Speech
   */
  static async synthesizeWithGoogle(text, voice, rate = 0.95) {
    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.ai.googleApiKey}`;
    const isMale = voice?.toLowerCase().includes("keita") || voice?.toLowerCase().includes("daichi");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "ja-JP",
          name: isMale ? "ja-JP-Neural2-C" : "ja-JP-Neural2-B",
          ssmlGender: isMale ? "MALE" : "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: rate,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google TTS Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      audioContent: data.audioContent,
      mimeType: "audio/mp3",
    };
  }

  /**
   * Helper to map legacy Voicevox speaker IDs to modern Edge TTS voices
   */
  static mapVoicevoxSpeakerToEdge(speakerId) {
    switch (Number(speakerId)) {
      case 3: // Zundamon -> Dễ thương
        return EDGE_JAPANESE_VOICES.AOI;
      case 13: // Aoyama Ryusei -> Nam công sở
        return EDGE_JAPANESE_VOICES.KEITA;
      case 2: // Shikoku Metan -> Nữ gia sư
      default:
        return EDGE_JAPANESE_VOICES.NANAMI;
    }
  }
}

export default EdgeTtsService;
