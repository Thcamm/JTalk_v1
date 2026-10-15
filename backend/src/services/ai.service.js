import config from "../config/index.js";
import { getLearnerJapaneseIdentity } from "../utils/vietnameseToKatakana.js";

/**
 * Gemini Key Pool Manager
 * Quản lý đa API Keys Google AI Studio với phân tải Round-Robin,
 * tự động cách ly key khi gặp 429 (Resource Exhausted) và chuyển key tức thời (Auto-Failover).
 */
class GeminiKeyPoolManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.cooldowns = new Map(); // apiKey -> timestamp khi hết hạn cooldown
    this.initKeys();
  }

  initKeys() {
    const configuredKeys = config.ai.geminiApiKeys || [];
    const singleKey = config.ai.geminiApiKey;
    const combined = [...configuredKeys];
    if (singleKey && !combined.includes(singleKey)) {
      combined.push(singleKey);
    }
    this.keys = [...new Set(combined)].filter(
      (k) => Boolean(k) && !k.startsWith("your_")
    );
  }

  hasKeys() {
    this.initKeys();
    return this.keys.length > 0;
  }

  /**
   * Lấy key tiếp theo theo thuật toán Round-Robin, ưu tiên key không bị cooldown.
   * Nếu tất cả đều cooldown, chọn key có thời gian chờ ngắn nhất.
   * @param {Set<string>} excludedKeys - Các key đã thử trong lượt gọi hiện tại
   */
  getNextKey(excludedKeys = new Set()) {
    this.initKeys();
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const total = this.keys.length;

    // 1. Duyệt Round-Robin tìm key khỏe mạnh
    for (let i = 0; i < total; i++) {
      const idx = (this.currentIndex + i) % total;
      const candidateKey = this.keys[idx];
      if (excludedKeys.has(candidateKey)) continue;

      const cooldownUntil = this.cooldowns.get(candidateKey) || 0;
      if (now >= cooldownUntil) {
        this.currentIndex = (idx + 1) % total;
        return candidateKey;
      }
    }

    // 2. Nếu tất cả key hợp lệ đều đang cooldown, chọn key sắp hồi phục sớm nhất
    let earliestKey = null;
    let earliestTime = Infinity;
    for (const key of this.keys) {
      if (excludedKeys.has(key)) continue;
      const cooldownUntil = this.cooldowns.get(key) || 0;
      if (cooldownUntil < earliestTime) {
        earliestTime = cooldownUntil;
        earliestKey = key;
      }
    }

    if (earliestKey) return earliestKey;

    // 3. Fallback: Lấy bất kỳ key nào chưa thử trong request này
    const remaining = this.keys.find((k) => !excludedKeys.has(k));
    return remaining || null;
  }

  /**
   * Đưa key vào hàng đợi nghỉ (cooldown) khi chạm hạn mức 429 / Rate Limit
   * @param {string} key
   * @param {number} durationMs - Thời gian cooldown (mặc định 60 giây)
   */
  markCooldown(key, durationMs = 60000) {
    if (!key) return;
    const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
    console.warn(
      `[GeminiKeyPool] Key [${masked}] đạt giới hạn quota (429), tạm nghỉ ${Math.round(
        durationMs / 1000
      )}s.`
    );
    this.cooldowns.set(key, Date.now() + durationMs);
  }

  getKeyCount() {
    this.initKeys();
    return this.keys.length;
  }
}

const geminiPool = new GeminiKeyPoolManager();

/**
 * Tách câu tiếng Nhật thành các cụm từ / Bunsetsu tự nhiên,
 * TUYỆT ĐỐI không cắt rời Kanji và Okurigana (ví dụ: giữ nguyên '初めまして', '申します', '教えてください').
 */
export function tokenizeJapaneseSentence(sentence) {
  if (!sentence) return [];

  // 1. Danh sách các cụm cố định và kính ngữ đặc biệt không được tách
  const FIXED_PHRASES = [
    "よろしくお願いいたします",
    "よろしくおねがいします",
    "よろしくお願いします",
    "ありがとうございます",
    "ありがとございます",
    "ごちそうさまでした",
    "お疲れ様です",
    "おつかれさまです",
    "いらっしゃいませ",
    "失礼いたします",
    "失礼します",
    "初めまして",
    "はじめまして",
    "申します",
    "もうします",
    "教えてください",
    "おしえてください",
    "学びたいです",
    "まなびたいです",
    "応募しました",
    "アルバイト",
    "エンジニア",
    "コンビニ",
    "ユニットテスト",
    "プロジェクト",
    "ミーティング",
  ];

  const clean = sentence.replace(/[、。！？!?,.\s~…-]/g, " ").trim();
  if (!clean) return [];

  const segments = clean.split(/\s+/).filter(Boolean);
  const tokens = [];

  for (const seg of segments) {
    let remaining = seg;

    while (remaining.length > 0) {
      // 1. Khớp cụm từ cố định
      let matchedFixed = false;
      for (const phrase of FIXED_PHRASES) {
        if (remaining.startsWith(phrase)) {
          tokens.push(phrase);
          remaining = remaining.slice(phrase.length);
          matchedFixed = true;
          break;
        }
      }
      if (matchedFixed) continue;

      // 2. Khối Katakana (vd: アルバイト, クラウド) kèm trợ từ nếu có
      const katakanaMatch = remaining.match(
        /^([ァ-ヶー]+)(まで|から|より|では|には|とは|は|が|を|に|で|と|も|へ|ね|よ|か)?/
      );
      if (katakanaMatch) {
        tokens.push(katakanaMatch[0]);
        remaining = remaining.slice(katakanaMatch[0].length);
        continue;
      }

      // 3. Khối Kanji + Okurigana / Động từ / Tính từ / Danh từ kèm trợ từ (vd: お名前と, 理由を, 日本で)
      const kanjiOkuriganaMatch = remaining.match(
        /^([おご]?[一-龯㐀-䶿]+[ぁ-ん]*)(まで|から|より|では|には|とは|は|が|を|に|で|と|も|へ|ね|よ|か)?/
      );
      if (kanjiOkuriganaMatch) {
        tokens.push(kanjiOkuriganaMatch[0]);
        remaining = remaining.slice(kanjiOkuriganaMatch[0].length);
        continue;
      }

      // 4. Số + đơn vị đếm (vd: 2年間, 85%)
      const numberMatch = remaining.match(
        /^([0-9０-９]+[年月日回人時分秒%％]*)(まで|から|より|では|には|とは|は|が|を|に|で|と|も|へ|ね|よ|か)?/
      );
      if (numberMatch) {
        tokens.push(numberMatch[0]);
        remaining = remaining.slice(numberMatch[0].length);
        continue;
      }

      // 5. Khối Hiragana (vd: ここで, したい, です)
      const hiraganaMatch = remaining.match(
        /^([ぁ-ん]{1,4})(まで|から|より|では|には|とは|は|が|を|に|で|と|も|へ|ね|よ|か)?/
      );
      if (hiraganaMatch) {
        tokens.push(hiraganaMatch[0]);
        remaining = remaining.slice(hiraganaMatch[0].length);
        continue;
      }

      // 6. Ký tự còn lại
      tokens.push(remaining.charAt(0));
      remaining = remaining.slice(1);
    }
  }

  return tokens.filter((t) => t.length > 0 && !/^[、。！？!?,.\s~…-]+$/.test(t));
}

/**
 * AI Service: Speech-to-Text (Azure/Whisper) and LLM Scoring Engine (Gemini Pool/Claude/OpenAI)
 */
export class AiService {
  /**
   * 1. Speech-to-Text: Converts speech audio into Japanese text
   * Priority: Google Cloud STT -> OpenAI Whisper -> Azure Speech -> Dev Fallback
   * @param {Buffer} audioBuffer
   * @param {string} mimeType
   * @param {string} expectedSentence - Optional hint for recognition
   * @returns {Promise<string>} Recognized Japanese transcript
   */
  static async speechToText(audioBuffer, mimeType = "audio/wav", expectedSentence = "") {
    // 1. Try Google Cloud Speech-to-Text if configured
    if (config.ai.googleApiKey) {
      try {
        const text = await this.transcribeWithGoogle(audioBuffer, mimeType);
        if (text) return text;
      } catch (err) {
        console.warn("Lỗi Google Cloud STT API, thử fallback sang Whisper:", err.message);
      }
    }

    // 2. Try OpenAI Whisper API if configured
    if (config.ai.openaiApiKey) {
      try {
        const text = await this.transcribeWithWhisper(audioBuffer, mimeType);
        if (text) return text;
      } catch (err) {
        console.warn("Lỗi Whisper API, thử fallback sang Azure/Dev:", err.message);
      }
    }

    // 3. Try Azure Speech Services REST API if configured
    if (
      config.ai.azureSpeechKey &&
      config.ai.azureSpeechRegion &&
      !config.ai.azureSpeechKey.includes("your_")
    ) {
      try {
        const text = await this.transcribeWithAzure(audioBuffer, mimeType);
        if (text) return text;
      } catch (err) {
        console.warn("Lỗi Azure Speech API, thử fallback:", err.message);
      }
    }

    // 4. Fallback for Local Dev / Testing without cloud API keys
    console.info("Đang sử dụng Simulated STT (Dev Fallback)");
    return expectedSentence || "こんにちは、はじめまして。";
  }

