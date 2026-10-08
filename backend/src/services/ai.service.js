import config from "../config/index.js";

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

    // Danh sách model ưu tiên xử lý tiếng Nhật nhanh và tối ưu tốc độ (< 1s)
    const candidateModels = [
      config.ai.geminiModel,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.1-flash-lite",
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
          const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s responsive timeout

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
          console.warn(`[GeminiKeyPool] Model ${model} với key [${maskedKey}] chưa thành công:`, err.message);
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
- Phân rã câu thành danh sách các từ/cụm từ có nghĩa (kanji, trợ từ, đuôi động từ).
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

    // Segment expected sentence into words, filtering out pure punctuation marks
    const rawTokens = expectedSentence.split(/([、。！？!?,.\s~…]+|(?<=[はがをにでともへからまで]))/).filter(Boolean);
    const words = rawTokens
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && !/^[、。！？!?,.\s~…-]+$/.test(w));

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
  }) {
    // 1. Try Google Gemini Key Pool (Multi-key round-robin & auto-failover)
    if (this.hasGeminiKeys()) {
      try {
        return await this.roleplayWithGemini({ scenarioTitle, level, conversationHistory, userMessage });
      } catch (err) {
        console.warn("Lỗi gọi Gemini Key Pool cho Roleplay, thử Claude/OpenAI/Fallback:", err.message);
      }
    }

    // 2. Try Claude (Anthropic)
    if (config.ai.anthropicApiKey) {
      try {
        return await this.roleplayWithClaude({ scenarioTitle, level, conversationHistory, userMessage });
      } catch (err) {
        console.warn("Lỗi gọi Claude API cho Roleplay, thử OpenAI/Fallback:", err.message);
      }
    }

    // 3. Try OpenAI
    if (config.ai.openaiApiKey) {
      try {
        return await this.roleplayWithOpenAI({ scenarioTitle, level, conversationHistory, userMessage });
      } catch (err) {
        console.warn("Lỗi gọi OpenAI API cho Roleplay, dùng Heuristic Fallback:", err.message);
      }
    }

    // 4. Fallback Heuristic Conversational Engine
    return this.roleplayHeuristically({ scenarioTitle, level, conversationHistory, userMessage });
  }

  /**
   * Roleplay turn with Google Gemini API
   */
  static async roleplayWithGemini({ scenarioTitle, level, conversationHistory, userMessage }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage });
    const rawContent = await this.callGemini({ prompt, temperature: 0.7, isJson: true });
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage);
  }

  /**
   * Roleplay turn with Claude API
   */
  static async roleplayWithClaude({ scenarioTitle, level, conversationHistory, userMessage }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage });

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
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage);
  }

  /**
   * Roleplay turn with OpenAI API
   */
  static async roleplayWithOpenAI({ scenarioTitle, level, conversationHistory, userMessage }) {
    const prompt = this.buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage });

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
    return this.parseRoleplayJson(rawContent, scenarioTitle, level, conversationHistory, userMessage);
  }

  /**
   * Prompt builder for Roleplay with strict conversation flow & off-topic clarification
   */
  static buildRoleplayPrompt({ scenarioTitle, level, conversationHistory, userMessage }) {
    const formattedHistory = (conversationHistory || [])
      .slice(-8)
      .map((msg) => `${msg.sender === "ai" ? "Character (AI)" : "Learner"}: "${msg.japanese}"`)
      .join("\n");

    return `
Hãy đóng vai nhân vật bản ngữ tiếng Nhật trong tình huống giao tiếp: "${scenarioTitle}".
Trình độ người học: JLPT ${level}.

QUY TẮC CỐT LÕI (TUYỆT ĐỐI TUÂN THỦ):
1. TIẾN TRÌNH HỘI THOẠI & KHÔNG LẶP LẠI CÂU HỎI CŨ:
   - TUYỆT ĐỐI KHÔNG lặp lại câu hỏi mở đầu hoặc bất kỳ câu hỏi nào bạn đã hỏi trong lịch sử trò chuyện (xem phần Lịch sử trò chuyện bên dưới).
   - Mỗi lượt hội thoại phải phát triển câu chuyện tiến lên phía trước theo diễn biến thực tế.

2. XỬ LÝ KHI NGƯỜI HỌC TRẢ LỜI LINH TINH / LẠC ĐỀ / KHÔNG HIỂU / CÂU VÔ NGHĨA:
   - Nếu câu người học vừa nói ("${userMessage}") không ăn nhập với câu hỏi trước, nói lạc đề, hoặc là từ ngữ vô nghĩa:
     * AI TUYỆT ĐỐI KHÔNG quay lại câu hỏi ban đầu và KHÔNG giả vờ như đã hiểu.
     * AI PHẢI phản xạ bằng câu nghi vấn làm rõ hoặc ngạc nhiên lịch sự (Clarifying / Puzzled questions) như người Nhật ngoài đời:
       Ví dụ:
       + 「えっ、すみません、よく聞き取れなかったのですが、もう一度言っていただけますか？」(Ủa, xin lỗi tôi chưa nghe rõ lắm, bạn có thể nói lại một lần nữa được không?)
       + 「あれ？急にどうしたんですか？今の話と少し違うような気がしますが…」(Ủa? Sao tự nhiên lại vậy ta? Hình như hơi khác chủ đề chúng ta đang nói một chút thì phải…)
       + 「すみません、それはどういう意味ですか？もう少し分かりやすく教えてくれますか？」(Xin lỗi, điều đó nghĩa là gì vậy ạ? Bạn có thể giải thích dễ hiểu hơn một chút được không?)
     * Trong "userEvaluation": Chấm điểm naturalnessScore thấp hơn (35-55), grammarAdvice giải thích nhẹ nhàng bằng tiếng Việt rằng câu nói chưa phù hợp hoặc lạc đề, gợi ý câu trả lời đúng trọng tâm.
     * Trong "suggestedAnswers": Cung cấp 2-3 câu trả lời mẫu đúng trọng tâm ngữ cảnh để hỗ trợ người học lấy lại mạch đối thoại.

3. KHI NGƯỜI HỌC TRẢ LỜI TỰ NHIÊN VÀ ĐÚNG TRỌNG TÂM:
   - AI đáp lại bằng từ đệm cảm thán (Aizuchi: 「そうなんですね！」「なるほど！」「いいですね！」...) và hỏi tiếp 1 câu mở rộng/đào sâu vào thông tin người học vừa chia sẻ.
   - Câu trả lời của AI ngắn gọn (1-2 câu tiếng Nhật), tự nhiên, chuẩn giao tiếp bản xứ ${level}.

4. ĐÁNH GIÁ CÂU NGƯỜI HỌC VỪA NÓI (userEvaluation):
   - naturalnessScore: Chấm điểm độ tự nhiên (0-100).
   - grammarAdvice: Nhận xét ngắn gọn, thực tế bằng tiếng Việt.
   - betterExpression: Gợi ý cách diễn đạt tự nhiên hơn của người bản xứ (nếu có).
   - betterExpressionFurigana: Phiên âm Hiragana/Katakana cho toàn bộ chữ Hán trong betterExpression.

5. GỢI Ý 2-3 CÂU TRẢ LỜI TIẾP THEO (suggestedAnswers):
   - Mỗi câu có đủ: japanese, furigana (phiên âm toàn bộ chữ Hán sang Hiragana), romaji, translation (tiếng Việt).

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
  static parseRoleplayJson(rawText, scenarioTitle, level, conversationHistory, userMessage) {
    try {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

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
      return this.roleplayHeuristically({ scenarioTitle, level, conversationHistory, userMessage });
    }
  }

  /**
   * Dynamic Heuristic Roleplay Fallback (Zero external cost / offline resilient / turn-aware progression)
   */
  static roleplayHeuristically({ scenarioTitle = "", level = "N5", conversationHistory = [], userMessage = "" }) {
    const cleanMsg = (userMessage || "").trim().toLowerCase();
    const userTurns = (conversationHistory || []).filter(
      (m) => m.sender === "user" || m.role === "user"
    ).length;
    const currentTurn = userTurns + 1; // 1, 2, 3, 4...

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
      if (currentTurn === 1) {
        return {
          aiReply: {
            japanese: "初めまして！お会いできて嬉しいです。日本に来てどのくらいになりますか？",
            furigana: "はじめまして！おあいできてうれしいです。にほんにきてどのくらいになりますか？",
            romaji: "Hajimemashite! Oai dekite ureshii desu. Nihon ni kite dono kurai ni narimasu ka?",
            translation: "Rất vui được gặp bạn! Bạn đã sang Nhật được bao lâu rồi?",
          },
          userEvaluation: {
            naturalnessScore: 92,
            grammarAdvice: "Lời chào hỏi rất tự nhiên và đúng lễ nghi giao tiếp của người Nhật.",
            betterExpression: "初めまして、どうぞよろしくお願いします。",
            betterExpressionFurigana: "はじめまして、どうぞよろしくおねがいします。",
          },
          suggestedAnswers: [
            {
              japanese: "まだ半年くらいです。",
              furigana: "まだはんとし・はんねんくらいです。",
              romaji: "Mada hantoshi kurai desu.",
              translation: "Mới khoảng nửa năm thôi ạ.",
            },
            {
              japanese: "先月日本に来たばかりです。",
              furigana: "せんげつにほんにきたばかりです。",
              romaji: "Sengetsu Nihon ni kita bakari desu.",
              translation: "Tôi vừa sang Nhật hồi tháng trước ạ.",
            },
          ],
        };
      }

      if (currentTurn === 2) {
        return {
          aiReply: {
            japanese: "そうなんですね！日本での生活にはもう慣れましたか？日本の食べ物や街はどうですか？",
            furigana: "そうなんですね！にほんでのせいかつにはもうなれましたか？にほんのたべものやまちはどうですか？",
            romaji: "Sou nan desu ne! Nihon de no seikatsu ni wa mou naremashita ka? Nihon no tabemono ya machi wa dou desu ka?",
            translation: "Ra là vậy! Bạn đã quen với cuộc sống ở Nhật chưa? Đồ ăn và đường phố Nhật Bản thế nào?",
          },
          userEvaluation: {
            naturalnessScore: 90,
            grammarAdvice: "Cách diễn đạt mốc thời gian rất chuẩn ngữ pháp và tự nhiên. Hãy tiếp tục duy trì nhé!",
            betterExpression: `${userMessage}。生活にも少しずつ慣れてきました。`,
            betterExpressionFurigana: `${userMessage}。せいかつにもすこしずつなれてきました。`,
          },
          suggestedAnswers: [
            {
              japanese: "はい、だんだん慣れてきました。ラーメンがとても美味しいです。",
              furigana: "はい、だんだんなれてきました。ラーメンがとてもおいしいです。",
              romaji: "Hai, dandan narete kimashita. Raamen ga totemo oishii desu.",
              translation: "Vâng, tôi dần quen rồi. Mì Ramen ngon lắm ạ.",
            },
            {
              japanese: "まだ少し慣れていませんが、街がとても綺麗で気に入っています。",
              furigana: "まだすこしなれていませんが、まちがとてもきれいで気にいっています。",
              romaji: "Mada sukoshi narete imasen ga, machi ga totemo kirei de ki ni itte imasu.",
              translation: "Tôi vẫn chưa quen lắm, nhưng đường phố rất sạch đẹp và tôi rất thích.",
            },
          ],
        };
      }

      if (currentTurn === 3) {
        return {
          aiReply: {
            japanese: "いいですね！休みの日は普段どんなことをして過ごしていますか？趣味は何ですか？",
            furigana: "いいですね！やすみのひはふだんどんなことをしてすごしていますか？しゅみはなんですか？",
            romaji: "Ii desu ne! Yasumi no hi wa fudan donna koto o shite sugoshite imasu ka? Shuumi wa nan desu ka?",
            translation: "Tuyệt quá! Ngày nghỉ bạn thường làm gì? Sở thích của bạn là gì?",
          },
          userEvaluation: {
            naturalnessScore: 93,
            grammarAdvice: "Bạn dùng từ vựng miêu tả cảm nhận rất phong phú và chính xác.",
            betterExpression: `${userMessage}。日本の文化にもとても興味があります。`,
            betterExpressionFurigana: `${userMessage}。にほんのぶんかにもとてもきょうみがあります。`,
          },
          suggestedAnswers: [
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
          ],
        };
      }

      // Turn 4+ (Closing)
      return {
        aiReply: {
          japanese: "素敵ですね！これから同じクラスの仲間として、一緒に日本語の勉強を頑張りましょう！よろしくお願いしますね。",
          furigana: "すてきですね！これからおなじクラスのなかまとして、いっしょににほんごのべんきょうをがんばりましょう！よろしくおねがいしますね。",
          romaji: "Suteki desu ne! Korekara onaji kurasu no nakama toshite, issho ni Nihongo no benkyou o gambarimashou! Yoroshiku onegaishimasu ne.",
          translation: "Tuyệt vời quá! Từ giờ là bạn cùng lớp rồi, chúng mình cùng nhau cố gắng học tiếng Nhật nhé! Rất mong được giúp đỡ.",
        },
        userEvaluation: {
          naturalnessScore: 96,
          grammarAdvice: "Cuộc đối thoại diễn ra rất lưu loát và tự nhiên. Bạn có phản xạ tiếng Nhật rất tốt!",
          betterExpression: "はい！こちらこそ、どうぞよろしくお願いします！",
          betterExpressionFurigana: "はい！こちらこそ、どうぞよろしくおねがいします！",
        },
        suggestedAnswers: [
          {
            japanese: "はい！こちらこそ、どうぞよろしくお願いします！",
            furigana: "はい！こちらこそ、どうぞよろしくおねがいします！",
            romaji: "Hai! Kochira koso, douzo yoroshiku onegaishimasu!",
            translation: "Vâng! Tôi cũng rất mong nhận được sự giúp đỡ của bạn!",
          },
          {
            japanese: "ありがとうございます！仲良くしてくださいね。",
            furigana: "ありがとうございます！なかよくしてくださいね。",
            romaji: "Arigatou gozaimasu! Nakayoku shite kudasai ne.",
            translation: "Cảm ơn bạn! Chúng mình hãy làm bạn tốt nhé.",
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

    // 5. Phản xạ đa lượt tổng quát cho bất kỳ chủ đề nào khác (Luôn tiến về phía trước, không lặp câu hỏi)
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
  }) {
    // 1. Try Google Gemini Key Pool (Multi-key round-robin & auto-failover)
    if (this.hasGeminiKeys()) {
      try {
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory });
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
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory });
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
        const prompt = this.buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory });
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
      suggestedAnswers: this.getHeuristicSuggestions({ scenarioTitle, aiMessage, level }),
    };
  }

  /**
   * Prompt builder for Roleplay Suggestions
   */
  static buildSuggestionsPrompt({ scenarioTitle, level, aiMessage, conversationHistory = [] }) {
    const formattedHistory = conversationHistory
      .slice(-4)
      .map((msg) => `${msg.sender === "ai" ? "Character (AI)" : "Learner"}: "${msg.japanese}"`)
      .join("\n");

    return `
Bạn là chuyên gia sư phạm tiếng Nhật bản ngữ của JTalk AI.
Tình huống giao tiếp thực tế: "${scenarioTitle}".
Trình độ người học: JLPT ${level}.
Câu nói của đối phương (nhân vật AI): "${aiMessage}".
${formattedHistory ? `Lịch sử đối thoại trước đó:\n${formattedHistory}` : ""}

Nhiệm vụ:
Tạo ra 2 đến 3 câu gợi ý phản xạ ngắn gọn (1 câu tiếng Nhật mỗi gợi ý), TỰ NHIÊN và ĐÚNG NGỮ CẢNH NHẤT để người học có thể chọn đáp lại ngay câu nói của đối phương.
Các gợi ý phải sát với tình huống thực tế của "${scenarioTitle}" và câu của nhân vật vừa nói ("${aiMessage}").

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
  static getHeuristicSuggestions({ scenarioTitle = "", aiMessage = "", level = "N5" }) {
    const titleLower = (scenarioTitle || "").toLowerCase();
    const msgLower = (aiMessage || "").toLowerCase();

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
          japanese: "初めまして！どうぞよろしくお願いします。",
          furigana: "はじめまして！どうぞよろしくおねがいします。",
          romaji: "Hajimemashite! Douzo yoroshiku onegaishimasu.",
          translation: "Rất vui được gặp bạn! Rất mong được giúp đỡ.",
        },
        {
          japanese: "こんにちは！ベトナムから来ました。",
          furigana: "こんにちは！ベトナムからきました。",
          romaji: "Konnichiwa! Betonamu kara kimashita.",
          translation: "Xin chào! Tôi đến từ Việt Nam.",
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
          japanese: "本日はお時間をいただきありがとうございます。",
          furigana: "ほんじつはおじかんをいただきありがとうございます。",
          romaji: "Honjitsu wa ojikan o itadaki arigatou gozaimasu.",
          translation: "Cảm ơn quý công ty đã dành thời gian hôm nay ạ.",
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
}

export default AiService;
