import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_CONNECTIONSTRING,

  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "default_access_secret_change_in_prod",
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTokenTtlMs: 14 * 24 * 60 * 60 * 1000, // 14 days
  },

  quota: {
    freeDailyPracticeLimit: parseInt(process.env.FREE_DAILY_PRACTICE_LIMIT || "2", 10),
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    // Google Cloud Speech-to-Text & Text-to-Speech
    googleApiKey: process.env.GOOGLE_CLOUD_API_KEY || "",
    googleSpeechLanguage: process.env.GOOGLE_SPEECH_LANGUAGE || "ja-JP",
    googleTtsVoice: process.env.GOOGLE_TTS_VOICE || "ja-JP-Neural2-B", // Giọng nữ chuẩn bản xứ
    // VOICEVOX Engine (Mã nguồn mở AI giọng Nhật số 1 - Shikoku Metan & Zundamon)
    voicevoxEndpoint: process.env.VOICEVOX_ENDPOINT || "http://localhost:50021",
    voicevoxSpeaker: parseInt(process.env.VOICEVOX_DEFAULT_SPEAKER || "2", 10), // 2: 四国めたん, 3: ずんだもん, 13: 青山龍星
    // Azure (Legacy fallback)
    azureSpeechKey: process.env.AZURE_SPEECH_KEY || "",
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION || "southeastasia",
    azureSpeechLanguage: process.env.AZURE_SPEECH_LANGUAGE || "ja-JP",
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || "local", // local | s3 | cloudinary
    s3: {
      bucket: process.env.AWS_S3_BUCKET || "",
      region: process.env.AWS_REGION || "ap-southeast-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    },
  },

  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO_TEST_PARTNER",
    accessKey: process.env.MOMO_ACCESS_KEY || "MOMO_TEST_ACCESS_KEY",
    secretKey: process.env.MOMO_SECRET_KEY || "MOMO_TEST_SECRET_KEY",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:5173/payment/momo/callback",
    ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:5001/api/v1/payments/momo/webhook",
  },
};

export default config;