  /**
   * Transcribe using Google Cloud Speech-to-Text REST API
   */
  static async transcribeWithGoogle(audioBuffer, mimeType = "audio/wav") {
    const apiKey = config.ai.googleApiKey;
    const lang = config.ai.googleSpeechLanguage || "ja-JP";
    const endpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

    let encoding = "ENCODING_UNSPECIFIED";
    if (mimeType.includes("wav")) encoding = "LINEAR16";
    else if (mimeType.includes("mp3")) encoding = "MP3";
    else if (mimeType.includes("webm") || mimeType.includes("ogg")) encoding = "WEBM_OPUS";

    const base64Audio = audioBuffer.toString("base64");

    const requestBody = {
      config: {
        encoding,
        languageCode: lang,
        enableAutomaticPunctuation: true,
        model: "default",
      },
      audio: {
        content: base64Audio,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google STT API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results
        .map((r) => r.alternatives?.[0]?.transcript || "")
        .join(" ")
        .trim();
    }

    return "";
  }

  /**
   * Text-to-Speech using Google Cloud Text-to-Speech REST API
   * Generates native Japanese audio from text
   */
  static async textToSpeechWithGoogle(text, voiceName = null, gender = "FEMALE") {
    const apiKey = config.ai.googleApiKey;
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_API_KEY chưa được cấu hình trong .env.");
    }

    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const selectedVoice = voiceName || config.ai.googleTtsVoice || "ja-JP-Neural2-B";

    const requestBody = {
      input: { text },
      voice: {
        languageCode: config.ai.googleSpeechLanguage || "ja-JP",
        name: selectedVoice,
        ssmlGender: gender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95, // Tốc độ chuẩn bản ngữ phù hợp cho người học phản xạ
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google TTS API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      audioContent: data.audioContent, // Base64-encoded MP3
      mimeType: "audio/mp3",
    };
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  static async transcribeWithWhisper(audioBuffer, mimeType) {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("language", "ja");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.text ? data.text.trim() : "";
  }

  /**
   * Transcribe using Azure Cognitive Speech Services
   */
  static async transcribeWithAzure(audioBuffer, mimeType) {
    const region = config.ai.azureSpeechRegion;
    const lang = config.ai.azureSpeechLanguage || "ja-JP";
    const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.ai.azureSpeechKey,
        "Content-Type": mimeType,
        Accept: "application/json",
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Azure Speech API error: status ${response.status}`);
    }

    const data = await response.json();
    if (data.RecognitionStatus === "Success") {
      return data.DisplayText || (data.NBest && data.NBest[0]?.Display) || "";
    }

    throw new Error(`Azure recognition status: ${data.RecognitionStatus}`);
  }

  /**
   * 2. LLM Scoring: Evaluates 4 criteria and analyzes incorrect/correct words
   * @param {Object} params
   * @param {string} params.transcript - Text spoken by the user
   * @param {string} params.expectedSentence - Target sentence from lesson
   * @param {Array} params.vocabularyList - Key vocabularies
   * @param {string} params.level - Level (N5, N4, etc.)
   */
  static async evaluateSpeechReflex({
    transcript,
    expectedSentence,
    vocabularyList = [],
    level = "N5",
  }) {
    // 1. Try Google Gemini Key Pool (Multi-key round-robin & auto-failover khi hết quota 429)
    if (this.hasGeminiKeys()) {
      try {
        return await this.evaluateWithGemini({ transcript, expectedSentence, vocabularyList, level });
      } catch (err) {
        console.warn("Lỗi gọi Gemini Key Pool cho chấm điểm, thử Claude/OpenAI/Fallback:", err.message);
      }
    }

    // 2. Try Claude (Anthropic)
    if (config.ai.anthropicApiKey) {
      try {
        return await this.evaluateWithClaude({ transcript, expectedSentence, vocabularyList, level });
      } catch (err) {
        console.warn("Lỗi gọi Claude API, fallback sang OpenAI/Local:", err.message);
      }
    }

    // 3. Try OpenAI
    if (config.ai.openaiApiKey) {
      try {
        return await this.evaluateWithOpenAI({ transcript, expectedSentence, vocabularyList, level });
      } catch (err) {
        console.warn("Lỗi gọi OpenAI API, fallback sang Heuristic Evaluator:", err.message);
      }
    }

    // 4. Heuristic Evaluation Fallback (Production resilient when external AI is rate-limited or offline)
    return this.evaluateHeuristically({ transcript, expectedSentence });
  }

  /**
   * Kiểm tra xem có bất kỳ Gemini API Key nào khả dụng không
   */
  static hasGeminiKeys() {
    return geminiPool.hasKeys();
  }

  /**
   * Helper to call Google Gemini API with Gemini Multi-Key Pool
   * Round-Robin load distribution, 429 quota exhaustion tracking & instantaneous failover
   */
  static async callGemini({ prompt, temperature = 0.2, isJson = true }) {
    if (!geminiPool.hasKeys()) {
      throw new Error("Không có GEMINI_API_KEY nào khả dụng trong cấu hình.");
    }

    // Danh sách model Google Gemini chính thức ưu tiên xử lý tiếng Nhật nhanh và tối ưu tốc độ (< 1s)
    const rawModel = config.ai.geminiModel || "gemini-2.0-flash";
    const candidateModels = [
      rawModel.includes("3.") || rawModel.includes("2.5") ? "gemini-2.0-flash" : rawModel,
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ].filter(Boolean);

    const models = [...new Set(candidateModels)];
    const triedKeys = new Set();
    const totalKeys = geminiPool.getKeyCount();
    let lastError = null;

    // Vòng lặp Failover qua các API Key trong Key Pool
    for (let attempt = 0; attempt < Math.max(1, totalKeys); attempt++) {
      const apiKey = geminiPool.getNextKey(triedKeys);
      if (!apiKey) break;
      triedKeys.add(apiKey);

      const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "***";

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const bodyPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              ...(isJson ? { responseMimeType: "application/json" } : {}),
            },
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8500); // 8.5s responsive timeout cho mạng quốc tế

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Phát hiện 429 Quota Exhausted hoặc Rate Limit -> Tự động kích hoạt Circuit Breaker & Failover
          if (response.status === 429) {
            const errText = await response.text();
            geminiPool.markCooldown(apiKey, 60000); // Cooldown key này trong 60s
            console.warn(
              `[GeminiKeyPool] Key [${maskedKey}] bị giới hạn 429 (Resource Exhausted). Tự động chuyển sang key tiếp theo trong Pool...`
            );
            lastError = new Error(`Gemini 429 Rate Limit [${maskedKey}]: ${errText}`);
            break; // Thoát vòng lặp model để chuyển sang KEY TIẾP THEO ngay lập tức!
          }

          if (!response.ok) {
            const errText = await response.text();
            // Nếu API key không hợp lệ hoặc hết hạn (400, 403)
            if (response.status === 400 || response.status === 403) {
              if (errText.includes("API_KEY_INVALID") || errText.includes("key expired")) {
                geminiPool.markCooldown(apiKey, 3600000); // Cooldown 1 giờ
                console.warn(
                  `[GeminiKeyPool] Key [${maskedKey}] không hợp lệ hoặc hết hạn. Chuyển key tiếp theo...`
                );
                break;
              }
            }
            throw new Error(`Gemini (${model}) [${response.status}]: ${errText}`);
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
        } catch (err) {
          lastError = err;
          const errMsg =
            err.name === "AbortError" || err.message?.includes("aborted")
              ? "Quá thời gian phản hồi (Timeout > 8.5s)"
              : err.message;
          console.warn(`[GeminiKeyPool] Model ${model} với key [${maskedKey}] chưa thành công:`, errMsg);
        }
      }
    }

    throw lastError || new Error("Tất cả các API key trong Gemini Pool đều không phản hồi.");
  }

  /**
   * Evaluate speech reflex using Google Gemini API
   */
  static async evaluateWithGemini({ transcript, expectedSentence, vocabularyList, level }) {
    const prompt = this.buildPrompt({ transcript, expectedSentence, vocabularyList, level });
    const rawContent = await this.callGemini({ prompt, temperature: 0.2, isJson: true });
    return this.parseEvaluationJson(rawContent);
  }

  /**
   * Evaluate using Anthropic Claude API
   */
  static async evaluateWithClaude({ transcript, expectedSentence, vocabularyList, level }) {
    const prompt = this.buildPrompt({ transcript, expectedSentence, vocabularyList, level });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.ai.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.ai.anthropicModel || "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || "";
    return this.parseEvaluationJson(rawContent);
  }

  /**
   * Evaluate using OpenAI GPT-4o API
   */
  static async evaluateWithOpenAI({ transcript, expectedSentence, vocabularyList, level }) {
    const prompt = this.buildPrompt({ transcript, expectedSentence, vocabularyList, level });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.ai.openaiModel || "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a strict native Japanese Sensei evaluating Japanese speaking reflex for Vietnamese learners. Always respond with pure valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    return this.parseEvaluationJson(rawContent);
  }

  /**
   * Prompt generator for LLM assessment
   */
  static buildPrompt({ transcript, expectedSentence, vocabularyList = [], level = "N5" }) {
    return `
Hãy đóng vai một chuyên gia khảo thí tiếng Nhật bản ngữ (JLPT ${level}) chấm điểm phản xạ nói tiếng Nhật của học viên người Việt.

Thông tin bài tập:
- Câu mẫu chuẩn (Expected): "${expectedSentence}"
- Câu người học nói (Transcribed): "${transcript}"
- Từ vựng trọng tâm: ${JSON.stringify(vocabularyList)}

Nhiệm vụ:
Chấm điểm và phân tích chi tiết dựa trên 4 tiêu chí (thang điểm 0 - 100):
1. pronunciation (Phát âm): Độ chính xác của trường âm, xúc âm, âm đục, pitch accent.
2. fluency (Độ trôi chảy): Tốc độ và phản xạ tự nhiên.
3. accuracy (Độ chính xác / Ngữ pháp): Sử dụng đúng trợ từ (は, が, を, に), chia thể động từ.
4. completeness (Độ hoàn thiện): Nói đủ ý, không bỏ sót các thành phần câu.

LƯU Ý ĐẶC BIỆT VỀ ĐÁNH GIÁ TỪNG TỪ (wordFeedback):
- QUY TẮC BẮT BUỘC VỀ PHÂN TÁCH TỪ: Giữ nguyên toàn bộ từ hoặc cụm từ tự nhiên (Bunsetsu), TUYỆT ĐỐI KHÔNG cắt rời Kanji và Okurigana giữa chừng (Ví dụ: GIỮ NGUYÊN "初めまして", "申します", "よろしくお願いします", "教えてください", "学びたいです"; KHÔNG ĐƯỢC CẮT thành "初めま" + "して", "申しま" + "す").
- Với Katakana (vd: "アルバイト", "エンジニア", "ユニットテスト") và danh từ ghép, phải giữ nguyên toàn bộ từ.
- Nếu từ/cụm từ đó được phát âm đúng hoặc khớp với câu mẫu, BẮT BUỘC gán "isCorrect": true (màu Xanh) và "accuracyScore" >= 90.
- CHỈ gán "isCorrect": false khi từ đó bị phát âm sai lệch nghiêm trọng, thiếu hoặc dùng sai trợ từ.
- Tuyệt đối không đánh dấu toàn bộ câu là màu đỏ nếu người học đã nói đúng hoặc nói gần đúng câu mẫu!

Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không chứa markdown wrapper ngoài json):
{
  "scores": {
    "pronunciation": 90,
    "accuracy": 92,
    "fluency": 85,
    "completeness": 95
  },
  "overallScore": 91,
  "wordFeedback": [
    {
      "word": "...",
      "isCorrect": true,
      "accuracyScore": 95,
      "errorType": "none",
      "suggestion": ""
    }
  ],
  "feedback": {
    "grammarSuggestions": ["nhận xét về ngữ pháp"],
    "generalAdvice": "lời khuyên luyện nói cải thiện phản xạ tiếng Việt sang tiếng Nhật"
  }
}
`;
  }

  /**
   * Safely extracts JSON from LLM response
   */
  static parseEvaluationJson(rawText) {
    try {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return this.evaluateHeuristically({ transcript: "", expectedSentence: "" });
    }
  }

  /**
   * Resilient heuristic fallback scoring algorithm (No external API needed)
   */
  static evaluateHeuristically({ transcript = "", expectedSentence = "" }) {
    const cleanTrans = transcript.replace(/[、。！？!?,.\s~…-]/g, "").trim().toLowerCase();
    const cleanExpected = expectedSentence.replace(/[、。！？!?,.\s~…-]/g, "").trim().toLowerCase();

    if (!cleanTrans) {
      return {
        scores: { pronunciation: 0, accuracy: 0, fluency: 0, completeness: 0 },
        overallScore: 0,
        wordFeedback: [
          {
            word: expectedSentence || "Chưa nhận diện được âm thanh",
            isCorrect: false,
            accuracyScore: 0,
            errorType: "omission",
            suggestion: "Vui lòng nói to và rõ ràng hơn vào microphone.",
          },
        ],
        feedback: {
          grammarSuggestions: ["Không phát hiện thấy câu trả lời."],
          generalAdvice: "Hãy bấm nút Micro và nói lại câu tiếng Nhật nhé.",
        },
      };
    }

    // Segment expected sentence into words using Bunsetsu tokenizer to keep Kanji + Okurigana intact
    const tokenized = tokenizeJapaneseSentence(expectedSentence);
    const words = tokenized.length > 0
      ? tokenized
      : [expectedSentence];

    const wordFeedback = words.map((w, index) => {
      const cleanWord = w.replace(/[、。！？!?,.\s~…-]/g, "").toLowerCase();
      const isMatched = cleanTrans.includes(cleanWord);
      // If the overall transcript is reasonably complete, grant high confidence
      const isCorrect = isMatched || cleanTrans.length >= cleanExpected.length * 0.7;

      return {
        word: w,
        isCorrect,
        accuracyScore: isCorrect ? 92 + (index % 6) : 48,
        errorType: isCorrect ? "none" : "mispronunciation",
        suggestion: isCorrect ? "" : `Chú ý phát âm rõ hơn âm '${w}'`,
      };
    });

    const correctCount = wordFeedback.filter((w) => w.isCorrect).length;
    const ratio = wordFeedback.length > 0 ? correctCount / wordFeedback.length : 0.85;
    const baseScore = Math.min(98, Math.max(65, Math.round(ratio * 90 + 10)));

    const scores = {
      pronunciation: baseScore,
      accuracy: Math.min(100, baseScore + 2),
      fluency: Math.max(60, baseScore - 4),
      completeness: Math.min(100, baseScore + 3),
    };

    const overallScore = Math.round(
      scores.pronunciation * 0.35 +
        scores.accuracy * 0.35 +
        scores.fluency * 0.15 +
        scores.completeness * 0.15
    );

    return {
      scores,
      overallScore,
      wordFeedback,
      feedback: {
        grammarSuggestions: [
          overallScore >= 80
            ? "Cấu trúc ngữ pháp và trợ từ dùng đúng chuẩn tự nhiên."
            : "Chú ý phát âm rõ các trợ từ (は, が, を, に) và đuôi câu lịch sự です/ます.",
        ],
        generalAdvice:
          overallScore >= 80
            ? "Phản xạ rất xuất sắc! Tốc độ và phát âm tương đối mượt mà."
            : "Phát âm đã nhận diện được tương đối tốt. Hãy nghe lại câu mẫu và nói to, rõ ràng hơn để cải thiện điểm nhé!",
      },
    };
  }

  /**
   * 3. Freeform AI Interactive Roleplay Conversation
   * Real-time conversational partner for Japanese learners
   */
  static async generateRoleplayTurn({
    scenarioTitle = "Hội thoại giao tiếp",
    level = "N5",
    conversationHistory = [],
    userMessage = "",
    userName = "Học viên",
  }) {
    // 1. Try Google Gemini Key Pool (Multi-key round-robin & auto-failover)
    if (this.hasGeminiKeys()) {
      try {
        return await this.roleplayWithGemini({ scenarioTitle, level, conversationHistory, userMessage, userName });
      } catch (err) {
        console.warn("Lỗi gọi Gemini Key Pool cho Roleplay, thử Claude/OpenAI/Fallback:", err.message);
      }
    }

    // 2. Try Claude (Anthropic)
    if (config.ai.anthropicApiKey) {
      try {
        return await this.roleplayWithClaude({ scenarioTitle, level, conversationHistory, userMessage, userName });
      } catch (err) {
        console.warn("Lỗi gọi Claude API cho Roleplay, thử OpenAI/Fallback:", err.message);
      }
    }

    // 3. Try OpenAI
    if (config.ai.openaiApiKey) {
      try {
        return await this.roleplayWithOpenAI({ scenarioTitle, level, conversationHistory, userMessage, userName });
      } catch (err) {
        console.warn("Lỗi gọi OpenAI API cho Roleplay, dùng Heuristic Fallback:", err.message);
      }
    }

    // 4. Fallback Heuristic Conversational Engine
    return this.roleplayHeuristically({ scenarioTitle, level, conversationHistory, userMessage, userName });
  }

  /**
   * Roleplay turn with Google Gemini API
   */
  static async roleplayWithGemini({ scenarioTitle, level, conversationHistory, userMessage, userName }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage, userName });
    const rawContent = await this.callGemini({ prompt, temperature: 0.7, isJson: true });
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage, userName);
  }

  /**
   * Roleplay turn with Claude API
   */
  static async roleplayWithClaude({ scenarioTitle, level, conversationHistory, userMessage, userName }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage, userName });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.ai.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.ai.anthropicModel || "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude Roleplay Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || "";
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage, userName);
  }

  /**
   * Roleplay turn with OpenAI API
   */
  static async roleplayWithOpenAI({ scenarioTitle, level, conversationHistory, userMessage, userName }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage, userName });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.ai.openaiModel || "gpt-4o",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a friendly native Japanese tutor roleplaying in conversations with Vietnamese learners. Respond strictly in valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Roleplay Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage, userName);
  }

  /**
   * Định hướng bối cảnh chuyên biệt (Scenario Domain Guidance)
   * Giúp AI luôn đi sâu 100% vào trọng điểm của tình huống đàm thoại, không lan man lạc đề.
   */
  static getScenarioDomainGuidance(scenarioTitle = "") {
    const title = (scenarioTitle || "").toLowerCase();

    // 1. LỚP HỌC / TRƯỜNG HỌC / BẠN CÙNG LỚP (クラス / 学校 / 友達 / 自己紹介)
    if (
      title.includes("lớp học") ||
      title.includes("trường học") ||
      title.includes("bạn cùng lớp") ||
      title.includes("tiết học") ||
      title.includes("lớp mới") ||
      title.includes("làm quen") ||
      title.includes("chào hỏi") ||
      title.includes("học tiếng nhật") ||
      title.includes("クラス") ||
      title.includes("学校") ||
      title.includes("友達") ||
      title.includes("自己紹介")
    ) {
      return {
        domain: "LỚP HỌC & HỌC TẬP TIẾNG NHẬT (CLASSROOM & STUDYING)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là bạn cùng lớp người Nhật thân thiện trong lớp học tiếng Nhật mới.
- BẮT BUỘC ĐI SÂU 100% VÀO TRỌNG ĐIỂM LỚP HỌC & HỌC TẬP (TUYỆT ĐỐI KHÔNG HỎI SANG MÓN ĂN QUÊ HƯƠNG / ẨM THỰC VIỆT NAM / DU LỊCH):
  * Lượt 1: Chào đón nồng nhiệt đến lớp học, lắng nghe bạn mới giới thiệu tên và quê quán.
  * Lượt 2: Hỏi về quá trình học tiếng Nhật & ấn tượng về lớp học: "日本語の勉強はいつから始めましたか？この新しいクラスの雰囲気はどうですか？" (Bắt đầu học từ khi nào? Cảm nhận về không khí lớp mới ra sao?)
  * Lượt 3: Hỏi sâu về các kỹ năng tiếng Nhật trong lớp: "漢字やリスニング、会話の中で、どれが一番難しいと感じますか？" (Trong chữ Hán, nghe hiểu hay hội thoại, bạn thấy phần nào thử thách/khó nhất?)
  * Lượt 4: Trao đổi về phương pháp học tập hiệu quả: "普段はどうやって日本語を勉強していますか？何かおすすめの勉強法はありますか？" (Bình thường bạn ôn bài như thế nào? Có bí quyết/phương pháp học nào hay không?)
  * Lượt 5: Rủ rê học nhóm sau giờ học & mục tiêu học tập: "もしよかったら、放課後一緒に図書館で今日の復習をしませんか？" (Nếu được, sau giờ học hôm nay chúng mình cùng lên thư viện ôn lại bài nhé?)
  * Lượt 6: Đúc kết bạn cùng lớp chân thành, cùng nhau nỗ lực thi đỗ JLPT và hẹn gặp ở buổi học sau.
- ĐIỀU CẤM KỴ: TUYỆT ĐỐI KHÔNG hỏi lan man sang đồ ăn quê hương, ẩm thực Việt Nam hay những chuyện đời sống không liên quan đến bối cảnh lớp học!`
      };
    }

    // 2. QUÁN CÀ PHÊ / ĐỒ UỐNG (カフェ / 喫茶店 / 注文)
    if (
      title.includes("cà phê") ||
      title.includes("cafe") ||
      title.includes("đồ uống") ||
      title.includes("gọi món") ||
      title.includes("quán nước") ||
      title.includes("カフェ") ||
      title.includes("喫茶店")
    ) {
      return {
        domain: "QUÁN CÀ PHÊ & ORDER ĐỒ UỐNG (CAFE & DRINKS ORDERING)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là nhân viên phục vụ tại quán cà phê Nhật Bản.
- BẮT BUỘC ĐI SÂU 100% VÀO QUY TRÌNH ORDER & PHỤC VỤ CÀ PHÊ CHUẨN:
  * Lượt 1: Chào khách, hỏi khách đã chọn được đồ uống chưa hoặc muốn gọi món gì (ご注文はお決まりですか？).
  * Lượt 2: Hỏi kích cỡ (S, M, L), uống nóng hay đá (ホット/アイス), độ ngọt hoặc đổi sữa đậu nành.
  * Lượt 3: Giới thiệu món bánh ngọt ăn kèm hôm nay (bánh phô mai nướng, bánh sừng bò).
  * Lượt 4: Xác nhận dùng tại quán (店内) hay mang về (お持ち帰り).
  * Lượt 5: Báo tổng số tiền, hỏi hình thức thanh toán (tiền mặt, thẻ tín dụng, PayPay, Suica).
  * Lượt 6: Giao thẻ rung/hóa đơn, hẹn mang đồ uống ra và chúc quý khách ngon miệng.
- ĐIỀU CẤM KỴ: Không hỏi đời tư, quê quán hay thông tin cá nhân của khách hàng!`
      };
    }

    // 3. CỬA HÀNG TIỆN LỢI / SIÊU THỊ (コンビニ / スーパー)
    if (
      title.includes("tiện lợi") ||
      title.includes("siêu thị") ||
      title.includes("combini") ||
      title.includes("mua sắm") ||
      title.includes("thanh toán") ||
      title.includes("コンビニ") ||
      title.includes("スーパー")
    ) {
      return {
        domain: "CỬA HÀNG TIỆN LỢI & SIÊU THỊ (CONVENIENCE STORE)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là thu ngân tại cửa hàng tiện lợi Nhật Bản.
- BẮT BUỘC ĐI SÂU 100% VÀO QUY TRÌNH MUA HÀNG TẠI QUẦY:
  * Lượt 1: Chào khách, quét mã sản phẩm hoặc chỉ vị trí đồ khách cần tìm.
  * Lượt 2: Hỏi có cần hâm nóng cơm hộp không (お弁当温めますか？).
  * Lượt 3: Hỏi có lấy đũa, muỗng hay ống hút không (お箸やスプーンはおつけしますか？).
  * Lượt 4: Hỏi về túi ni-lông (レジ袋はご利用ですか？).
  * Lượt 5: Hỏi thẻ tích điểm (ポイントカードはお持ちですか？) và tiến hành thanh toán.
  * Lượt 6: Đưa hóa đơn, cảm ơn và hẹn gặp lại (ありがとうございました！またお越しくださいませ)。`
      };
    }

    // 4. GA TÀU / HỎI ĐƯỜNG / ĐI TÀU ĐIỆN (駅 / 道案内 / 電車)
    if (
      title.includes("ga tàu") ||
      title.includes("hỏi đường") ||
      title.includes("đi tàu") ||
      title.includes("tàu điện") ||
      title.includes("chỉ đường") ||
      title.includes("駅") ||
      title.includes("道") ||
      title.includes("電車")
    ) {
      return {
        domain: "GA TÀU & HỎI ĐƯỜNG (TRAIN STATION & DIRECTIONS)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là nhân viên nhà ga (駅員) hoặc người dân địa phương nhiệt tình hỗ trợ hỏi đường.
- BẮT BUỘC ĐI SÂU 100% VÀO HƯỚNG DẪN DI CHUYỂN & TUYẾN ĐƯỜNG:
  * Lượt 1: Xác nhận chính xác điểm đến hành khách muốn đi tới.
  * Lượt 2: Chỉ dẫn tuyến tàu phù hợp, số hiệu đường ray (〇番線) và hướng đi.
  * Lượt 3: Hướng dẫn ga chuyển tuyến (乗り換え) hoặc ga dừng, thời gian di chuyển.
  * Lượt 4: Kiểm tra hành khách đã có thẻ IC (Suica/Pasmo) hay cần mua vé lẻ ở máy tự động.
  * Lượt 5: Chỉ cổng soát vé (改札口) và cửa ra (〇〇出口).
  * Lượt 6: Chúc hành khách lên đường bình an, thuận lợi (お気をつけて！).`
      };
    }

    // 5. PHỎNG VẤN XIN VIỆC / PART-TIME / ARUBAITO (面接 / アルバイト / 仕事)
    if (
      title.includes("phỏng vấn") ||
      title.includes("xin việc") ||
      title.includes("arubaito") ||
      title.includes("part-time") ||
      title.includes("làm thêm") ||
      title.includes("面接") ||
      title.includes("採用")
    ) {
      return {
        domain: "PHỎNG VẤN XIN VIỆC / PART-TIME (JOB INTERVIEW)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là người phỏng vấn / quản lý cửa hàng (店長/面接官) đang phỏng vấn ứng viên.
- BẮT BUỘC ĐI SÂU 100% VÀO QUY TRÌNH PHỎNG VẤN CHUYÊN NGHIỆP:
  * Lượt 1: Mời ứng viên ngồi, lắng nghe phần giới thiệu bản thân ngắn gọn.
  * Lượt 2: Hỏi lý do ứng tuyển (志望動機: "どうしてうちのお店で働きたいと思いましたか？").
  * Lượt 3: Hỏi kinh nghiệm làm việc hoặc kỹ năng liên quan trước đây.
  * Lượt 4: Hỏi về ca làm việc (シフト): "Một tuần bạn có thể làm được mấy buổi? Làm được cuối tuần không?"
  * Lượt 5: Hỏi điểm mạnh nổi bật của ứng viên (長所・自己PR).
  * Lượt 6: Thông báo thời gian liên hệ báo kết quả (trong vòng 3-5 ngày) và cảm ơn ứng viên đã tới phỏng vấn.`
      };
    }

