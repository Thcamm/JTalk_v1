import https from "https";
import crypto from "crypto";
import config from "../config/index.js";
import VoicevoxService from "./voicevox.service.js";

// In-memory LRU cache for synthesized audio to ensure 0ms repeat latency
const audioCache = new Map();
const MAX_CACHE_SIZE = 500;

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
let isOpenAiQuotaExhausted = false;
let lastOpenAiQuotaCheck = 0;
const OPENAI_QUOTA_COOLDOWN_MS = 600000; // Check OpenAI at most once every 10 minutes if exhausted

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
   * Generates Microsoft Sec-MS-GEC DRM Token required by Edge Read-Aloud service
   */
  static getSecMsGecToken() {
    // Windows file time (number of 100-nanosecond intervals since January 1, 1601 UTC)
    const ticks = (Date.now() / 1000 + 11644473600) * 10000000;
    // Round down to the nearest 5-minute boundary (300 seconds = 3,000,000,000 ticks)
    const roundedTicks = ticks - (ticks % 3000000000);
    const str = `${roundedTicks}${TRUSTED_TOKEN}`;
    return crypto.createHash("sha256").update(str, "ascii").digest("hex").toUpperCase();
  }

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
   * Synthesize audio from text using Microsoft Edge Neural TTS with multiple resilient fallbacks
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

    // 2. If Voicevox Local Engine is actively running on developer machine, use it for 100% studio Japanese!
    try {
      const health = await VoicevoxService.checkHealth();
      if (health?.isOnline) {
        const speakerId = selectedVoice.includes("Keita") ? 13 : selectedVoice.includes("Aoi") ? 3 : 2;
        const voicevoxRes = await VoicevoxService.synthesize({
          text: cleanText,
          speakerId,
          speedScale: rate,
        });
        if (voicevoxRes?.audioContent) {
          this.saveToCache(cacheKey, voicevoxRes.audioContent);
          return {
            audioContent: voicevoxRes.audioContent,
            mimeType: "audio/wav",
            voice: selectedVoice,
            cached: false,
            provider: "voicevox-local",
          };
        }
      }
    } catch (_) {
      // Voicevox not running -> seamless transition to Edge Neural
    }

    // 3. Primary Production Engine: Microsoft Edge Neural TTS with Sec-MS-GEC DRM Token
    const candidateHosts = ["speech.platform.bing.com", "eastus.api.speech.microsoft.com"];
    for (const host of candidateHosts) {
      try {
        const audioBuffer = await this.synthesizeWithEdge(cleanText, selectedVoice, rateStr, pitchStr, host);
        if (audioBuffer && audioBuffer.length > 0) {
          const base64Audio = audioBuffer.toString("base64");
          this.saveToCache(cacheKey, base64Audio);
          return {
            audioContent: base64Audio,
            mimeType: "audio/mp3",
            voice: selectedVoice,
            cached: false,
            provider: "edge-tts",
          };
        }
      } catch (edgeError) {
        console.warn(`[Edge-TTS] Host ${host} notice: ${edgeError.message}`);
      }
    }

    // 4. Fallback 1: OpenAI TTS (if API key available and not in 429 quota exhaustion cooldown)
    const now = Date.now();
    if (
      config.ai.openaiApiKey &&
      !config.ai.openaiApiKey.includes("sk-proj-xxxxxxxx") &&
      (!isOpenAiQuotaExhausted || now - lastOpenAiQuotaCheck > OPENAI_QUOTA_COOLDOWN_MS)
    ) {
      try {
        const audioBuffer = await this.synthesizeWithOpenAI(cleanText, selectedVoice, rate);
        if (audioBuffer && audioBuffer.length > 0) {
          isOpenAiQuotaExhausted = false;
          const base64Audio = audioBuffer.toString("base64");
          this.saveToCache(cacheKey, base64Audio);
          return {
            audioContent: base64Audio,
            mimeType: "audio/mp3",
            voice: selectedVoice,
            cached: false,
            provider: "openai-tts",
          };
        }
      } catch (openAiError) {
        if (openAiError.message.includes("429") || openAiError.message.includes("insufficient_quota")) {
          isOpenAiQuotaExhausted = true;
          lastOpenAiQuotaCheck = now;
        }
        console.warn("[Edge-TTS] OpenAI fallback notice:", openAiError.message);
      }
    }

    // 5. Fallback 2: Google Translate Japanese Native Audio (Zero setup, 100% free & cloud ready)
    try {
      const audioBuffer = await this.synthesizeWithGoogleTranslate(cleanText);
      if (audioBuffer && audioBuffer.length > 0) {
        const base64Audio = audioBuffer.toString("base64");
        this.saveToCache(cacheKey, base64Audio);
        return {
          audioContent: base64Audio,
          mimeType: "audio/mp3",
          voice: selectedVoice,
          cached: false,
          provider: "google-translate-tts",
        };
      }
    } catch (gtError) {
      console.warn("[Edge-TTS] Google Translate fallback notice:", gtError.message);
    }

    // 6. Fallback 3: Google Cloud Text-to-Speech (if configured)
    if (config.ai.googleApiKey && !config.ai.googleApiKey.includes("your_google_cloud")) {
      try {
        const googleRes = await this.synthesizeWithGoogle(cleanText, selectedVoice, rate);
        if (googleRes?.audioContent) {
          this.saveToCache(cacheKey, googleRes.audioContent);
          return {
            audioContent: googleRes.audioContent,
            mimeType: "audio/mp3",
            voice: selectedVoice,
            cached: false,
            provider: "google-cloud-tts",
          };
        }
      } catch (googleError) {
        console.warn("[Edge-TTS] Google Cloud fallback notice:", googleError.message);
      }
    }

    throw new Error("Không thể tạo giọng đọc tiếng Nhật từ các nhà cung cấp TTS.");
  }

  static saveToCache(key, base64Audio) {
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value;
      audioCache.delete(oldestKey);
    }
    audioCache.set(key, base64Audio);
  }

  /**
   * RFC 6455 compliant WebSocket client over Node.js https module
   * Sends Sec-MS-GEC DRM Token, Chrome Extension Origin & User-Agent required by Edge Read-Aloud
   */
  static synthesizeWithEdge(text, voice, rateStr, pitchStr, host = "speech.platform.bing.com") {
    return new Promise((resolve, reject) => {
      const connectionId = crypto.randomUUID().replace(/-/g, "");
      const requestId = crypto.randomUUID().replace(/-/g, "");
      const secKey = crypto.randomBytes(16).toString("base64");
      const secMsGec = this.getSecMsGecToken();
      const gecVersion = "1-130.0.2849.68";

      const audioChunks = [];
      let isCompleted = false;
      let timer = null;

      const path = `/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${gecVersion}&ConnectionId=${connectionId}`;

      const req = https.request({
        hostname: host,
        port: 443,
        path,
        method: "GET",
        headers: {
          "Host": host,
          "Connection": "Upgrade",
          "Upgrade": "websocket",
          "Sec-WebSocket-Version": "13",
          "Sec-WebSocket-Key": secKey,
          "Sec-MS-GEC": secMsGec,
          "Sec-MS-GEC-Version": gecVersion,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
          "Origin": "chrome-extension://jdiccldimpdaibmpdkgikdelobnnjgnt",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      const cleanup = (socket) => {
        if (timer) clearTimeout(timer);
        if (socket && !socket.destroyed) {
          try {
            socket.destroy();
          } catch (_) {}
        }
      };

      // Responsive 3500ms timeout
      timer = setTimeout(() => {
        cleanup(null);
        reject(new Error(`Timeout khi kết nối Edge TTS ${host} (3.5s).`));
      }, 3500);

      req.on("error", (err) => {
        cleanup(null);
        reject(err);
      });

      req.on("upgrade", (res, socket) => {
        if (res.statusCode !== 101) {
          cleanup(socket);
          return reject(new Error(`WebSocket Upgrade failed with HTTP ${res.statusCode}`));
        }

        // Helper to send masked RFC 6455 WebSocket Text Frame
        const sendWsText = (messageText) => {
          const payload = Buffer.from(messageText, "utf-8");
          const len = payload.length;
          let header;

          if (len <= 125) {
            header = Buffer.alloc(6);
            header[0] = 0x81; // FIN + opcode 1 (text)
            header[1] = 0x80 | len; // Masked bit = 1
            const mask = crypto.randomBytes(4);
            mask.copy(header, 2);
            const maskedPayload = Buffer.alloc(len);
            for (let i = 0; i < len; i++) maskedPayload[i] = payload[i] ^ mask[i % 4];
            socket.write(Buffer.concat([header, maskedPayload]));
          } else if (len <= 65535) {
            header = Buffer.alloc(8);
            header[0] = 0x81;
            header[1] = 0x80 | 126;
            header.writeUInt16BE(len, 2);
            const mask = crypto.randomBytes(4);
            mask.copy(header, 4);
            const maskedPayload = Buffer.alloc(len);
            for (let i = 0; i < len; i++) maskedPayload[i] = payload[i] ^ mask[i % 4];
            socket.write(Buffer.concat([header, maskedPayload]));
          } else {
            header = Buffer.alloc(14);
            header[0] = 0x81;
            header[1] = 0x80 | 127;
            header.writeBigUInt64BE(BigInt(len), 2);
            const mask = crypto.randomBytes(4);
            mask.copy(header, 10);
            const maskedPayload = Buffer.alloc(len);
            for (let i = 0; i < len; i++) maskedPayload[i] = payload[i] ^ mask[i % 4];
            socket.write(Buffer.concat([header, maskedPayload]));
          }
        };

        const nowIso = new Date().toISOString();

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
        sendWsText(`X-Timestamp:${nowIso}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${configPayload}`);

        // 2. Send SSML Synthesis command
        const escaped = this.escapeXml(text);
        const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ja-JP'><voice name='${voice}'><prosody pitch='${pitchStr}' rate='${rateStr}'>${escaped}</prosody></voice></speak>`;
        const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${nowIso}\r\nPath:ssml\r\n\r\n${ssmlPayload}`;
        sendWsText(ssmlMessage);

        // 3. Receive frames from server
        let frameBuffer = Buffer.alloc(0);

        socket.on("data", (chunk) => {
          frameBuffer = Buffer.concat([frameBuffer, chunk]);

          while (frameBuffer.length >= 2) {
            const byte0 = frameBuffer[0];
            const byte1 = frameBuffer[1];
            const opcode = byte0 & 0x0F;
            const isMasked = (byte1 & 0x80) !== 0;
            let payloadLen = byte1 & 0x7F;
            let offset = 2;

            if (payloadLen === 126) {
              if (frameBuffer.length < 4) break;
              payloadLen = frameBuffer.readUInt16BE(2);
              offset = 4;
            } else if (payloadLen === 127) {
              if (frameBuffer.length < 10) break;
              payloadLen = Number(frameBuffer.readBigUInt64BE(2));
              offset = 10;
            }

            let mask = null;
            if (isMasked) {
              if (frameBuffer.length < offset + 4) break;
              mask = frameBuffer.subarray(offset, offset + 4);
              offset += 4;
            }

            if (frameBuffer.length < offset + payloadLen) break;

            let payload = frameBuffer.subarray(offset, offset + payloadLen);
            if (isMasked && mask) {
              const unmasked = Buffer.alloc(payloadLen);
              for (let i = 0; i < payloadLen; i++) unmasked[i] = payload[i] ^ mask[i % 4];
              payload = unmasked;
            }

            frameBuffer = frameBuffer.subarray(offset + payloadLen);

            // Handle frame according to opcode
            if (opcode === 0x1) {
              // Text frame
              const textContent = payload.toString("utf-8");
              if (textContent.includes("Path:turn.end")) {
                isCompleted = true;
                cleanup(socket);
                if (audioChunks.length > 0) {
                  return resolve(Buffer.concat(audioChunks));
                }
                return reject(new Error("No audio chunks received from Edge TTS turn."));
              }
            } else if (opcode === 0x2) {
              // Binary frame containing audio
              if (payload.length >= 2) {
                const headerLen = payload.readUInt16BE(0);
                if (payload.length >= 2 + headerLen) {
                  const header = payload.subarray(2, 2 + headerLen).toString("utf-8");
                  if (header.includes("Path:audio")) {
                    const audioData = payload.subarray(2 + headerLen);
                    if (audioData.length > 0) {
                      audioChunks.push(Buffer.from(audioData));
                    }
                  }
                }
              }
            } else if (opcode === 0x8) {
              // Close frame
              cleanup(socket);
              if (audioChunks.length > 0) {
                return resolve(Buffer.concat(audioChunks));
              }
              return reject(new Error("Edge TTS connection closed before completion."));
            } else if (opcode === 0x9) {
              // Ping -> Send Pong (0x8A)
              const pong = Buffer.from([0x8A, 0x00]);
              socket.write(pong);
            }
          }
        });

        socket.on("error", (err) => {
          cleanup(socket);
          reject(err);
        });

        socket.on("close", () => {
          cleanup(socket);
          if (!isCompleted) {
            if (audioChunks.length > 0) {
              resolve(Buffer.concat(audioChunks));
            } else {
              reject(new Error("Edge TTS socket closed prematurely."));
            }
          }
        });
      });

      req.end();
    });
  }

  /**
   * Resilient Google Translate Japanese Native Audio (100% Free, Cloud-ready, No API Key needed)
   */
  static async synthesizeWithGoogleTranslate(text) {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ja&total=1&idx=0&textlen=${text.length}&client=tw-ob`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!res.ok) {
      throw new Error(`Google Translate TTS HTTP Error ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
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