    // 6. BỆNH VIỆN / KHÁM BỆNH / NHÀ THUỐC (病院 / 薬局 / 体調)
    if (
      title.includes("bệnh viện") ||
      title.includes("khám bệnh") ||
      title.includes("bác sĩ") ||
      title.includes("nhà thuốc") ||
      title.includes("sức khỏe") ||
      title.includes("病院") ||
      title.includes("クリニック") ||
      title.includes("体調")
    ) {
      return {
        domain: "KHÁM BỆNH & CHĂM SÓC SỨC KHỎE (HOSPITAL & CLINIC)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là bác sĩ (hoặc dược sĩ) người Nhật đang thăm khám cho bệnh nhân.
- BẮT BUỘC ĐI SÂU 100% VÀO CHẨN ĐOÁN TRIỆU CHỨNG & HƯỚNG DẪN ĐIỀU TRỊ:
  * Lượt 1: Hỏi thăm triệu chứng: "どうされましたか？どこが痛い/苦しいですか？"
  * Lượt 2: Hỏi triệu chứng bắt đầu từ bao giờ (いつ頃からですか？).
  * Lượt 3: Hỏi có sốt, ho, đau đầu hay buồn nôn không (熱は測りましたか？).
  * Lượt 4: Hỏi tiền sử dị ứng thuốc (薬のアレルギーはありますか？).
  * Lượt 5: Giải thích đơn thuốc, hướng dẫn uống thuốc sau ăn (食後) và nghỉ ngơi đầy đủ.
  * Lượt 6: Dặn dò tái khám nếu sau vài ngày không đỡ, chúc bệnh nhân sớm khỏe lại (お大事にどうぞ).`
      };
    }

    // 7. CUỘC SỐNG VÀ THÓI QUEN HÀNG NGÀY (毎日の生活 / 習慣 / 一日の過ごし方)
    if (
      title.includes("cuộc sống") ||
      title.includes("thói quen") ||
      title.includes("hàng ngày") ||
      title.includes("thường nhật") ||
      title.includes("生活") ||
      title.includes("習慣") ||
      title.includes("毎日の生活")
    ) {
      return {
        domain: "CUỘC SỐNG & THÓI QUEN HÀNG NGÀY (DAILY LIFE & HABITS)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là người bạn trò chuyện thân tình, quan tâm tìm hiểu về nhịp sống và thói quen sinh hoạt của nhau.
- BẮT BUỘC ĐI SÂU 100% VÀO THỜI GIAN BIỂU & NHỊP SỐNG HÀNG NGÀY (LINH HOẠT THEO CÂU TRẢ LỜI CỦA NGƯỜI HỌC):
  * Lượt 1: Hỏi về thói quen buổi sáng: thức dậy lúc mấy giờ (何時に起きますか？) và việc đầu tiên làm sau khi thức dậy.
  * Lượt 2: Hỏi về bữa sáng và cách di chuyển: thường ăn sáng món gì, đi học/đi làm bằng phương tiện gì (電車/バス/自転車/徒歩).
  * Lượt 3: Hỏi về nhịp làm việc / học tập trong ngày: thường bắt đầu và kết thúc lúc mấy giờ, bữa trưa ăn ở đâu (căng tin/tự mang bento).
  * Lượt 4: Hỏi về hoạt động sau khi tan sở / tan học: có tự nấu ăn (自炊) hay đi siêu thị mua đồ, có tập thể dục hay dạo phố không.
  * Lượt 5: Hỏi về cách thư giãn buổi tối trước khi đi ngủ: nghe nhạc, xem phim, đọc sách, và thường đi ngủ lúc mấy giờ (何時に寝ますか？).
  * Lượt 6: Đúc kết cuộc trò chuyện ấm áp, chia sẻ sự đồng điệu về thói quen lành mạnh và chúc nhau có một ngày thật tốt lành!`
      };
    }

    // 8. BÁO CÁO CÔNG VIỆC HORENSO / DOANH NGHIỆP (ビジネス会話 / 進捗報告 / ほうれんそう)
    if (
      title.includes("tiến độ") ||
      title.includes("báo cáo") ||
      title.includes("horenso") ||
      title.includes("công việc") ||
      title.includes("kinh doanh") ||
      title.includes("進捗") ||
      title.includes("報告") ||
      title.includes("ビジネス")
    ) {
      return {
        domain: "BÁO CÁO TIẾN ĐỘ CÔNG VIỆC & HORENSO (BUSINESS & PROGRESS REPORT)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là Trưởng phòng / Quản lý dự án (課長/リーダー) chuyên nghiệp, lắng nghe báo cáo tiến độ dự án từ cấp dưới.
- BẮT BUỘC SỬ DỤNG VÀ THỰC HÀNH KÍNH NGỮ CÔNG SỞ (SONKEIGO / KENJOUGO / TEINEIGO):
  * Lượt 1: Chào hỏi công sở (お疲れ様です), hỏi tình hình tiến độ dự án/nhiệm vụ được giao (進捗状況はどうなっていますか？).
  * Lượt 2: Xác nhận tỷ lệ phần trăm hoàn thành (何％くらい完了していますか？) và các hạng mục đã hoàn tất thuận lợi.
  * Lượt 3: Hỏi sâu về các vấn đề phát sinh, rủi ro kỹ thuật hoặc vướng mắc cần hỗ trợ (何か課題や問題点はありますか？).
  * Lượt 4: Trao đổi về phương án giải quyết (対策), kiểm tra việc phối hợp/thống nhất với các bên liên quan (擦り合わせ/連絡).
  * Lượt 5: Chốt thời hạn deadline hoặc lịch deploy/báo cáo tiếp theo (金曜日のデプロイ/次回のミーティング).
  * Lượt 6: Đánh giá cao tinh thần trách nhiệm của cấp dưới, động viên và nhắc nhở giữ gìn sức khỏe (引き続きよろしくお願いします/無理しないでくださいね).`
      };
    }

    // 9. QUÁN NHẬU IZAKAYA / RỦ NHAU ĐI ĂN (居酒屋 / 乾杯 / 食事の誘い / 飲み会)
    if (
      title.includes("izakaya") ||
      title.includes("quán nhậu") ||
      title.includes("đi ăn") ||
      title.includes("nâng ly") ||
      title.includes("kanpai") ||
      title.includes("rủ bạn") ||
      title.includes("居酒屋") ||
      title.includes("乾杯") ||
      title.includes("飲み")
    ) {
      return {
        domain: "QUÁN NHẬU IZAKAYA & GIAO LƯU SAU GIỜ LÀM (IZAKAYA & SOCIAL DINING)",
        rules: `
- BỐI CẢNH VAI DIỄN: Bạn là đồng nghiệp/bạn bè thân thiết người Nhật rủ nhau đi xả hơi sau giờ làm việc.
- BẮT BUỘC ĐI SÂU 100% VÀO VĂN HÓA GIAO LƯU & THƯỞNG THỨC ẨM THỰC TẠI QUÁN NHẬU IZAKAYA:
  * Lượt 1: Sau giờ làm việc vất vả, rủ bạn đi làm một ly/ăn tối ở quán Izakaya gần ga (仕事終わりに軽く一杯どうですか？).
  * Lượt 2: Bước vào quán, hỏi bạn uống gì trước (món đầu tiên thường là bia tươi "とりあえず生ビール" hoặc nước ngọt).
  * Lượt 3: Nâng ly chúc mừng sau ngày làm việc vất vả: "お疲れ様でした！乾杯！(Kanpai!)".
  * Lượt 4: Xem menu gọi món nhắm đặc trưng: gà xiên nướng (焼き鳥), đậu nành luộc (枝豆), sashimi, trứng cuộn (だし巻き玉子).
  * Lượt 5: Trò chuyện vui vẻ về công việc/đời sống, hỏi cảm nhận về món ăn và không khí náo nhiệt của quán nhậu Nhật.
  * Lượt 6: Thảo luận việc thanh toán (chia tiền kiểu Nhật Warikan "割り勘" hoặc một bên mời), hẹn lần sau lại cùng tụ tập.`
      };
    }

    // MẶC ĐỊNH CHO CÁC CHỦ ĐỀ KHÁC
    return {
      domain: (scenarioTitle || "HỘI THOẠI").toUpperCase(),
      rules: `
- BỐI CẢNH VAI DIỄN: Đóng vai nhân vật tương tác trực tiếp trong bối cảnh "${scenarioTitle}".
- BẮT BUỘC ĐI SÂU VÀO TRỌNG TÂM CỦA CHỦ ĐỀ: Mọi câu hỏi tiếp nối PHẢI bám sát vào ngữ cảnh cụ thể của "${scenarioTitle}". Tuyệt đối không được nhảy sang các câu hỏi chung chung không liên quan đến tình huống!`
    };
  }

  /**
   * Prompt builder for Roleplay with strict conversation flow & off-topic clarification
   */
  static buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage, userName = "Học viên" }) {
    const formattedHistory = (conversationHistory || [])
      .slice(-10)
      .map((msg) => `${msg.sender === "ai" ? "Character (AI)" : "Learner"}: "${msg.japanese}"`)
      .join("\n");

    const userTurnsCount = (conversationHistory || []).filter(
      (m) => m.sender === "user" || m.role === "user"
    ).length + 1;

    const domainGuidance = this.getScenarioDomainGuidance(scenarioTitle);
    const identity = getLearnerJapaneseIdentity(userName);

    return `
Hãy đóng vai nhân vật bản ngữ tiếng Nhật trong tình huống giao tiếp: "${scenarioTitle}".
Trình độ người học: JLPT ${level}.
Lượt đối đáp hiện tại của người học: Lượt thứ ${userTurnsCount} (Mục tiêu phiên đàm thoại Kaiwa: 6-8 lượt).

==================================================
THÔNG TIN HỌ TÊN VÀ DANH XƯNG NGƯỜI HỌC (LEARNER IDENTITY):
- Họ và tên người học: "${userName}"
- Tên gọi riêng (Given Name): "${identity.givenName}"
- Tên phiên âm Katakana chuẩn tiếng Nhật: "${identity.katakanaName}" (Họ tên đầy đủ Katakana: "${identity.katakanaFullName}")
- Romaji: "${identity.romajiName}"
- Cách gọi xưng hô tự nhiên của người Nhật: "${identity.callingName}" (${identity.callingNameRomaji})
==================================================

==================================================
CHỈ DẪN TRỌNG TÂM THEO BỐI CẢNH CHỦ ĐỀ (DOMAIN FOCUS GUIDE):
Chủ đề chuyên biệt: ${domainGuidance.domain}
${domainGuidance.rules}
==================================================

QUY TẮC CỐT LÕI (TUYỆT ĐỐI TUÂN THỦ):
1. CÁ NHÂN HÓA DANH XƯNG VÀ HỌ TÊN NGƯỜI HỌC THEO TÌNH HUỐNG (STRICT PERSONALIZED NAME USAGE):
   - Xưng hô trong hội thoại: Bạn là người Nhật bản xứ lịch sự và thân thiện. Khi chào hỏi, đặt câu hỏi hoặc khích lệ, bạn NÊN gọi người học bằng danh xưng lịch thiệp: "${identity.callingName}" (Ví dụ: 「${identity.callingName}、こんにちは！」「${identity.callingName}はどう思いますか？」).
   - Tình huống liên quan đến TÊN (như Tự giới thiệu bản thân 自己紹介, Làm quen trong lớp học mới, Phỏng vấn xin việc 面接, hoặc khi bạn hỏi tên người học):
     * Trong các câu gợi ý trả lời ("suggestedAnswers"): BẮT BUỘC sử dụng chính xác tên của người học là "${identity.katakanaName}" (hoặc "${identity.katakanaFullName}"), TUYỆT ĐỐI KHÔNG dùng tên ngẫu nhiên hay tên người khác (như "Nam", "Tanaka")!
     * Ví dụ gợi ý phản xạ khi hỏi/giới thiệu tên:
       + 「初めまして！私の名前は${identity.katakanaName}です。よろしくお願いします！」
       + 「${identity.katakanaName}と申します。ベトナムから来ました。どうぞよろしくお願いします！」
       + 「${identity.katakanaName}と呼んでください。」

2. BÁM SÁT TRỌNG TÂM CHỦ ĐỀ NHƯNG KHÔNG ĐƯỢC RẬP KHUÔN, ĐA DẠNG HÓA TÌNH HUỐNG (STRICT TOPIC FOCUS WITH HIGH ADAPTIVE DIVERSITY):
   - Mọi câu hỏi tiếp theo của bạn PHẢI bám sát vào bối cảnh "${scenarioTitle}" và chỉ dẫn ở trên.
   - TUYỆT ĐỐI KHÔNG nhảy sang các câu hỏi vu vơ không liên quan (như hỏi về thời tiết hay ẩm thực quê hương khi đang ở trong lớp học hoặc đang phỏng vấn).
   - TUYỆT ĐỐI KHÔNG TRẢ LỜI NHƯ ROBOT ĐỌC KỊCH BẢN CỨNG NHẮC! Hãy lắng nghe thật sự (Active Listening) và phản xạ sinh động dựa trên điều cụ thể người học vừa nói:
     * Nếu người học chia sẻ điều gì thú vị, độc đáo (thức dậy sớm chạy bộ, thích uống trà ô long thay vì bia, thích học qua flashcard...), AI hãy biểu lộ cảm xúc ngạc nhiên, đồng cảm (Aizuchi: 「へえ、そうなんですか！」「それは素晴らしいですね！」) và đào sâu vào chi tiết đó.
     * Nếu người học từ chối lịch sự (bận, không uống được rượu, chưa làm xong...), AI phải thấu hiểu và thích ứng linh hoạt theo hướng giải quyết mới, KHÔNG gượng ép người học vào khuôn mẫu định sẵn!

3. TIẾN TRÌNH HỘI THOẠI & TUYỆT ĐỐI KHÔNG LẶP LẠI CÂU HỎI CŨ (ANTI-REPETITION):
   - TUYỆT ĐỐI KHÔNG lặp lại câu hỏi mở đầu hoặc bất kỳ câu hỏi nào bạn/nhân vật đã từng hỏi trong lịch sử trò chuyện.
   - Hãy đào sâu (follow-up) vào câu trả lời của người học thay vì nhảy chủ đề đột ngột hoặc hỏi lại cái cũ.
   - Mỗi lượt hội thoại phải phát triển câu chuyện tiến lên một bước mới theo lộ trình bối cảnh.

4. ĐỘ DÀI & KẾT THÚC HỘI THOẠI HỢP LÝ:
   - Nếu lượt hiện tại < 6: Tiếp tục duy trì hội thoại, hỏi mở rộng sang khía cạnh tiếp theo của chủ đề. Đặt "isFinished": false.
   - Nếu lượt hiện tại >= 6 hoặc người học ngỏ ý chào tạm biệt: AI đưa ra câu đúc kết ấm áp, khen ngợi tinh thần học tập, chào tạm biệt và hẹn gặp lại đúng chuẩn văn hóa Nhật. Đặt "isFinished": true.

5. XỬ LÝ KHI NGƯỜI HỌC TRẢ LỜI LINH TINH / LẠC ĐỀ / KHÔNG HIỂU / CÂU VÔ NGHĨA:
   - Nếu câu người học vừa nói ("${userMessage}") không ăn nhập với câu hỏi trước, nói lạc đề, hoặc là từ ngữ vô nghĩa:
     * AI TUYỆT ĐỐI KHÔNG quay lại câu hỏi ban đầu và KHÔNG giả vờ như đã hiểu.
     * AI PHẢI phản xạ bằng câu nghi vấn làm rõ hoặc ngạc nhiên lịch sự (Clarifying / Puzzled questions) như người Nhật ngoài đời:
       Ví dụ:
       + 「えっ、すみません、よく聞き取れなかったのですが、もう一度言っていただけますか？」(Ủa, xin lỗi tôi chưa nghe rõ lắm, bạn có thể nói lại một lần nữa được không?)
       + 「あれ？急にどうしたんですか？今の話と少し違うような気がしますが…」(Ủa? Sao tự nhiên lại vậy ta? Hình như hơi khác chủ đề chúng ta đang nói một chút thì phải…)
       + 「すみません、それはどういう意味ですか？もう少し分かりやすく教えてくれますか？」(Xin lỗi, điều đó nghĩa là gì vậy ạ? Bạn có thể giải thích dễ hiểu hơn một chút được không?)
     * Trong "userEvaluation": Chấm điểm naturalnessScore thấp hơn (35-55), grammarAdvice giải thích nhẹ nhàng bằng tiếng Việt rằng câu nói chưa phù hợp hoặc lạc đề, gợi ý câu trả lời đúng trọng tâm.
     * Trong "suggestedAnswers": Cung cấp 2-3 câu trả lời mẫu đúng trọng tâm ngữ cảnh để hỗ trợ người học lấy lại mạch đối thoại.

6. KHI NGƯỜI HỌC TRẢ LỜI TỰ NHIÊN VÀ ĐÚNG TRỌNG TÂM:
   - AI đáp lại bằng từ đệm cảm thán (Aizuchi: 「そうなんですね！」「なるほど！」「いいですね！」...) và hỏi tiếp 1 câu mở rộng/đào sâu vào đúng chủ đề.
   - Câu trả lời của AI ngắn gọn (1-2 câu tiếng Nhật), tự nhiên, chuẩn giao tiếp bản xứ ${level}.

7. ĐÁNH GIÁ CÂU NGƯỜI HỌC VỪA NÓI (userEvaluation):
   - naturalnessScore: Chấm điểm độ tự nhiên (0-100).
   - grammarAdvice: Nhận xét ngắn gọn, thực tế bằng tiếng Việt.
   - betterExpression: Gợi ý cách diễn đạt tự nhiên hơn của người bản xứ (nếu có).
   - betterExpressionFurigana: Phiên âm Hiragana/Katakana cho toàn bộ chữ Hán trong betterExpression.

8. GỢI Ý 2-3 CÂU TRẢ LỜI TIẾP THEO (suggestedAnswers) - ĐA DẠNG SẮC THÁI, KHÔNG RẬP KHUÔN:
   - Gợi ý trong "suggestedAnswers" PHẢI là câu trả lời trực tiếp cho câu hỏi mà AI vừa hỏi trong "aiReply", nhưng BẮT BUỘC mang nhiều lựa chọn đa dạng cho người học:
     * 1 gợi ý: Trả lời đồng ý / tích cực / hào hứng.
     * 1 gợi ý: Trả lời chi tiết hơn, nêu lý do hoặc thói quen cụ thể của bản thân.
     * 1 gợi ý: Trả lời theo hướng khác (từ chối lịch sự, đề xuất phương án thay thế hoặc hỏi ngược lại AI để cuộc trò chuyện có tính tương tác 2 chiều).
   - Mỗi câu gợi ý BẮT BUỘC có đủ: japanese, furigana (toàn bộ chữ Hán có phiên âm Hiragana), romaji, translation (tiếng Việt).

Lịch sử trò chuyện gần nhất:
${formattedHistory || "(Bắt đầu cuộc trò chuyện)"}

Câu người học vừa nói: "${userMessage}"

Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown ngoài json):
{
  "aiReply": {
    "japanese": "Câu tiếng Nhật nhân vật đáp lại (ngắn gọn, tự nhiên, không lặp lại câu hỏi cũ)",
    "furigana": "Phiên âm toàn bộ chữ Hán sang Hiragana/Katakana",
    "romaji": "Romaji phiên âm Latin",
    "translation": "Bản dịch tiếng Việt tự nhiên"
  },
  "isFinished": false,
  "userEvaluation": {
    "naturalnessScore": 88,
    "grammarAdvice": "Nhận xét ngắn bằng tiếng Việt về câu nói của bạn",
    "betterExpression": "Mẫu câu tự nhiên hơn",
    "betterExpressionFurigana": "Phiên âm Hiragana/Katakana cho mẫu câu tự nhiên hơn"
  },
  "suggestedAnswers": [
    {
      "japanese": "...",
      "furigana": "...",
      "romaji": "...",
      "translation": "..."
    }
  ]
}
`;
  }

  /**
   * Safely parse Roleplay JSON and normalize suggestedAnswers
   */
  static parseRoleplayJson(rawText, scenarioTitle, level, conversationHistory, userMessage, userName = "Học viên") {
    try {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed) {
        parsed.isFinished = Boolean(parsed.isFinished);
      }

      if (parsed && parsed.suggestedAnswers && Array.isArray(parsed.suggestedAnswers)) {
        parsed.suggestedAnswers = parsed.suggestedAnswers.map((item) => {
          if (typeof item === "string") {
            return {
              japanese: item,
              furigana: item,
              romaji: "",
              translation: "",
            };
          }
          return {
            japanese: item.japanese || "",
            furigana: item.furigana || item.japanese || "",
            romaji: item.romaji || "",
            translation: item.translation || "",
          };
        });
      }

      return parsed;
    } catch {
      return this.roleplayHeuristically({ scenarioTitle, level, conversationHistory, userMessage, userName });
    }
  }

  /**
   * Dynamic Heuristic Roleplay Fallback (Zero external cost / offline resilient / turn-aware progression)
   */
  static roleplayHeuristically({ scenarioTitle = "", level = "N5", conversationHistory = [], userMessage = "", userName = "Học viên" }) {
    const cleanMsg = (userMessage || "").trim().toLowerCase();
    const userTurns = (conversationHistory || []).filter(
      (m) => m.sender === "user" || m.role === "user"
    ).length;
    const currentTurn = userTurns + 1; // 1, 2, 3, 4...
    const identity = getLearnerJapaneseIdentity(userName);

    // 1. Phán đoán nếu câu trả lời của người học là vô nghĩa, linh tinh, quá ngắn hoặc lạc đề hoàn toàn
    const isTooShortOrGibberish =
      cleanMsg.length < 2 ||
      /^[^a-zA-Z0-9぀-ゟ゠-ヿ一-龯]+$/.test(cleanMsg) ||
      /^(.)\1{3,}$/.test(cleanMsg) ||
      /^(alo|test|asdf|haha|kkk|ko|khong|sao the|gi day|gi vay)/i.test(cleanMsg);

    if (isTooShortOrGibberish) {
      return {
        aiReply: {
          japanese: "えっ、すみません、よく聞き取れなかったのですが、もう一度言っていただけますか？",
          furigana: "えっ、すみません、よくききとれなかったのですが、もういちどいっていただけますか？",
          romaji: "E', sumimasen, yoku kikitorenakatta no desu ga, mou ichido itte itadakemasu ka?",
          translation: "Ủa, xin lỗi tôi chưa nghe rõ lắm, bạn có thể nhắc lại một lần nữa được không?",
        },
        userEvaluation: {
          naturalnessScore: 45,
          grammarAdvice:
            "Câu trả lời của bạn dường như chưa rõ nghĩa hoặc chưa khớp với ngữ cảnh hội thoại. Hãy thử trả lời to, rõ ràng bằng các mẫu câu tiếng Nhật gợi ý bên dưới nhé.",
          betterExpression: "もう一度お願いします。(Làm ơn nói lại một lần nữa ạ)",
          betterExpressionFurigana: "もういちどおねがいします。",
        },
        suggestedAnswers: [
          {
            japanese: "はい、もう一度言いますね。",
            furigana: "はい、もういちどいいますね。",
            romaji: "Hai, mou ichido iimasu ne.",
            translation: "Vâng, để tôi nói lại một lần nữa nhé.",
          },
          {
            japanese: "すみません、日本語でどう言えばいいですか？",
            furigana: "すみません、にほんごでどういえばいいですか？",
            romaji: "Sumimasen, Nihongo de dou ieba ii desu ka?",
            translation: "Xin lỗi, câu này trong tiếng Nhật nói thế nào vậy ạ?",
          },
        ],
      };
    }

    // 2. Kịch bản: Tự giới thiệu / Lớp học mới / Chào hỏi làm quen (自己紹介 / クラス / 友達)
    if (
      scenarioTitle.includes("自己紹介") ||
      scenarioTitle.includes("クラス") ||
      scenarioTitle.includes("友達") ||
      scenarioTitle.includes("初めまして") ||
      /giới thiệu|chào hỏi|lớp học|bạn bè|làm quen/i.test(scenarioTitle)
    ) {
      // Lượt 1: Chào đón vào lớp học mới, hỏi tên bạn mới
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "初めまして！今日からこのクラスですね。お会いできて嬉しいです！お名前は何とお呼びすればいいですか？",
            furigana: "はじめまして！きょうからこのクラスですね。おあいできてうれしいです！おなまえはなんとおよびすればいいですか？",
            romaji: "Hajimemashite! Kyou kara kono kurasu desu ne. Oai dekite ureshii desu! Onamae wa nan to oyobi sureba ii desu ka?",
            translation: "Chào bạn mới! Từ hôm nay chúng mình học chung lớp này rồi. Rất vui được gặp bạn! Mình có thể gọi bạn là gì nhỉ?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 92,
            grammarAdvice: "Lời chào hỏi và xưng tên rất tự nhiên, đúng lễ nghi giao tiếp lớp học của người Nhật.",
            betterExpression: "初めまして、どうぞよろしくお願いします。",
            betterExpressionFurigana: "はじめまして、どうぞよろしくおねがいします。",
          },
          suggestedAnswers: [
            {
              japanese: `初めまして！私の名前は${identity.katakanaName}です。ベトナムから来ました。よろしくお願いします！`,
              furigana: `はじめまして！わたしのなまえは${identity.katakanaName}です。ベトナムからきました。よろしくおねがいします！`,
              romaji: `Hajimemashite! Watashi no namae wa ${identity.romajiName} desu. Betonamu kara kimashita. Yoroshiku onegaishimasu!`,
              translation: `Rất vui được gặp bạn! Tên tôi là ${identity.givenName}, tôi đến từ Việt Nam. Rất mong được giúp đỡ!`,
            },
            {
              japanese: `${identity.katakanaName}と申します。今日からこのクラスでお世話になります。どうぞよろしくお願いします。`,
              furigana: `${identity.katakanaName}ともうします。きょうからこのクラスでおせわになります。どうぞよろしくおねがいします。`,
              romaji: `${identity.romajiName} to moushimasu. Kyou kara kono kurasu de osewa ni narimasu. Douzo yoroshiku onegaishimasu.`,
              translation: `Tôi tên là ${identity.givenName}. Từ hôm nay tôi sẽ học cùng mọi người ở lớp này. Rất mong được chỉ giáo thêm ạ.`,
            },
          ],
        };
      }

      // Lượt 2: Hỏi về thời gian học tiếng Nhật & ấn tượng lớp học mới
      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: `${identity.callingName}、よろしくお願いします！日本語の勉強はいつから始めましたか？この新しいクラスの雰囲気はどうですか？`,
            furigana: `${identity.callingName}、よろしくおねがいします！にほんごのべんきょうはいつからはじめましたか？このあたらしいクラスのふんいきはどうですか？`,
            romaji: `${identity.callingNameRomaji}, yoroshiku onegaishimasu! Nihongo no benkyou wa itsu kara hajimemashita ka? Kono atarashii kurasu no fuuniki wa dou desu ka?`,
            translation: `Chào ${identity.givenName}, rất vui được làm quen với bạn! Bạn bắt đầu học tiếng Nhật từ khi nào thế? Bạn thấy không khí lớp học mới này thế nào?`,
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 92,
            grammarAdvice: "Xưng tên và giới thiệu bản thân rất tự nhiên, lễ phép đúng chuẩn người học tiếng Nhật.",
            betterExpression: `${userMessage}。今日からよろしくお願いします。`,
            betterExpressionFurigana: `${userMessage}。きょうからよろしくおねがいします。`,
          },
          suggestedAnswers: [
            {
              japanese: "3ヶ月前から勉強を始めました。クラスの皆さんが親切で安心しました。",
              furigana: "さんかげつまえからべんきょうをはじめました。クラスのみなさんがしんせつであんしんしました。",
              romaji: "San-kagetsu mae kara benkyou o hajimemashita. Kurasu no minasan ga shinsetsu de anshin shimashita.",
              translation: "Tôi bắt đầu học từ 3 tháng trước. Mọi người trong lớp đều rất thân thiện nên tôi cũng yên tâm rồi.",
            },
            {
              japanese: "ベトナムで半年ほど勉強してきました。少し緊張していますが、とても楽しみです。",
              furigana: "ベトナムではんとしほどべんきょうしてきました。すこしきんちょうしていますが、とてもたのしみです。",
              romaji: "Betonamu de hantoshi hodo benkyou shite kimashita. Sukoshi kinchou shite imasu ga, totemo tanoshimi desu.",
              translation: "Tôi đã học khoảng nửa năm ở Việt Nam. Tuy có chút hồi hộp nhưng tôi rất hào hứng.",
            },
          ],
        };
      }

      // Lượt 3: Hỏi sâu về các kỹ năng tiếng Nhật trong lớp (Kanji, Nghe hay Hội thoại)
      if (currentTurn === 3) {
        return {
          aiReply: {
            japanese: "なるほど！日本語の勉強で、漢字やリスニング、会話の中でどれが一番難しいと感じますか？",
            furigana: "なるほど！にほんごのべんきょうで、かんじやリスニング、かいわのなかでどれがいちばんむずかしいとかんじますか？",
            romaji: "Naruhodo! Nihongo no benkyou de, kanji ya risuningu, kaiwa no naka de dore ga ichiban muzukashii to kanjimasu ka?",
            translation: "Thì ra là vậy! Trong quá trình học tiếng Nhật, giữa chữ Hán (Kanji), luyện nghe và hội thoại thì bạn thấy phần nào khó nhất?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 91,
            grammarAdvice: "Dùng mốc thời gian và tính từ miêu tả ấn tượng lớp học rất chuẩn xác.",
            betterExpression: `${userMessage}。これからの授業がとても楽しみです。`,
            betterExpressionFurigana: `${userMessage}。これからのじゅぎょうがとてもたのしみです。`,
          },
          suggestedAnswers: [
            {
              japanese: "漢字を覚えるのが一番難しいです。似ている形が多くて大変です。",
              furigana: "かんじをおぼえるのがいちばんむずかしいです。にているかたちがおおくてたいへんです。",
              romaji: "Kanji o oboeru no ga ichiban muzukashii desu. Nite iru katachi ga ookute taihen desu.",
              translation: "Ghi nhớ chữ Hán là khó nhất. Có nhiều chữ hình dáng na ná nhau nên rất vất vả.",
            },
            {
              japanese: "リスニングと会話が難しいです。ネイティブのスピードについていくのがまだ大変です。",
              furigana: "リスニングとかいわがむずかしいです。ネイティブのスピードについていくのがまだたいへんです。",
              romaji: "Risuningu to kaiwa ga muzukashii desu. Neitibu no supiido ni tsuite iku no ga mada taihen desu.",
              translation: "Luyện nghe và hội thoại là khó nhất. Bắt kịp tốc độ của người bản xứ vẫn còn hơi khó với tôi.",
            },
          ],
        };
      }

      // Lượt 4: Trao đổi về phương pháp học tập hiệu quả (Flashcard, Shadowing, xem anime)
      if (currentTurn === 4) {
        return {
          aiReply: {
            japanese: "よく分かります！私も最初は苦労しました。普段はどうやって日本語を勉強していますか？おすすめの勉強法はありますか？",
            furigana: "よくわかります！わたしもさいしょはくろうしました。ふだんはどうやってにほんごをべんきょうしていますか？おすすめのべんきょうほうはありますか？",
            romaji: "Yoku wakarimasu! Watashi mo saisho wa kurou shimashita. Fudan wa dou yatte Nihongo o benkyou shite imasu ka? Osusume no benkyouhou wa arimasu ka?",
            translation: "Mình rất đồng cảm! Hồi đầu mình cũng thấy khó khăn lắm. Thường ngày bạn hay học tiếng Nhật theo cách nào? Bạn có phương pháp học nào hiệu quả không?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 93,
            grammarAdvice: "Dùng cấu trúc so sánh hơn nhất '～が一番難しい' rất chuẩn xác và tự nhiên.",
            betterExpression: `${userMessage}。毎日少しずつ練習しています。`,
            betterExpressionFurigana: `${userMessage}。まいにちすこしずつれんしゅうしています。`,
          },
          suggestedAnswers: [
            {
              japanese: "私は単語カード（フラッシュカード）アプリを使って、毎日すきま時間に復習しています。",
              furigana: "わたしはたんごカード（フラッシュカード）アプリをつかって、まいにちすきまじかんにふくしゅうしています。",
              romaji: "Watashi wa tango kaado (furasshu kaado) apuri o tsukatte, mainichi sukima jikan ni fukushuu shite imasu.",
              translation: "Tôi dùng app thẻ từ vựng flashcard để tranh thủ ôn tập mỗi khi có thời gian rảnh rỗi.",
            },
            {
              japanese: "好きなアニメやドラマを日本語の字幕で見たり、シャドーイングの練習をしています。",
              furigana: "すきなアニメやドラマをにほんごのじまくでみたり、シャドーイングのれんしゅうをしています。",
              romaji: "Suki na anime ya dorama o Nihongo no jimaku de mitari, shadooingu no renshuu o shite imasu.",
              translation: "Tôi xem anime hay phim Nhật với phụ đề tiếng Nhật và luyện tập phương pháp Shadowing.",
            },
          ],
        };
      }

      // Lượt 5: Rủ rê học nhóm sau giờ học tại thư viện & cùng nhau ôn bài
      if (currentTurn === 5) {
        return {
          aiReply: {
            japanese: "とても素晴らしい勉強法ですね！もしよかったら、放課後一緒に図書館で今日の授業の復習をしませんか？",
            furigana: "とてもすばらしいべんきょうほうですね！もしよかったら、ほうかごいっしょにとしょかんできょうのじゅぎょうのふくしゅうをしませんか？",
            romaji: "Totemo subarashii benkyouhou desu ne! Moshi yokattara, houkago issho ni toshokan de kyou no jugyou no fukushuu o shimasen ka?",
            translation: "Cách học đó hay quá! Nếu bạn rảnh, sau giờ học chiều nay tụi mình cùng nhau lên thư viện ôn lại bài học hôm nay nhé?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 94,
            grammarAdvice: "Diễn đạt phương pháp học tập phong phú, dùng trợ từ và động từ rất chính xác.",
            betterExpression: `${userMessage}。とても効果的な勉強法だと思います。`,
            betterExpressionFurigana: `${userMessage}。とてもこうかてきなべんきょうほうだとおもいます。`,
          },
          suggestedAnswers: [
            {
              japanese: "ぜひ一緒にお願いします！分からない文法を教えてもらえると嬉しいです。",
              furigana: "ぜひいっしょにおねがいします！わからないぶんぽうをおしえてもらえるとうれしいです。",
              romaji: "Zehi issho ni onegaishimasu! Wakaranai bumpou o oshiete moraeru to ureshii desu.",
              translation: "Nhất định rồi, cho mình học cùng với! Nếu có ngữ pháp nào chưa hiểu thì nhờ bạn chỉ giúp nhé.",
            },
            {
              japanese: "はい、喜んで！一人で勉強するより、一緒に復習した方がモチベーションが上がりますね。",
              furigana: "はい、よろこんで！ひとりでべんきょうするより、いっしょにふくしゅうしたほうがモチベーションがあがりますね。",
              romaji: "Hai, yorokonde! Hitori de benkyou suru yori, issho ni fukushuu shita hou ga mochibeeshon ga agarimasu ne.",
              translation: "Vâng, mình rất sẵn lòng! Học cùng nhau chắc chắn sẽ có nhiều động lực hơn tự học một mình.",
            },
          ],
        };
      }

      // Lượt 6+ (Closing Turn - Kết thúc hội thoại tự nhiên & Hẹn nhau học nhóm)
      return {
        aiReply: {
          japanese: "よかった！では今日の授業が終わったら、図書館の前のロビーで待ち合わせしましょうね。これから一緒にJLPT合格目指して頑張りましょう！",
          furigana: "よかった！できょうのじゅぎょうがおわったら、としょかんのまえのロビーでまちあわせしましょうね。これからいっしょにジェイエルピーティーごうかくめざしてがんばりましょう！",
          romaji: "Yokatta! Dewa kyou no jugyou ga owattara, toshokan no mae no robii de machiawase shimashou ne. Korekara issho ni JLPT goukaku mezashite gambarimashou!",
          translation: "Tuyệt quá! Vậy lát tan học tụi mình hẹn nhau ở sảnh trước thư viện nhé. Từ nay cùng nhau cố gắng để đỗ JLPT nhé bạn hiền!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 96,
          grammarAdvice: "Cuộc đối thoại hoàn chỉnh xuất sắc! Bạn tương tác tự nhiên, kết nối bạn bè thành công trong lớp học.",
          betterExpression: "はい！約束ですね。後ほどよろしくお願いします！",
          betterExpressionFurigana: "はい！やくそくですね。のちほどよろしくおねがいします！",
        },
        suggestedAnswers: [
          {
            japanese: "はい！約束ですね。後ほどよろしくお願いします！",
            furigana: "はい！やくそくですね。のちほどよろしくおねがいします！",
            romaji: "Hai! Yakusoku desu ne. Nochihodo yoroshiku onegaishimasu!",
            translation: "Vâng! Đã hẹn rồi nhé. Lát nữa gặp lại nhờ bạn giúp đỡ nhé!",
          },
          {
            japanese: "楽しみにしています！今日も授業を頑張りましょう！",
            furigana: "たのしみにしています！きょうもじゅぎょうをがんばりましょう！",
            romaji: "Tanoshimi ni shite imasu! Kyou mo jugyou o gambarimashou!",
            translation: "Mình rất mong đợi! Hôm nay tụi mình cùng học thật tốt nhé!",
          },
        ],
      };
    }

    // 3. Kịch bản: Quán cà phê (カフェ / Cafe / ドリンク)
    if (
      scenarioTitle.includes("カフェ") ||
      scenarioTitle.includes("Cafe") ||
      /cafe|cà phê|đồ uống|gọi món/i.test(scenarioTitle) ||
      cleanMsg.includes("コーヒー") ||
      cleanMsg.includes("ラテ")
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "いらっしゃいませ！ご注文はお決まりですか？",
            furigana: "いらっしゃいませ！ごちゅうもんはおきまりですか？",
            romaji: "Irasshaimase! Gochuumon wa okimari desu ka?",
            translation: "Kính chào quý khách! Quý khách đã chọn được đồ uống chưa ạ?",
          },
          userEvaluation: {
            naturalnessScore: 88,
            grammarAdvice: "Có thể dùng mẫu câu '[Tên món] をお願いします' để gọi món lịch sự.",
            betterExpression: "アイスカフェラテをひとつお願いします。",
            betterExpressionFurigana: "アイスカフェラテをひとつおねがいします。",
          },
          suggestedAnswers: [
            {
              japanese: "アイスカフェラテのMサイズをひとつお願いします。",
              furigana: "アイスカフェラテのエムサイズをひとつおねがいします。",
              romaji: "Aisukaferate no M-saizu o hitotsu onegaishimasu.",
              translation: "Cho tôi một ly cafe latte đá size M ạ.",
            },
            {
              japanese: "おすすめのドリンクは何ですか？",
              furigana: "おすすめのドリンクはなんですか？",
              romaji: "Osusume no dorinku wa nan desu ka?",
              translation: "Món đồ uống đặc biệt gợi ý hôm nay là gì vậy ạ?",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "かしこまりました！サイズはいかがなさいますか？また、店内でお召し上がりですか、お持ち帰りですか？",
            furigana: "かしこまりました！サイズはいかがなさいますか？また、てんないでおめしあがりですか、おもちかえりですか？",
            romaji: "Kashikomarimashita! Saizu wa ikaga nasaimasu ka? Mata, tennai de omeshiagari desu ka, omochikaeri desu ka?",
            translation: "Dạ vâng! Quý khách chọn size nào ạ? Và quý khách dùng tại quán hay mang đi ạ?",
          },
          userEvaluation: {
            naturalnessScore: 90,
            grammarAdvice: "Gọi món rất rõ ràng. Phát âm và ngữ điệu tự nhiên.",
            betterExpression: `${userMessage}。店内でお願いします。`,
            betterExpressionFurigana: `${userMessage}。てんないでおねがいします。`,
          },
          suggestedAnswers: [
            {
              japanese: "Mサイズで、店内でお願いします。",
              furigana: "エムサイズで、てんないでおねがいします。",
              romaji: "M-saizu de, tennai de onegaishimasu.",
              translation: "Size M và cho tôi dùng tại quán ạ.",
            },
            {
              japanese: "持ち帰りでお願いします。",
              furigana: "もちかえりでおねがいします。",
              romaji: "Mochikaeri de onegaishimasu.",
              translation: "Cho tôi mang về ạ.",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "かしこまりました。お会計は650円になります。お支払いはどうされますか？",
          furigana: "かしこまりました。おかいけいはろっぴゃくごじゅうえんになります。おしはらいはどうされますか？",
          romaji: "Kashikomarimashita. Okaikei wa roppyaku-gojuu-en ni narimasu. Oshiharai wa dou saremasu ka?",
          translation: "Dạ vâng. Hóa đơn là 650 yên. Quý khách muốn thanh toán bằng hình thức nào ạ?",
        },
        userEvaluation: {
          naturalnessScore: 92,
          grammarAdvice: "Câu trả lời đúng trọng tâm và cách xưng hô rất chuẩn.",
          betterExpression: "PayPayで支払いたいです。",
          betterExpressionFurigana: "ペイペイでしはらいたいです。",
        },
        suggestedAnswers: [
          {
            japanese: "PayPayで支払いたいのですが、QRコードを読み取ってもいいですか？",
            furigana: "ペイペイでしはらいたいのですが、キューアールコードをよみとってもいいですか？",
            romaji: "Peipei de shiharaitai no desu ga, kyuuaarukoudo o yomitotte mo ii desu ka?",
            translation: "Tôi muốn trả bằng PayPay, tôi quét mã QR này được không?",
          },
          {
            japanese: "クレジットカードでお願いします。",
            furigana: "クレジットカードでおねがいします。",
            romaji: "Kurejittokaado de onegaishimasu.",
            translation: "Cho tôi thanh toán bằng thẻ tín dụng ạ.",
          },
        ],
      };
    }

    // 4. Kịch bản: Ga tàu / Hỏi đường (駅 / 道 / 電車)
    if (
      scenarioTitle.includes("駅") ||
      scenarioTitle.includes("道") ||
      /ga tàu|hỏi đường|đi tàu|tàu điện|shinjuku/i.test(scenarioTitle) ||
      cleanMsg.includes("駅") ||
      cleanMsg.includes("電車")
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "すみません、駅員です。何かお困りですか？",
            furigana: "すみません、えきいんです。なにかおこまりですか？",
            romaji: "Sumimasen, ekiin desu. Nanika okomari desu ka?",
            translation: "Xin lỗi bạn, tôi là nhân viên nhà ga. Bạn đang cần hỗ trợ gì chăng?",
          },
          userEvaluation: {
            naturalnessScore: 86,
            grammarAdvice: "Dùng すみません để bắt đầu câu hỏi đường rất lịch sự.",
            betterExpression: "すみません、新宿駅へはどう行けばいいですか？",
            betterExpressionFurigana: "すみません、しんじゅくえきへはどういけばいいですか？",
          },
          suggestedAnswers: [
            {
              japanese: "すみません、新宿駅に行きたいんですが、どの電車に乗ればいいですか？",
              furigana: "すみません、しんじゅくえきにいきたいんですが、どのでんしゃにのればいいですか？",
              romaji: "Sumimasen, Shinjuku-eki ni ikitai n desu ga, dono densha ni noreba ii desu ka?",
              translation: "Xin lỗi, tôi muốn đến ga Shinjuku thì nên đi chuyến tàu nào ạ?",
            },
            {
              japanese: "切符売り場はどこですか？",
              furigana: "きっぷうりばはどこですか？",
              romaji: "Kippu uriba wa doko desu ka?",
              translation: "Quầy bán vé ở đâu vậy ạ?",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "3番線の山手線外回りに乗ってください。約15分で到着しますよ。Suicaはお持ちですか？",
            furigana: "さんばんせんのやまのてせんそとまわりにのってください。やくじゅうごふんでとうちゃくしますよ。スイカはおもちですか？",
            romaji: "Sanban-sen no Yamanote-sen sotomawari ni notte kudasai. Yaku juugofun de touchaku shimasu yo. Suica wa omochi desu ka?",
            translation: "Bạn đón tuyến Yamanote đường ray số 3 nhé, khoảng 15 phút là đến nơi. Bạn có thẻ Suica chưa?",
          },
          userEvaluation: {
            naturalnessScore: 90,
            grammarAdvice: "Cách đặt câu hỏi điểm đến bằng trợ từ に và 行きたいんですが rất tự nhiên.",
            betterExpression: "ありがとうございます。Suicaを持っています。",
            betterExpressionFurigana: "ありがとうございます。スイカをもっています。",
          },
          suggestedAnswers: [
            {
              japanese: "はい、Suicaを持っています。チャージ機はどこですか？",
              furigana: "はい、スイカをもっています。チャージきはどこですか？",
              romaji: "Hai, Suica o motte imasu. Chaaji-ki wa doko desu ka?",
              translation: "Vâng tôi có thẻ Suica rồi. Máy nạp tiền ở đâu ạ?",
            },
            {
              japanese: "いいえ、切符を買いたいです。",
              furigana: "いいえ、きっぷをかいたいです。",
              romaji: "Iie, kippu o kaitai desu.",
              translation: "Dạ chưa, tôi muốn mua vé lẻ.",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "改札の手前、左側にピンクの券売機があります。そこでチャージや購入ができますよ。お気をつけて！",
          furigana: "かいさつのてまえ、ひだりがわにピンクのけんばいきがあります。そこでチャージやこうにゅうができますよ。おきをつけて！",
          romaji: "Kaisatsu no temae, hidarigawa ni pinku no kenbaiki ga arimasu. Sokode chaaji ya kounyuu ga dekimasu yo. Oki o tsukete!",
          translation: "Ngay trước cổng soát vé phía bên trái có máy bán vé màu hồng. Nạp tiền hay mua vé ở đó nhé. Chúc bạn lên đường may mắn!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 94,
          grammarAdvice: "Giao tiếp hỏi đường rất tự tin và lịch sự.",
          betterExpression: "分かりました！教えていただきありがとうございます。",
          betterExpressionFurigana: "わかりました！おしえていただきありがとうございます。",
        },
        suggestedAnswers: [
          {
            japanese: "分かりました！とても親切に教えていただき、ありがとうございます。",
            furigana: "わかりました！とてもしんせつにおしえていただき、ありがとうございます。",
            romaji: "Wakarimashita! Totemo shinsetsu ni oshiete itadaki, arigatou gozaimasu.",
            translation: "Tôi hiểu rồi! Cảm ơn bạn đã chỉ dẫn rất nhiệt tình.",
          },
          {
            japanese: "助かりました。行ってきます！",
            furigana: "たすかりました。いってきます！",
            romaji: "Tasukarimashita. Ittekimasu!",
            translation: "May quá có bạn giúp đỡ. Tôi đi đây ạ!",
          },
        ],
      };
    }

    // 5. Kịch bản: Cuộc sống và thói quen hàng ngày (毎日の生活 / 習慣 / 過ごし方)
    if (
      scenarioTitle.includes("生活") ||
      scenarioTitle.includes("習慣") ||
      scenarioTitle.includes("毎日") ||
      /cuộc sống|thói quen|hàng ngày|thường nhật/i.test(scenarioTitle)
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "こんにちは！普段の毎日の生活についてお話ししましょう。普段は何時頃に起きることが多いですか？",
            furigana: "こんにちは！ふだんのまいにちのせいかつについておはなししましょう。ふだんはなんじごろにおきることがおおいですか？",
            romaji: "Konnichiwa! Fudan no mainichi no seikatsu ni tsuite ohanashi shimashou. Fudan wa nanji goro ni okiru koto ga ooi desu ka?",
            translation: "Xin chào bạn! Hôm nay chúng mình cùng trò chuyện về cuộc sống hàng ngày nhé. Thường ngày bạn hay thức dậy vào khoảng mấy giờ nhỉ?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 88,
            grammarAdvice: "Bạn trả lời mốc thời gian bằng trợ từ に rất chuẩn xác.",
            betterExpression: "毎朝7時頃に起きています。",
            betterExpressionFurigana: "まいあさしちじごろにおきています。",
          },
          suggestedAnswers: [
            {
              japanese: "毎朝7時頃に起きています。起きたらすぐに水を一杯飲みます。",
              furigana: "まいあさしちじごろにおきています。おきたらすぐにみずをいっぱいのみます。",
              romaji: "Maiasa shichiji goro ni okite imasu. Okitara sugu ni mizu o ippai nomimasu.",
              translation: "Mỗi sáng tôi thức dậy khoảng 7 giờ. Sau khi dậy tôi uống ngay một cốc nước.",
            },
            {
              japanese: "仕事の日は6時半、休みの日は9時頃までゆっくり寝ています。",
              furigana: "しごとのひはろくじはん、やすみのひはくじごろまでゆっくりねています。",
              romaji: "Shigoto no hi wa rokuji-han, yasumi no hi wa kuji goro made yukkuri nete imasu.",
              translation: "Ngày đi làm tôi dậy lúc 6h30, còn ngày nghỉ thì ngủ nướng thong thả đến 9 giờ.",
            },
            {
              japanese: "夜遅くまで勉強しているので、朝は8時頃に起きます。",
              furigana: "よるおそくまでべんきょうしているので、あさははちじごろにおきます。",
              romaji: "Yoru osoku made benkyou shite iru node, asa wa hachiji goro ni okimasu.",
              translation: "Vì học khuya nên buổi sáng tôi thường thức dậy vào khoảng 8 giờ.",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "いい習慣ですね！朝ごはんは普段何を食べていますか？学校や職場へはどうやって通っていますか？",
            furigana: "いいしゅうかんですね！あさごはんはふだんなにをたべていますか？がっこうやしょくばへはどうやってかよっていますか？",
            romaji: "Ii shuukan desu ne! Asagohan wa fudan nani o tabete imasu ka? Gakkou ya shokuba e wa dou yatte kayotte imasu ka?",
            translation: "Thói quen tốt quá! Buổi sáng bạn thường ăn gì? Bạn đến trường hay nơi làm việc bằng phương tiện gì?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 90,
            grammarAdvice: "Dùng trợ từ で để chỉ phương tiện di chuyển (電車で/自転車で) rất chính xác.",
            betterExpression: `${userMessage}。電車で通っています。`,
            betterExpressionFurigana: `${userMessage}。でんしゃでかよっています。`,
          },
          suggestedAnswers: [
            {
              japanese: "パンと目玉焼きを食べて、電車で通勤しています。",
              furigana: "パンとめだまやきをたべて、でんしゃでつうきんしています。",
              romaji: "Pan to medamayaki o tabete, densha de tsuukin shite imasu.",
              translation: "Tôi ăn bánh mì với trứng ốp la, rồi đi làm bằng tàu điện.",
            },
            {
              japanese: "あまり時間がなくてバナナを食べるだけです。自転車で15分くらいです。",
              furigana: "あまりじかんがなくてバナナをたべるだけです。じてんしゃでじゅうごふんくらいです。",
              romaji: "Amari jikan ga nakute banana o taberu dake desu. Jitensha de juugofun kurai desu.",
              translation: "Tôi không có nhiều thời gian nên chỉ kịp ăn một quả chuối. Đi xe đạp mất khoảng 15 phút.",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "健康的な一日を過ごされているんですね！夜寝る前のリラックスタイムも大切に、これからも毎日元気にお過ごしくださいね！",
          furigana: "けんこうてきないちにちをすごされているんですね！よるねるまえのリラックスタイムもたいせつに、これからもまいにちげんきにおすごしくださいね！",
          romaji: "Kenkouteki na ichinichi o sugosarete iru n desu ne! Yoru neru mae no rirakkusu taimu mo taisetsu ni, korekara mo mainichi genki ni osugoshi kudasai ne!",
          translation: "Bạn có một ngày sinh hoạt thật điều độ và lành mạnh! Hãy trân trọng khoảng thời gian thư giãn trước khi ngủ và chúc bạn luôn tràn đầy năng lượng mỗi ngày nhé!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 93,
          grammarAdvice: "Miêu tả thói quen sinh hoạt rất tự nhiên và trôi chảy. Phản xạ tuyệt vời!",
          betterExpression: "お話を聞いていただきありがとうございました！",
          betterExpressionFurigana: "おはなしをきいていただきありがとうございました！",
        },
        suggestedAnswers: [
          {
            japanese: "はい、ありがとうございます！とても楽しくお話しできました。",
            furigana: "はい、ありがとうございます！とてもたのしくおはなしできました。",
            romaji: "Hai, arigatou gozaimasu! Totemo tanoshiku ohanashi dekimashita.",
            translation: "Vâng, cảm ơn bạn rất nhiều! Cuộc trò chuyện hôm nay rất vui.",
          },
          {
            japanese: "はい！お互いに健康に気をつけて頑張りましょうね！",
            furigana: "はい！おたがいにけんこうにきをつけてがんばりましょうね！",
            romaji: "Hai! Otagai ni kenkou ni ki o tsukete gambarimashou ne!",
            translation: "Vâng! Cả hai chúng ta cùng giữ gìn sức khỏe và cố gắng nhé!",
          },
        ],
      };
    }

    // 6. Kịch bản: Báo cáo công việc HORENSO (ビジネス会話 / 進捗報告 / 仕事)
    if (
      scenarioTitle.includes("進捗") ||
      scenarioTitle.includes("報告") ||
      scenarioTitle.includes("ビジネス") ||
      /tiến độ|báo cáo|horenso|công việc|kinh doanh/i.test(scenarioTitle)
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "お疲れ様です。現在担当されているプロジェクトの進捗状況はどうですか？問題なく進んでいますか？",
            furigana: "おつかれさまです。げんざいたんとうされているプロジェクトのしんちょくじょうきょうはどうですか？もんだいなくすすんでいますか？",
            romaji: "Otsukaresama desu. Genzai tantou sarete iru purojekuto no shinchoku joukyou wa dou desu ka? Mondai naku susunde imasu ka?",
            translation: "Chào bạn, vất vả rồi. Tình hình tiến độ dự án bạn đang phụ trách thế nào rồi? Mọi việc vẫn tiến triển thuận lợi chứ?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 89,
            grammarAdvice: "Kính ngữ công sở (Otsukaresama desu) dùng rất lịch sự và chuyên nghiệp.",
            betterExpression: "お疲れ様です。現在の進捗状況をご報告いたします。",
            betterExpressionFurigana: "おつかれさまです。げんざいのしんちょくじょうきょうをごほうこくいたします。",
          },
          suggestedAnswers: [
            {
              japanese: "お疲れ様です。現在80％ほど完了しており、予定通り順調に進んでおります。",
              furigana: "おつかれさまです。げんざいはちじっパーセントほどかんりょうしており、よていどおりじゅんちょうにすすんでおります。",
              romaji: "Otsukaresama desu. Genzai hachiju-paasento hodo kanryou shite ori, yotei doori junchou ni susunde orimasu.",
              translation: "Chào anh/chị. Hiện tại đã hoàn thành khoảng 80% và đang tiến triển rất thuận lợi theo đúng kế hoạch ạ.",
            },
            {
              japanese: "一部の機能で少し遅れが出ておりますが、明日中には追いつく見込みです。",
              furigana: "いちぶのきのうですこしおくれがでておりますが、あすじゅうにはおいつくみこみです。",
              romaji: "Ichibu no kinou de sukoshi okure ga dete orimasu ga, asuchuu ni wa oitsuku mikomi desu.",
              translation: "Một số chức năng đang hơi chậm một chút, nhưng dự kiến trong ngày mai sẽ bắt kịp tiến độ ạ.",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "状況把握できました。何か課題やトラブル、私の方でサポートできる点はありますか？",
            furigana: "じょうきょうはあくできました。なにかかだいやトラブル、わたしのほうでサポートできるてんはありますか？",
            romaji: "Joukyou haaku dekimashita. Nanika kadai ya toraburu, watashi no hou de sapooto dekiru ten wa arimasu ka?",
            translation: "Tôi nắm được tình hình rồi. Có phát sinh vấn đề hay rủi ro gì cần tôi hỗ trợ không?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 92,
            grammarAdvice: "Báo cáo số liệu phần trăm và tình trạng dự án rất rõ ràng, đúng chuẩn HORENSO.",
            betterExpression: `${userMessage}。特に問題はございません。`,
            betterExpressionFurigana: `${userMessage}。とくにもんだいはございません。`,
          },
          suggestedAnswers: [
            {
              japanese: "今のところ大きな問題はございません。予定通り金曜日にデプロイいたします。",
              furigana: "いまのところおおきなもんだいはございません。よていどおりきんようびにデプロイいたします。",
              romaji: "Ima no tokoro ookina mondai wa gozaimasen. Yotei doori kinyoubi ni depuroi itashimasu.",
              translation: "Hiện tại không có vấn đề gì lớn ạ. Dự kiến thứ 6 này chúng tôi sẽ deploy đúng hạn.",
            },
            {
              japanese: "仕様の確認で1点ご相談したいことがございます。今10分ほどお時間よろしいでしょうか？",
              furigana: "しようのかくにんでいってんごそうだんしたいことがございます。いまじゅっぷんほどおじかんよろしいでしょうか？",
              romaji: "Shiyou no kakunin de itten gosoudan shitai koto ga gozaimasu. Ima juppun hodo ojikan yoroshii deshou ka?",
              translation: "Có một điểm về tài liệu đặc tả em muốn xin ý kiến. Hiện tại anh/chị có thể cho em xin khoảng 10 phút được không ạ?",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "承知いたしました。迅速かつ正確な報告をありがとうございました。引き続きよろしくお願いいたします！無理はしないでくださいね。",
          furigana: "しょうちいたしました。じんそくかつせいかくなほうこくをありがとうございました。ひきつづきよろしくおねがいいたします！むりはしないでくださいね。",
          romaji: "Shouchi itashimashita. Jinsoku katsu seikaku na houkoku o arigatou gozaimashita. Hikitsuzuki yoroshiku onegai itashimasu! Muri wa shinaide kudasai ne.",
          translation: "Tôi đã hiểu. Cảm ơn bạn đã báo cáo nhanh chóng và chính xác. Tiếp tục phát huy nhé, đừng làm việc quá sức nha!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 95,
          grammarAdvice: "Kỹ năng báo cáo HORENSO bằng tiếng Nhật công sở xuất sắc!",
          betterExpression: "承知いたしました。引き続きどうぞよろしくお願いいたします。",
          betterExpressionFurigana: "しょうちいたしました。ひきつづきどうぞよろしくおねがいいたします。",
        },
        suggestedAnswers: [
          {
            japanese: "かしこまりました。引き続きよろしくお願いいたします！",
            furigana: "かしこまりました。ひきつづきよろしくおねがいいたします！",
            romaji: "Kashikomarimashita. Hikitsuzuki yoroshiku onegai itashimasu!",
            translation: "Dạ vâng, em hiểu rồi ạ. Em xin phép tiếp tục công việc!",
          },
        ],
      };
    }

    // 7. Kịch bản: Quán nhậu Izakaya (居酒屋 / 乾杯 / 飲み会)
    if (
      scenarioTitle.includes("居酒屋") ||
      scenarioTitle.includes("乾杯") ||
      scenarioTitle.includes("飲み") ||
      /izakaya|quán nhậu|đi ăn|kanpai/i.test(scenarioTitle)
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "今日もお仕事お疲れ様でした！喉が渇きましたね。最初の飲み物は何にしますか？とりあえずビールにしますか？",
            furigana: "きょうもおしごとおつかれさまでした！のどがかわきましたね。さいしょのみものはなににしますか？とりあえずビールにしますか？",
            romaji: "Kyou mo oshigoto otsukaresama deshita! Nodo ga kawakimashita ne. Saisho no nomimono wa nan ni shimasu ka? Toriaezu biiru ni shimasu ka?",
            translation: "Hôm nay làm việc vất vả rồi! Khát nước quá nhỉ. Món đồ uống đầu tiên bạn chọn gì? Làm ly bia tươi trước nhé?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 90,
            grammarAdvice: "Văn hóa Izakaya Nhật Bản thường bắt đầu bằng câu 'Toriaezu nama' (Trước hết cho ly bia tươi).",
            betterExpression: "とりあえず生ビールでお願いします！",
            betterExpressionFurigana: "とりあえずなまビールでおねがいします！",
          },
          suggestedAnswers: [
            {
              japanese: "いいですね！とりあえず生ビールをお願いします！",
              furigana: "いいですね！とりあえずなまビールをおねがいします！",
              romaji: "Ii desu ne! Toriaezu nama biiru o onegaishimasu!",
              translation: "Tuyệt quá! Trước hết cho tôi một ly bia tươi nhé!",
            },
            {
              japanese: "すみません、お酒に弱いのでウーロン茶をお願いします。",
              furigana: "すみません、おさけによわいのでウーロンちゃをおねがいします。",
              romaji: "Sumimasen, osake ni yowai node uuroncha o onegaishimasu.",
              translation: "Xin lỗi, tửu lượng tôi hơi yếu nên cho tôi một ly trà ô long nhé.",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "お疲れ様でした！乾杯！おつまみは何を頼みましょうか？焼き鳥や枝豆、唐揚げなどはいかがですか？",
            furigana: "おつかれさまでした！かんぱい！おつまみはなにをたのみましょうか？やきとりやえだまめ、からあげなどはいかがですか？",
            romaji: "Otsukaresama deshita! Kampai! Otsumami wa nani o tanomimashou ka? Yakitori ya edamame, karaage nado wa ikaga desu ka?",
            translation: "Vất vả rồi! Nâng ly nào! Gọi món nhắm gì đây nhỉ? Bạn thấy gà xiên nướng, đậu nành luộc hay gà rán thế nào?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 92,
            grammarAdvice: "Nâng ly 'Kampai' tạo không khí rất hào hứng và tự nhiên.",
            betterExpression: "乾杯！焼き鳥の盛り合わせを頼みましょう。",
            betterExpressionFurigana: "かんぱい！やきとりのもりあわせをたのみましょう。",
          },
          suggestedAnswers: [
            {
              japanese: "乾杯！焼き鳥の盛り合わせと枝豆を頼みましょう！",
              furigana: "かんぱい！やきとりのもりあわせとえだまめをたのみましょう！",
              romaji: "Kampai! Yakitori no moriawase to edamame o tanomimashou!",
              translation: "Nâng ly nào! Chúng mình gọi đĩa thập cẩm gà xiên nướng với đậu nành luộc nhé!",
            },
            {
              japanese: "居酒屋のポテトサラダと唐揚げも美味しそうですね！",
              furigana: "いざかやのポテトサラダとからあげもおいしそうですね！",
              romaji: "Izakaya no poteto sarada to karaage mo oishisou desu ne!",
              translation: "Salad khoai tây và gà rán của quán nhậu trông cũng hấp dẫn quá!",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "料理もお酒も美味しくて、とても楽しい夜になりましたね！お会計は割り勘にしましょうか。またぜひ行きましょうね！",
          furigana: "りょうりもおさけもおおいしくて、とてもたのしいよるになりましたね！おかいけいはわりかんにしましょうか。またぜひいきましょうね！",
          romaji: "Ryouri mo osake mo oishikute, totemo tanoshii yoru ni narimashita ne! Okaikei wa warikan ni shimashou ka. Mata zehi ikimashou ne!",
          translation: "Món ăn và đồ uống đều ngon, một buổi tối thật là vui vẻ! Hóa đơn mình chia đều (Warikan) nhé. Lần sau nhất định lại tụ tập tiếp nha!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 95,
          grammarAdvice: "Giao tiếp quán nhậu sống động, am hiểu văn hóa chia tiền Warikan của Nhật Bản.",
          betterExpression: "ごちそうさまでした！また一緒に行きましょう！",
          betterExpressionFurigana: "ごちそうさまでした！またいっしょにいきましょう！",
        },
        suggestedAnswers: [
          {
            japanese: "はい！割り勘でお願いします。とても楽しかったです！",
            furigana: "はい！わりかんでおねがいします。とてもたのしかったです！",
            romaji: "Hai! Warikan de onegaishimasu. Totemo tanoshikatta desu!",
            translation: "Vâng! Chia đều tiền nhé. Hôm nay vui quá!",
          },
          {
            japanese: "ごちそうさまでした！また誘ってくださいね！",
            furigana: "ごちそうさまでした！またさそってくださいね！",
            romaji: "Gochisousama deshita! Mata sasotte kudasai ne!",
            translation: "Cảm ơn bữa ăn ngon! Lần tới nhớ rủ tôi tiếp nhé!",
          },
        ],
      };
    }

    // 8. Kịch bản: Bệnh viện / Khám bệnh (病院 / 診察 / 体調)
    if (
      scenarioTitle.includes("病院") ||
      scenarioTitle.includes("診察") ||
      scenarioTitle.includes("体調") ||
      /bệnh viện|khám bệnh|bác sĩ|nhà thuốc/i.test(scenarioTitle)
    ) {
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "こんにちは。今日はどうされましたか？どこか具合が悪いですか？",
            furigana: "こんにちは。きょうはどうされましたか？どこかぐあいがわるいですか？",
            romaji: "Konnichiwa. Kyou wa dou saremashita ka? Dokoka guai ga warui desu ka?",
            translation: "Chào bạn. Hôm nay bạn thấy trong người thế nào? Bạn cảm thấy không khỏe ở đâu?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 88,
            grammarAdvice: "Miêu tả triệu chứng kèm thời gian bắt đầu bị đau rất rõ ràng.",
            betterExpression: "昨日から頭が痛くて、熱もあります。",
            betterExpressionFurigana: "きのうからあたまがいたくて、ねつもあります。",
          },
          suggestedAnswers: [
            {
              japanese: "昨日から頭が痛くて、熱が38度近くあります。",
              furigana: "きのうからあたまがいたくて、ねつがさんじゅうはちどちかくあります。",
              romaji: "Kinou kara atama ga itakute, netsu ga sanjuuhachi-do chikaku arimasu.",
              translation: "Từ hôm qua tôi bị đau đầu và sốt gần 38 độ ạ.",
            },
            {
              japanese: "喉がとても痛くて、咳も少し出ます。",
              furigana: "のどがとてもいたくて、せきもすこしでます。",
              romaji: "Nodo ga totemo itakute, seki mo sukoshi demasu.",
              translation: "Họng tôi rất đau và có bị ho một chút nữa ạ.",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "それは辛いですね。薬のアレルギーは何かありますか？妊娠の可能性はありますか？",
            furigana: "それはつらいですね。くすりのアレルギーはなにかありますか？にんしんのかのうせいはありますか？",
            romaji: "Sore wa tsurai desu ne. Kusuri no arerugii wa nanika arimasu ka? Ninshin no kanousei wa arimasu ka?",
            translation: "Thế thì mệt mỏi quá. Bạn có bị dị ứng loại thuốc nào không? Có khả năng đang mang thai không?",
          },
          isFinished: false,
          userEvaluation: {
            naturalnessScore: 91,
            grammarAdvice: "Trả lời xác nhận tiền sử dị ứng thuốc chính xác giúp bác sĩ kê đơn an toàn.",
            betterExpression: "いいえ、薬のアレルギーはありません。",
            betterExpressionFurigana: "いいえ、くすりのアレルギーはありません。",
          },
          suggestedAnswers: [
            {
              japanese: "いいえ、特に薬のアレルギーはありません。",
              furigana: "いいえ、とくにくすりのアレルギーはありません。",
              romaji: "Iie, tokuni kusuri no arerugii wa arimasen.",
              translation: "Dạ không, tôi không có dị ứng thuốc gì đặc biệt ạ.",
            },
            {
              japanese: "抗生物質で以前じんましんが出たことがあります。",
              furigana: "こうせいぶっしつでいぜんじんましんがでたことがあります。",
              romaji: "Kousei busshitsu de izen jimmashin ga deta koto ga arimasu.",
              translation: "Trước đây tôi từng bị nổi mề đay khi dùng kháng sinh ạ.",
            },
          ],
        };
      }

      return {
        aiReply: {
          japanese: "解熱剤と喉の炎症を抑えるお薬を3日分出しておきますね。食後に飲んで、温かくして休んでください。お大事にどうぞ！",
          furigana: "げねつざいとのどのえんしょうをおさえるおくすりをみっかぶんておきますね。しょくごにのんで、あたたかくしてやすんでください。おだいじにどうぞ！",
          romaji: "Genetsuzai to nodo no enshou o osaeru okusuri o mikka-bun dashite okimasu ne. Shokugo ni nonde, atatakaku shite yasunde kudasai. Odaiji ni douzo!",
          translation: "Bác sĩ kê cho bạn thuốc hạ sốt và thuốc giảm viêm họng trong 3 ngày nhé. Hãy uống sau bữa ăn, giữ ấm và nghỉ ngơi thật nhiều. Chúc bạn sớm bình phục!",
        },
        isFinished: true,
        userEvaluation: {
          naturalnessScore: 94,
          grammarAdvice: "Đáp lại lời dặn của bác sĩ đúng lễ nghi phòng khám Nhật Bản.",
          betterExpression: "分かりました。ありがとうございました。",
          betterExpressionFurigana: "わかりました。ありがとうございました。",
        },
        suggestedAnswers: [
          {
            japanese: "分かりました。診察していただき、ありがとうございました！",
            furigana: "わかりました。しんさつしていただき、ありがとうございました！",
            romaji: "Wakarimashita. Shinsatsu shite itadaki, arigatou gozaimashita!",
            translation: "Tôi hiểu rồi. Cảm ơn bác sĩ đã thăm khám cho tôi ạ!",
          },
        ],
      };
    }

    // 9. Phản xạ đa lượt tổng quát cho bất kỳ chủ đề nào khác (Luôn tiến về phía trước, không lặp câu hỏi)
    if (currentTurn === 1) {
      return {
        aiReply: {
          japanese: "なるほど、よく分かりました！それについて、具体的にどう思われますか？",
          furigana: "なるほど、よくわかりました！それについて、ぐたいてきにどうおもわれますか？",
          romaji: "Naruhodo, yoku wakarimashita! Sore ni tsuite, gutaiteki ni dou omowaremasu ka?",
          translation: "Thì ra là vậy, tôi hiểu rồi! Cụ thể hơn thì bạn suy nghĩ như thế nào về điều đó?",
        },
        userEvaluation: {
          naturalnessScore: 85,
          grammarAdvice: "Câu trả lời đúng ngữ cảnh và phát âm tương đối dễ hiểu. Hãy tự tin tiếp tục trò chuyện nhé!",
          betterExpression: userMessage ? `${userMessage}と思います。` : "はい、そうです。",
          betterExpressionFurigana: userMessage ? `${userMessage}とおもいます。` : "はい、そうです。",
        },
        suggestedAnswers: [
          {
            japanese: "とても興味深くて、面白いと思います。",
            furigana: "とてもきょうみぶかくて、おもしろいとおもいます。",
            romaji: "Totemo kyoumibukakute, omoshiroi to omoimasu.",
            translation: "Tôi thấy rất thú vị và bổ ích.",
          },
          {
            japanese: "少し難しいですが、もっと知りたいです。",
            furigana: "すこしむずかしいですが、もっとしりたいです。",
            romaji: "Sukoshi muzukashii desu ga, motto shiritai desu.",
            translation: "Có một chút khó, nhưng tôi muốn tìm hiểu thêm.",
          },
        ],
      };
    }

    if (currentTurn === 2) {
      return {
        aiReply: {
          japanese: "そうなんですね！面白い視点ですね。普段からよくそうされているのですか？",
          furigana: "そうなんですね！おもしろいしてんですね。ふだんからよくそうされているのですか？",
          romaji: "Sou nan desu ne! Omoshiroi shiten desu ne. Fudan kara yoku sou sarete iru no desu ka?",
          translation: "Ra là vậy! Góc nhìn thú vị quá. Thường ngày bạn cũng hay làm như vậy sao?",
        },
        userEvaluation: {
          naturalnessScore: 88,
          grammarAdvice: "Bạn diễn đạt suy nghĩ của bản thân rất mạch lạc và tự nhiên.",
          betterExpression: `${userMessage}。いつもそう意識しています。`,
          betterExpressionFurigana: `${userMessage}。いつもそういしきしています。`,
        },
        suggestedAnswers: [
          {
            japanese: "はい、時間がある時はいつもそうしています。",
            furigana: "はい、じかんがあるときはいつもそうしています。",
            romaji: "Hai, jikan ga aru toki wa itsumo sou shite imasu.",
            translation: "Vâng, mỗi khi có thời gian tôi đều làm như vậy.",
          },
          {
            japanese: "いいえ、最近始めたばかりです。",
            furigana: "いいえ、さいきんはじめたばかりです。",
            romaji: "Iie, saikin hajimeta bakari desu.",
            translation: "Dạ không, tôi cũng vừa mới bắt đầu gần đây thôi.",
          },
        ],
      };
    }

    return {
      aiReply: {
        japanese: "素晴らしいお話を聞かせていただき、ありがとうございます！とても楽しく会話ができましたね。",
        furigana: "すばらしいおはなしをきかせていただき、ありがとうございます！とてもたのしくかいわができましたね。",
        romaji: "Subarashii ohanashi o kikasete itadaki, arigatou gozaimasu! Totemo tanoshiku kaiwa ga dekimashita ne.",
        translation: "Cảm ơn bạn đã chia sẻ câu chuyện tuyệt vời này! Cuộc trò chuyện hôm nay thật vui và ý nghĩa.",
      },
      userEvaluation: {
        naturalnessScore: 92,
        grammarAdvice: "Cuộc trò chuyện đã hoàn thành rất trọn vẹn và tự nhiên. Kỹ năng giao tiếp của bạn tiến bộ rõ rệt!",
        betterExpression: "こちらこそ、楽しくお話しできて嬉しかったです。",
        betterExpressionFurigana: "こちらこそ、たのしくおはなしできてうれしかったです。",
      },
      suggestedAnswers: [
        {
          japanese: "こちらこそ、楽しくお話しできて嬉しかったです！",
          furigana: "こちらこそ、たのしくおはなしできてうれしかったです！",
          romaji: "Kochira koso, tanoshiku ohanashi dekite ureshikatta desu!",
          translation: "Chính tôi cũng rất vui khi được trò chuyện cùng bạn!",
        },
        {
          japanese: "また次回もよろしくお願いします！",
          furigana: "またじかいもよろしくおねがいします！",
          romaji: "Mata jikai mo yoroshiku onegaishimasu!",
          translation: "Lần tới cũng nhờ bạn giúp đỡ tiếp nhé!",
        },
      ],
    };
  }

  /**
   * 4. Generate Contextual Roleplay Suggestions
   * Provides 2-3 dynamic, context-aware Japanese responses for any given AI utterance & scenario
   */
  static async generateRoleplaySuggestions({
    scenarioTitle = "Hội thoại giao tiếp",
    level = "N5",
    aiMessage = "",
    conversationHistory = [],
    userName = "Học viên",
  }) {
    // 1. Try Google Gemini Key Pool (Multi-key round-robin & auto-failover)
    if (this.hasGeminiKeys()) {
      try {
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory, userName });
        const rawContent = await this.callGemini({ prompt, temperature: 0.7, isJson: true });
        const parsed = this.parseSuggestionsJson(rawContent);
        if (parsed && parsed.suggestedAnswers && parsed.suggestedAnswers.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn("Lỗi gọi Gemini Key Pool cho roleplay-suggestions, thử Claude/OpenAI/Fallback:", err.message);
      }
    }

    // 2. Try Claude
    if (config.ai.anthropicApiKey) {
      try {
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory, userName });
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": config.ai.anthropicApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: config.ai.anthropicModel || "claude-3-5-sonnet-20241022",
            max_tokens: 800,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const rawContent = data.content?.[0]?.text || "";
          const parsed = this.parseSuggestionsJson(rawContent);
          if (parsed && parsed.suggestedAnswers && parsed.suggestedAnswers.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Lỗi gọi Claude cho roleplay-suggestions, thử OpenAI/Fallback:", err.message);
      }
    }

    // 3. Try OpenAI
    if (config.ai.openaiApiKey) {
      try {
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory, userName });
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.ai.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.ai.openaiModel || "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a friendly Japanese conversation tutor providing natural contextual reply suggestions. Return strictly valid JSON.",
              },
              { role: "user", content: prompt },
            ],
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const rawContent = data.choices?.[0]?.message?.content || "";
          const parsed = this.parseSuggestionsJson(rawContent);
          if (parsed && parsed.suggestedAnswers && parsed.suggestedAnswers.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Lỗi gọi OpenAI cho roleplay-suggestions, dùng Heuristic Fallback:", err.message);
      }
    }

    // 4. Context-Aware Heuristic Generator
    return {
      suggestedAnswers: this.getHeuristicSuggestions({ scenarioTitle, aiMessage, level, userName }),
    };
  }

  /**
   * Prompt builder for Roleplay Suggestions
   */
  static buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory = [], userName = "Học viên" }) {
    const formattedHistory = conversationHistory
      .slice(-4)
      .map((msg) => `${msg.sender === "ai" ? "Character (AI)" : "Learner"}: "${msg.japanese}"`)
      .join("\n");

    const domainGuidance = this.getScenarioDomainGuidance(scenarioTitle);
    const identity = getLearnerJapaneseIdentity(userName);

    return `
Bạn là chuyên gia sư phạm tiếng Nhật bản ngữ của JTalk AI.
Tình huống giao tiếp thực tế: "${scenarioTitle}".
Lĩnh vực bối cảnh: ${domainGuidance.domain}
Trình độ người học: JLPT ${level}.
Họ tên người học: "${userName}" (Tên tiếng Nhật Katakana: "${identity.katakanaName}", Danh xưng lịch sự: "${identity.callingName}").
Câu nói của đối phương (nhân vật AI): "${aiMessage}".
${formattedHistory ? `Lịch sử đối thoại trước đó:\n${formattedHistory}` : ""}

Nhiệm vụ:
Tạo ra 2 đến 3 câu gợi ý phản xạ ngắn gọn (1 câu tiếng Nhật mỗi gợi ý), TỰ NHIÊN, BÁM SÁT TRỌNG TÂM BỐI CẢNH và ĐÚNG NGỮ CẢNH NHẤT để người học có thể chọn đáp lại ngay câu nói của đối phương.
Các gợi ý phải sát với tình huống thực tế của "${scenarioTitle}" và câu của nhân vật vừa nói ("${aiMessage}"). TUYỆT ĐỐI KHÔNG gợi ý lạc đề sang các chủ đề không liên quan (như hỏi về món ăn quê hương khi đang ở trong lớp học).

ĐẶC BIỆT LƯU Ý VỀ TÊN NGƯỜI HỌC TRONG GỢI Ý (PERSONALIZED NAME IN SUGGESTIONS):
- Nếu câu nói của đối phương ("${aiMessage}") đang hỏi về tên (お名前は？ / 誰？), hỏi tự giới thiệu bản thân (自己紹介), hoặc chào hỏi gặp mặt lần đầu:
  Trong các câu gợi ý trả lời ("suggestedAnswers"), BẮT BUỘC sử dụng chính xác tên của người học là "${identity.katakanaName}" (hoặc "${identity.katakanaFullName}"), TUYỆT ĐỐI KHÔNG DÙNG TÊN "Nam" hay bất kỳ tên ngẫu nhiên nào khác!
  Ví dụ: 「初めまして！私の名前は${identity.katakanaName}です。」 hoặc 「${identity.katakanaName}と申します。」

Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown ngoài json):
{
  "suggestedAnswers": [
    {
      "japanese": "Câu tiếng Nhật (có Kanji nếu cần)",
      "furigana": "Phiên âm toàn bộ chữ Hán sang Hiragana/Katakana",
      "romaji": "Phiên âm Latin chuẩn",
      "translation": "Nghĩa tiếng Việt tự nhiên, ngắn gọn"
    }
  ]
}
`;
  }

  /**
   * Safely parse suggestions JSON
   */
  static parseSuggestionsJson(rawText) {
    try {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.suggestedAnswers)) {
        parsed.suggestedAnswers = parsed.suggestedAnswers.map((item) => {
          if (typeof item === "string") {
            return { japanese: item, furigana: item, romaji: "", translation: "" };
          }
          return {
            japanese: item.japanese || "",
            furigana: item.furigana || item.japanese || "",
            romaji: item.romaji || "",
            translation: item.translation || "",
          };
        });
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Intelligent Context-Aware Heuristic Suggestions
   */
  static getHeuristicSuggestions({ scenarioTitle = "", aiMessage = "", level = "N5", userName = "Học viên" }) {
    const titleLower = (scenarioTitle || "").toLowerCase();
    const msgLower = (aiMessage || "").toLowerCase();
    const identity = getLearnerJapaneseIdentity(userName);

    // 0. SPECIFIC INTENT MATCHING FIRST (Ưu tiên nhận diện chính xác ý đồ câu hỏi của AI trước)
    // A. AI hỏi tên (お名前は何ですか？ / お名前は？ / 誰ですか？ / お名前をお伺い)
    if (
      msgLower.includes("名前") ||
      msgLower.includes("なまえ") ||
      msgLower.includes("お名前") ||
      msgLower.includes("誰")
    ) {
      return [
        {
          japanese: `初めまして！私の名前は${identity.katakanaName}です。よろしくお願いします。`,
          furigana: `はじめまして！わたしのなまえは${identity.katakanaName}です。よろしくおねがいします。`,
          romaji: `Hajimemashite! Watashi no namae wa ${identity.romajiName} desu. Yoroshiku onegaishimasu.`,
          translation: `Rất vui được gặp bạn! Tên tôi là ${identity.givenName}. Rất mong được giúp đỡ.`,
        },
        {
          japanese: `${identity.katakanaName}と申します。ベトナムから来ました。どうぞよろしくお願いします。`,
          furigana: `${identity.katakanaName}ともうします。ベトナムからきました。どうぞよろしくおねがいします。`,
          romaji: `${identity.romajiName} to moushimasu. Betonamu kara kimashita. Douzo yoroshiku onegaishimasu.`,
          translation: `Tôi tên là ${identity.givenName}. Tôi đến từ Việt Nam. Rất mong được giúp đỡ ạ.`,
        },
        {
          japanese: `初めまして、${identity.katakanaName}です。趣味は日本語を勉強することです。`,
          furigana: `はじめまして、${identity.katakanaName}です。しゅみはにほんごをべんきょうすることです。`,
          romaji: `Hajimemashite, ${identity.romajiName} desu. Shuumi wa Nihongo o benkyou suru koto desu.`,
          translation: `Xin chào, tôi là ${identity.givenName}. Sở thích của tôi là học tiếng Nhật.`,
        },
      ];
    }

    // B. AI hỏi xuất xứ / đến từ đâu / quê quán (どこから / 出身 / 国 / どちら)
    if (
      msgLower.includes("どこから") ||
      msgLower.includes("出身") ||
      msgLower.includes("しゅっしん") ||
      msgLower.includes("国は") ||
      msgLower.includes("どちらから") ||
      msgLower.includes("どちらのご出身")
    ) {
      return [
        {
          japanese: "ハノイから来ました。とても賑やかな街です。",
          furigana: "ハノイからきました。とてもにぎやかなまちです。",
          romaji: "Hanoi kara kimashita. Totemo nigiyaka na machi desu.",
          translation: "Tôi đến từ Hà Nội. Đó là một thành phố rất nhộn nhịp.",
        },
        {
          japanese: "ベトナムのダナンから来ました。海がとても綺麗です。",
          furigana: "ベトナムのダナンからきました。うみがとてもきれいです。",
          romaji: "Betonamu no Danan kara kimashita. Umi ga totemo kirei desu.",
          translation: "Tôi đến từ Đà Nẵng, Việt Nam. Biển ở đó rất đẹp.",
        },
      ];
    }

    // C. AI hỏi thời gian ở Nhật (どのくらい / いつ日本 / 何年 / 何ヶ月)
    if (
      msgLower.includes("どのくらい") ||
      msgLower.includes("どの位") ||
      msgLower.includes("いつ日本") ||
      msgLower.includes("何年") ||
      msgLower.includes("何ヶ月")
    ) {
      return [
        {
          japanese: "日本に来てまだ半年くらいです。だんだん慣れてきました。",
          furigana: "にほんにきてまだはんとし・はんねんくらいです。だんだんなれてきました。",
          romaji: "Nihon ni kite mada hantoshi kurai desu. Dandan narete kimashita.",
          translation: "Tôi sang Nhật mới khoảng nửa năm thôi. Đang dần quen rồi ạ.",
        },
        {
          japanese: "先月日本に来たばかりなので、まだ少し緊張しています。",
          furigana: "せんげつにほんにきたばかりなので、まだすこしきんちょうしています。",
          romaji: "Sengetsu Nihon ni kita bakari na node, mada sukoshi kinchou shite imasu.",
          translation: "Tôi vừa sang Nhật hồi tháng trước nên vẫn còn hơi bỡ ngỡ một chút.",
        },
      ];
    }

    // D. AI hỏi về quen cuộc sống chưa / cảm nhận (慣れましたか / 生活 / どうですか)
    if (
      msgLower.includes("慣れ") ||
      msgLower.includes("なれ") ||
      msgLower.includes("生活") ||
      msgLower.includes("街はどう") ||
      msgLower.includes("いかがですか")
    ) {
      return [
        {
          japanese: "はい、だんだん慣れてきました。街がとても綺麗ですね。",
          furigana: "はい、だんだんなれてきました。まちがとてもきれいですね。",
          romaji: "Hai, dandan narete kimashita. Machi ga totemo kirei desu ne.",
          translation: "Vâng, tôi dần quen rồi. Đường phố ở đây rất sạch đẹp ạ.",
        },
        {
          japanese: "まだ少し慣れていませんが、毎日とても楽しいです。",
          furigana: "まだすこしなれていませんが、まいにちとてもたのしいです。",
          romaji: "Mada sukoshi narete imasen ga, mainichi totemo tanoshii desu.",
          translation: "Tôi vẫn chưa quen lắm, nhưng mỗi ngày đều rất vui.",
        },
      ];
    }

    // D1. AI hỏi thời gian học tiếng Nhật & cảm nhận không khí lớp học (いつから始め / 勉強はいつ / 始めた / クラスの雰囲気 / 雰囲気はどう)
    if (
      msgLower.includes("いつから始め") ||
      msgLower.includes("いつからはじめ") ||
      msgLower.includes("勉強はいつ") ||
      msgLower.includes("クラスの雰囲気") ||
      msgLower.includes("雰囲気はどう") ||
      msgLower.includes("ふんいき") ||
      (msgLower.includes("勉強") && msgLower.includes("いつ"))
    ) {
      return [
        {
          japanese: "3ヶ月前から勉強を始めました。クラスの皆さんが親切で安心しました。",
          furigana: "さんかげつまえからべんきょうをはじめました。クラスのみなさんがしんせつであんしんしました。",
          romaji: "San-kagetsu mae kara benkyou o hajimemashita. Kurasu no minasan ga shinsetsu de anshin shimashita.",
          translation: "Tôi bắt đầu học từ 3 tháng trước. Mọi người trong lớp đều rất thân thiện nên tôi cũng yên tâm rồi.",
        },
        {
          japanese: "ベトナムで半年ほど勉強してきました。少し緊張していますが、とても楽しみです。",
          furigana: "ベトナムではんとしほどべんきょうしてきました。すこしきんちょうしていますが、とてもたのしみです。",
          romaji: "Betonamu de hantoshi hodo benkyou shite kimashita. Sukoshi kinchou shite imasu ga, totemo tanoshimi desu.",
          translation: "Tôi đã học khoảng nửa năm ở Việt Nam. Tuy có chút hồi hộp nhưng tôi rất hào hứng.",
        },
      ];
    }

    // D2. AI hỏi kỹ năng tiếng Nhật nào khó nhất (どれが一番難しい / 一番難しい / 漢字やリスニング / 何が難しい / 難しいと感じ)
    if (
      msgLower.includes("一番難しい") ||
      msgLower.includes("いちばんむずかしい") ||
      msgLower.includes("どれが一番") ||
      msgLower.includes("何が難しい") ||
      msgLower.includes("難しいと感じ") ||
      (msgLower.includes("難しい") && (msgLower.includes("漢字") || msgLower.includes("リスニング") || msgLower.includes("会話")))
    ) {
      return [
        {
          japanese: "漢字を覚えるのが一番難しいです。似ている形が多くて大変です。",
          furigana: "かんじをおぼえるのがいちばんむずかしいです。にているかたちがおおくてたいへんです。",
          romaji: "Kanji o oboeru no ga ichiban muzukashii desu. Nite iru katachi ga ookute taihen desu.",
          translation: "Ghi nhớ chữ Hán là khó nhất. Có nhiều chữ nét na ná nhau nên rất vất vả.",
        },
        {
          japanese: "リスニングと会話が難しいです。ネイティブのスピードについていくのがまだ大変です。",
          furigana: "リスニングとかいわがむずかしいです。ネイティブのスピードについていくのがまだたいへんです。",
          romaji: "Risuningu to kaiwa ga muzukashii desu. Neitibu no supiido ni tsuite iku no ga mada taihen desu.",
          translation: "Luyện nghe và hội thoại là khó nhất. Bắt kịp tốc độ của người bản xứ vẫn còn hơi khó với tôi.",
        },
      ];
    }

    // D3. AI hỏi về phương pháp học tập hiệu quả (おすすめの勉強法 / どうやって日本語を勉強 / 勉強法はありますか / おすすめの勉強)
    if (
      msgLower.includes("勉強法") ||
      msgLower.includes("べんきょうほう") ||
      msgLower.includes("どうやって日本語") ||
      msgLower.includes("どうやって勉強") ||
      (msgLower.includes("おすすめ") && msgLower.includes("勉強"))
    ) {
      return [
        {
          japanese: "私は単語カード（フラッシュカード）アプリを使って、毎日すきま時間に復習しています。",
          furigana: "わたしはたんごカード（フラッシュカード）アプリをつかって、まいにちすきまじかんにふくしゅうしています。",
          romaji: "Watashi wa tango kaado (furasshu kaado) apuri o tsukatte, mainichi sukima jikan ni fukushuu shite imasu.",
          translation: "Tôi dùng app thẻ từ vựng flashcard để tranh thủ ôn tập mỗi khi có thời gian rảnh rỗi.",
        },
        {
          japanese: "好きなアニメやドラマを日本語の字幕で見たり、シャドーイングの練習をしています。",
          furigana: "すきなアニメやドラマをにほんごのじまくでみたり、シャドーイングのれんしゅうをしています。",
          romaji: "Suki na anime ya dorama o Nihongo no jimaku de mitari, shadooingu no renshuu o shite imasu.",
          translation: "Tôi xem anime hay phim Nhật với phụ đề tiếng Nhật và luyện tập phương pháp Shadowing.",
        },
      ];
    }

    // D4. AI rủ rê học nhóm sau giờ học tại thư viện (図書館 / 放課後 / 一緒に / 復習しませんか / 待ち合わせ)
    if (
      msgLower.includes("図書館") ||
      msgLower.includes("としょかん") ||
      msgLower.includes("放課後") ||
      msgLower.includes("ほうかご") ||
      msgLower.includes("復習しませんか") ||
      (msgLower.includes("一緒") && (msgLower.includes("復習") || msgLower.includes("勉強")))
    ) {
      return [
        {
          japanese: "ぜひ一緒にお願いします！分からない文法を教えてもらえると嬉しいです。",
          furigana: "ぜひいっしょにおねがいします！わからないぶんぽうをおしえてもらえるとうれしいです。",
          romaji: "Zehi issho ni onegaishimasu! Wakaranai bumpou o oshiete moraeru to ureshii desu.",
          translation: "Nhất định rồi, cho mình học cùng với! Nếu có ngữ pháp nào chưa hiểu thì nhờ bạn chỉ giúp nhé.",
        },
        {
          japanese: "はい、喜んで！一人で勉強するより、一緒に復習した方がモチベーションが上がりますね。",
          furigana: "はい、よろこんで！ひとりでべんきょうするより、いっしょにふくしゅうしたほうがモチベーションがあがりますね。",
          romaji: "Hai, yorokonde! Hitori de benkyou suru yori, issho ni fukushuu shita hou ga mochibeeshon ga agarimasu ne.",
          translation: "Vâng, mình rất sẵn lòng! Học cùng nhau chắc chắn sẽ có nhiều động lực hơn tự học một mình.",
        },
      ];
    }

    // E. AI hỏi về đồ ăn Nhật Bản (食べ物 / 料理 / 何が好き / ラーメン / 寿司)
    if (
      msgLower.includes("食べ物") ||
      msgLower.includes("たべもの") ||
      msgLower.includes("料理") ||
      msgLower.includes("りょうり") ||
      msgLower.includes("何が好き")
    ) {
      return [
        {
          japanese: "ラーメンが大好きです！特に豚骨ラーメンが美味しいです。",
          furigana: "ラーメンがだいすきです！とくにとんこつラーメンがおいしいです。",
          romaji: "Raamen ga daisuki desu! Tokuni tonkotsu raamen ga oishii desu.",
          translation: "Tôi rất thích mì ramen! Đặc biệt là ramen xương hầm rất ngon.",
        },
        {
          japanese: "お寿司や天ぷらが好きです。何でも美味しく食べられます。",
          furigana: "おすしやてんぷらがすきです。なんでもおいしくたべられます。",
          romaji: "Osushi ya tempura ga suki desu. Nandemo oishiku taberaremasu.",
          translation: "Tôi thích sushi và tempura. Món ăn Nhật nào tôi cũng thấy ngon.",
        },
      ];
    }

    // F. AI hỏi về sở thích / ngày nghỉ (趣味 / 休み / 普段 / 何をして)
    if (
      msgLower.includes("趣味") ||
      msgLower.includes("しゅみ") ||
      msgLower.includes("休み") ||
      msgLower.includes("やすみ") ||
      msgLower.includes("普段")
    ) {
      return [
        {
          japanese: "休みの日はよく公園を散歩したり、写真を撮ったりします。",
          furigana: "やすみのひはよくこうえんをさんぽしたり、しゃしんをとったりします。",
          romaji: "Yasumi no hi wa yoku kouen o sanpo shitari, shashin o tottari shimasu.",
          translation: "Ngày nghỉ tôi hay đi dạo công viên và chụp ảnh.",
        },
        {
          japanese: "家でアニメを見たり、日本語を勉強したりしています。",
          furigana: "いえでアニメをみたり、にほんごをべんきょうしたりしています。",
          romaji: "Ie de anime o mitari, Nihongo o benkyou shitari shite imasu.",
          translation: "Tôi ở nhà xem anime hoặc tự học tiếng Nhật.",
        },
      ];
    }

    // G. AI hỏi về lý do học tiếng Nhật / mục tiêu tương lai (どうして / 勉強しよう / 将来 / 目標)
    if (
      msgLower.includes("どうして") ||
      msgLower.includes("勉強しよう") ||
      msgLower.includes("将来") ||
      msgLower.includes("目標")
    ) {
      return [
        {
          japanese: "将来、日本のIT企業でエンジニアとして働きたいからです。",
          furigana: "しょうらい、にほんのアイティーきぎょうでエンジニアとしてはたらきたいからです。",
          romaji: "Shourai, Nihon no IT kigyou de enjinia toshite hatarakitai kara desu.",
          translation: "Vì trong tương lai tôi muốn làm kỹ sư IT tại một doanh nghiệp Nhật Bản.",
        },
        {
          japanese: "日本のアニメや文化が大好きで、自由に日本語で話せるようになりたいからです。",
          furigana: "にほんのアニメやぶんかがだいすきで、じゆうににほんごではなせるようになりたいからです。",
          romaji: "Nihon no anime ya bunka ga daisuki de, jiyuu ni Nihongo de hanaseru you ni naritai kara desu.",
          translation: "Vì tôi rất yêu thích văn hóa anime Nhật Bản và muốn giao tiếp tiếng Nhật lưu loát.",
        },
      ];
    }

    // H. AI chào tạm biệt / kết thúc (頑張りましょう / またね / 失礼 / また次回 / お疲れ様)
    if (
      msgLower.includes("頑張りましょう") ||
      msgLower.includes("がんばりましょう") ||
      msgLower.includes("またね") ||
      msgLower.includes("また次回") ||
      msgLower.includes("お疲れ様") ||
      msgLower.includes("よろしくおねがいしますね")
    ) {
      return [
        {
          japanese: "はい！こちらこそ、これからどうぞよろしくお願いします！",
          furigana: "はい！こちらこそ、これからどうぞよろしくおねがいします！",
          romaji: "Hai! Kochira koso, korekara douzo yoroshiku onegaishimasu!",
          translation: "Vâng! Tôi cũng rất mong nhận được sự giúp đỡ của bạn từ nay về sau ạ!",
        },
        {
          japanese: "お話しできてとても楽しかったです。ありがとうございました！",
          furigana: "おはなしできてとてもたのしかったです。ありがとうございました！",
          romaji: "Ohanashi dekite totemo tanoshikatta desu. Arigatou gozaimashita!",
          translation: "Nói chuyện với bạn rất vui. Cảm ơn bạn rất nhiều ạ!",
        },
      ];
    }

    // 1. Bakery / Bread / Tiệm bánh (e.g. Mua bánh mì ở tiệm bánh Nhật Bản)
    if (
      titleLower.includes("bánh mì") ||
      titleLower.includes("tiệm bánh") ||
      titleLower.includes("bánh") ||
      titleLower.includes("bakery") ||
      titleLower.includes("パン") ||
      msgLower.includes("パン")
    ) {
      if (
        msgLower.includes("こんにちは") ||
        msgLower.includes("いらっしゃい") ||
        msgLower.includes("おはよう") ||
        msgLower.includes("皆さん")
      ) {
        return [
          {
            japanese: "こんにちは！美味しそうなパンですね。",
            furigana: "こんにちは！おいしそうなパンですね。",
            romaji: "Konnichiwa! Oishisou na pan desu ne.",
            translation: "Chào bạn! Bánh mì nhìn ngon quá.",
          },
          {
            japanese: "こんにちは！おすすめのパンは何ですか？",
            furigana: "こんにちは！おすすめのパンはなんですか？",
            romaji: "Konnichiwa! Osusume no pan wa nan desu ka?",
            translation: "Chào bạn! Món bánh mì gợi ý đặc biệt của quán là gì ạ?",
          },
          {
            japanese: "焼きたてのパンはありますか？",
            furigana: "やきたてのパンはありますか？",
            romaji: "Yakitate no pan wa arimasu ka?",
            translation: "Tiệm có bánh mì mới nướng ra lò không ạ?",
          },
        ];
      }
      return [
        {
          japanese: "このクロワッサンを二つください。",
          furigana: "このクロワッサンをふたつください。",
          romaji: "Kono kurowassan o futatsu kudasai.",
          translation: "Cho tôi 2 chiếc bánh sừng bò này nhé.",
        },
        {
          japanese: "持ち帰りでお願いします。",
          furigana: "もちかえりでおねがいします。",
          romaji: "Mochikaeri de onegaishimasu.",
          translation: "Cho tôi mang về ạ.",
        },
      ];
    }

    // 2. Cafe / Drink / Quán cafe
    if (
      titleLower.includes("cafe") ||
      titleLower.includes("cà phê") ||
      titleLower.includes("カフェ") ||
      titleLower.includes("uống") ||
      msgLower.includes("コーヒー") ||
      msgLower.includes("ラテ")
    ) {
      if (
        msgLower.includes("こんにちは") ||
        msgLower.includes("いらっしゃい") ||
        msgLower.includes("皆さん")
      ) {
        return [
          {
            japanese: "こんにちは！アイスカフェラテをお願いします。",
            furigana: "こんにちは！アイスカフェラテをおねがいします。",
            romaji: "Konnichiwa! Aisu kaferate o onegaishimasu.",
            translation: "Chào bạn! Cho tôi một ly cà phê latte đá nhé.",
          },
          {
            japanese: "おすすめのドリンクは何ですか？",
            furigana: "おすすめのドリンクはなんですか？",
            romaji: "Osusume no dorinku wa nan desu ka?",
            translation: "Đồ uống gợi ý của quán là gì vậy ạ?",
          },
        ];
      }
      return [
        {
          japanese: "店内でお願いします。",
          furigana: "てんないでおねがいします。",
          romaji: "Tennai de onegaishimasu.",
          translation: "Dùng tại quán ạ.",
        },
        {
          japanese: "持ち帰りでお願いします。",
          furigana: "もちかえりでおねがいします。",
          romaji: "Mochikaeri de onegaishimasu.",
          translation: "Mang về ạ.",
        },
      ];
    }

    // 3. Convenience Store / Shopping / Siêu thị
    if (
      titleLower.includes("tiện lợi") ||
      titleLower.includes("siêu thị") ||
      titleLower.includes("mua") ||
      titleLower.includes("combini") ||
      titleLower.includes("コンビニ") ||
      titleLower.includes("スーパー")
    ) {
      return [
        {
          japanese: "袋は大丈夫です。",
          furigana: "ふくろはだいじょうぶです。",
          romaji: "Fukuro wa daijoubu desu.",
          translation: "Tôi không cần túi ni-lông ạ.",
        },
        {
          japanese: "Suicaで支払います。",
          furigana: "スイカでしはらいます。",
          romaji: "Suica de shiharaimasu.",
          translation: "Tôi thanh toán bằng thẻ Suica.",
        },
        {
          japanese: "レシートをください。",
          furigana: "レシートをください。",
          romaji: "Reshiito o kudasai.",
          translation: "Cho tôi xin hóa đơn ạ.",
        },
      ];
    }

    // 4. Asking directions / Station / Tàu điện
    if (
      titleLower.includes("đường") ||
      titleLower.includes("ga") ||
      titleLower.includes("tàu") ||
      titleLower.includes("駅") ||
      titleLower.includes("道") ||
      msgLower.includes("駅")
    ) {
      return [
        {
          japanese: "すみません、新宿駅へはどう行けばいいですか？",
          furigana: "すみません、しんじゅくえきへはどういけばいいですか？",
          romaji: "Sumimasen, Shinjuku-eki e wa dou ikeba ii desu ka?",
          translation: "Xin lỗi, làm thế nào để đi đến ga Shinjuku ạ?",
        },
        {
          japanese: "切符売り場はどこにありますか？",
          furigana: "きっぷうりばはどこにありますか？",
          romaji: "Kippu uriba wa doko ni arimasu ka?",
          translation: "Quầy bán vé ở đâu vậy ạ?",
        },
      ];
    }

    // 5. Self-introduction / Meeting new people / Giới thiệu bản thân
    if (
      titleLower.includes("chào hỏi") ||
      titleLower.includes("giới thiệu") ||
      titleLower.includes("lớp học") ||
      titleLower.includes("自己紹介") ||
      msgLower.includes("名前") ||
      msgLower.includes("初めまして")
    ) {
      return [
        {
          japanese: `初めまして！私の名前は${identity.katakanaName}です。どうぞよろしくお願いします。`,
          furigana: `はじめまして！わたしのなまえは${identity.katakanaName}です。どうぞよろしくおねがいします。`,
          romaji: `Hajimemashite! Watashi no namae wa ${identity.romajiName} desu. Douzo yoroshiku onegaishimasu.`,
          translation: `Rất vui được gặp bạn! Tên tôi là ${identity.givenName}. Rất mong được giúp đỡ.`,
        },
        {
          japanese: `${identity.katakanaName}と申します。ベトナムから来ました。`,
          furigana: `${identity.katakanaName}ともうします。ベトナムからきました。`,
          romaji: `${identity.romajiName} to moushimasu. Betonamu kara kimashita.`,
          translation: `Tôi tên là ${identity.givenName}. Tôi đến từ Việt Nam.`,
        },
      ];
    }

    // 6. Job interview / Business / Công sở
    if (
      titleLower.includes("phỏng vấn") ||
      titleLower.includes("công việc") ||
      titleLower.includes("báo cáo") ||
      titleLower.includes("面接") ||
      titleLower.includes("ビジネス")
    ) {
      return [
        {
          japanese: `${identity.katakanaName}と申します。本日はお時間をいただきありがとうございます。`,
          furigana: `${identity.katakanaName}ともうします。ほんじつはおじかんをいただきありがとうございます。`,
          romaji: `${identity.romajiName} to moushimasu. Honjitsu wa ojikan o itadaki arigatou gozaimasu.`,
          translation: `Tôi tên là ${identity.givenName}. Cảm ơn quý công ty đã dành thời gian hôm nay ạ.`,
        },
        {
          japanese: "どうぞよろしくお願いいたします。",
          furigana: "どうぞよろしくおねがいいたします。",
          romaji: "Douzo yoroshiku onegai itashimasu.",
          translation: "Kính mong được sự quan tâm và giúp đỡ ạ.",
        },
      ];
    }

    // 7. General greeting matches (e.g. "皆さんこんにちは", "こんにちは", "おはようございます")
    if (
      msgLower.includes("こんにちは") ||
      msgLower.includes("おはよう") ||
      msgLower.includes("こんばんは") ||
      msgLower.includes("皆さん")
    ) {
      return [
        {
          japanese: "こんにちは！よろしくお願いします。",
          furigana: "こんにちは！よろしくおねがいします。",
          romaji: "Konnichiwa! Yoroshiku onegaishimasu.",
          translation: "Xin chào bạn! Rất mong được giúp đỡ.",
        },
        {
          japanese: "こんにちは！今日もよろしくお願いします。",
          furigana: "こんにちは！きょうもよろしくおねがいします。",
          romaji: "Konnichiwa! Kyou mo yoroshiku onegaishimasu.",
          translation: "Xin chào! Hôm nay cũng nhờ bạn giúp đỡ nhé.",
        },
      ];
    }

    // 8. General default fallback
    return [
      {
        japanese: "はい、分かりました。",
        furigana: "はい、わかりました。",
        romaji: "Hai, wakarimashita.",
        translation: "Vâng, tôi hiểu rồi ạ.",
      },
      {
        japanese: "詳しく教えていただけますか？",
        furigana: "くわしくおしえていただけますか？",
        romaji: "Kuwashiku oshiete itadakemasu ka?",
        translation: "Bạn có thể chỉ rõ hơn giúp tôi được không ạ?",
      },
    ];
  }

  /**
   * 5. AI Vocabulary Classifier & Enricher
   * Phân loại chính xác từ loại (wordType: noun, verb, adjective, adverb, phrase, other),
   * Furigana và Romaji cho danh sách từ vựng tiếng Nhật.
   */
  static async enrichVocabularyBatchWithAi(items) {
    if (!Array.isArray(items) || items.length === 0) return items;

    // 1. Thử gọi Gemini nếu có key
    if (this.hasGeminiKeys()) {
      try {
        const prompt = `
Bạn là chuyên gia ngôn ngữ học tiếng Nhật và giáo trình JLPT của JTalk AI.
Nhiệm vụ: Phân tích chính xác từ loại (wordType), bổ sung Furigana Hiragana chuẩn xác, Romaji Hepburn, và tinh chỉnh nghĩa tiếng Việt gọn gàng cho danh sách từ vựng sau.

QUY TẮC PHÂN LOẠI TỪ LOẠI (wordType) BẮT BUỘC CHỌN 1 TRONG CÁC GIÁ TRỊ:
- "verb": Động từ (nhóm 1 Godan, nhóm 2 Ichidan, nhóm 3 Suru/Kuru). Ví dụ: 寝る, 食べる, 行く, 話す, 待つ, 呼ぶ, 勉強する.
- "noun": Danh từ (người, đồ vật, địa điểm, thời gian, sự việc). Ví dụ: 学生, 本, 車, 朝, 友達, 日本, 部屋.
- "adjective": Tính từ (tính từ đuôi -i như 高い, 暑い, 広い; và tính từ đuôi -na như 静か, きれい, 元気, 有名).
- "adverb": Phó từ (bổ nghĩa cho động từ/tính từ). Ví dụ: とても, たくさん, ゆっくり, ぜんぜん, もう, まだ, ちょっと.
- "phrase": Cụm từ, thành ngữ, câu chào hỏi giao tiếp cố định. Ví dụ: こんにちは, おはようございます, お疲れ様です, よろしくお願いします, 初めまして.
- "other": Trợ từ, thán từ hoặc từ loại khác.

Danh sách từ cần xử lý:
${JSON.stringify(
  items.map((i) => ({
    id: i.id || i._id,
    kanji: i.kanji || i.word,
    furigana: i.furigana || "",
    meaning: i.meaning || i.definition || "",
  }))
)}

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm markdown ngoài json):
{
  "enrichedItems": [
    {
      "id": "id tương ứng của từng từ",
      "kanji": "từ tiếng Nhật chuẩn có Kanji nếu có",
      "furigana": "cách đọc Hiragana chuẩn",
      "romaji": "romaji phiên âm chuẩn Hepburn",
      "meaning": "nghĩa tiếng Việt hoặc tiếng Anh rõ ràng, súc tích",
      "wordType": "verb"
    }
  ]
}
`;

        const raw = await this.callGemini({ prompt, temperature: 0.1, isJson: true });
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && Array.isArray(parsed.enrichedItems) && parsed.enrichedItems.length > 0) {
          const map = new Map();
          parsed.enrichedItems.forEach((p) => {
            if (p.id) map.set(String(p.id), p);
          });

          return items.map((item) => {
            const key = String(item.id || item._id);
            const enriched = map.get(key);
            if (enriched) {
              return {
                ...item,
                kanji: enriched.kanji || item.kanji,
                furigana: enriched.furigana || item.furigana,
                romaji: enriched.romaji || item.romaji,
                meaning: enriched.meaning || item.meaning,
                wordType: ["noun", "verb", "adjective", "adverb", "phrase", "other"].includes(
                  enriched.wordType
                )
                  ? enriched.wordType
                  : item.wordType || "noun",
              };
            }
            return item;
          });
        }
      } catch (err) {
        console.warn("Lỗi gọi Gemini AI phân loại từ vựng, chuyển sang Heuristic NLP:", err.message);
      }
    }

    // 2. Fallback Heuristic NLP tiếng Nhật (Chạy offline siêu tốc và cực kỳ chuẩn xác)
    return items.map((item) => {
      const kanji = (item.kanji || item.word || "").trim();
      const meaning = (item.meaning || item.definition || "").toLowerCase().trim();
      const furigana = (item.furigana || "").trim();

      let detectedType = "noun";

      // A. Nhận diện Động từ (Verb)
      const verbEndings = /[うくぐすつぬぶむる]$/;
      const isSuruVerb = kanji.endsWith("する") || furigana.endsWith("する");
      const hasVerbMeaning =
        meaning.startsWith("to ") ||
        /\b(ăn|uống|đi|ngủ|đến|nói|chạy|học|làm|mua|bán|xem|nhìn|đọc|viết|nghe|nghĩ|chờ|gọi|mặc|mở|đóng|bắt đầu|kết thúc)\b/.test(
          meaning
        );

      if (isSuruVerb || (verbEndings.test(kanji) && (hasVerbMeaning || kanji.length <= 4))) {
        detectedType = "verb";
      }
      // B. Nhận diện Tính từ (Adjective)
      else if (
        kanji.endsWith("い") &&
        /[一-龯]/.test(kanji) &&
        !verbEndings.test(kanji.slice(-1))
      ) {
        detectedType = "adjective";
      } else if (
        /\b(đẹp|sạch|yên tĩnh|nổi tiếng|khỏe mạnh|thân thiện|rảnh rỗi|thích|ghét|vất vả|tiện lợi|quan trọng)\b/.test(
          meaning
        ) ||
        meaning.includes("(na-adj)") ||
        meaning.includes("(adj)")
      ) {
        detectedType = "adjective";
      }
      // C. Nhận diện Phó từ (Adverb)
      else if (
        /^(とても|たいへん|すごく|ゆっくり|たくさん|もう|まだ|ちょっと|すこし|ぜんぜん|すぐ|だんだn|たぶん|かならず|ぜひ)$/.test(
          furigana || kanji
        ) ||
        /\b(rất|lắm|nhiều|chậm rãi|chưa|đã|ngay lập tức|hoàn toàn|chắc chắn)\b/.test(meaning)
      ) {
        detectedType = "adverb";
      }
      // D. Nhận diện Cụm từ (Phrase)
      else if (
        kanji.length > 6 ||
        kanji.includes(" ") ||
        /^(こんにちは|おはよう|こんばんは|さようなら|ありがとう|いただきます|ごちそうさま|お疲れ様|初めまして|よろしく)/.test(
          furigana || kanji
        )
      ) {
        detectedType = "phrase";
      }

      return {
        ...item,
        wordType: detectedType,
      };
    });
  }
}

export default AiService;
