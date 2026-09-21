import api from "@/services/api";
import type {
  Practice,
  ProcessVoiceResponse,
  SavePracticeResponse,
  RoleplayMessage,
  RoleplayChatResponse,
} from "@/types";

export interface ProcessVoicePayload {
  lessonId?: string;
  sampleSentence?: string;
  transcript?: string;
  audioBlob?: Blob;
  audioBase64?: string;
  mimeType?: string;
}

export interface SavePracticePayload {
  lessonId: string;
  sampleSentence?: string;
  transcript?: string;
  scores?: {
    pronunciation: number;
    accuracy: number;
    fluency: number;
    completeness: number;
  };
  overallScore?: number;
  wordFeedback?: Array<{
    word: string;
    isCorrect: boolean;
    accuracyScore?: number;
    errorType?: string;
    suggestion?: string;
  }>;
  feedback?: {
    grammarSuggestions?: string[];
    generalAdvice?: string;
  };
  durationSeconds?: number;
  audioUrl?: string;
}

export const practiceService = {
  /**
   * Process user voice:
   * Supports:
   * 1. Direct Web Speech API transcript (zero cloud cost)
   * 2. Audio Blob multipart upload
   * 3. Audio Base64 string
   */
  processVoice: async (payload: ProcessVoicePayload): Promise<ProcessVoiceResponse> => {
    // If we have an audio blob, send via FormData
    if (payload.audioBlob) {
      const formData = new FormData();
      // Append text metadata first so multipart parsers receive them reliably
      if (payload.lessonId) formData.append("lessonId", payload.lessonId);
      if (payload.sampleSentence) formData.append("sampleSentence", payload.sampleSentence);
      if (payload.transcript) formData.append("transcript", payload.transcript);
      formData.append("audio", payload.audioBlob, "recording.wav");

      // Omit manual Content-Type header so browser/axios sets multipart/form-data with the correct boundary
      const res = await api.post("/practices/process-voice", formData);
      return res.data?.data || res.data;
    }

    // Otherwise send as JSON (direct transcript or audioBase64)
    const res = await api.post("/practices/process-voice", {
      lessonId: payload.lessonId,
      sampleSentence: payload.sampleSentence,
      transcript: payload.transcript,
      audioBase64: payload.audioBase64,
      mimeType: payload.mimeType || "audio/wav",
    });

    return res.data?.data || res.data;
  },

  /**
   * Text-to-speech generation (Google Cloud TTS / fallback)
   */
  synthesizeVoice: async (text: string, voiceName?: string, gender?: "FEMALE" | "MALE") => {
    const res = await api.post("/practices/text-to-speech", {
      text,
      voiceName,
      gender,
    });
    return res.data?.data || res.data;
  },

  /**
   * Create initial practice session (compatibility)
   */
  createPractice: async (lessonId: string, sampleSentence: string): Promise<Practice> => {
    const res = await api.post("/practices", { lessonId, sampleSentence });
    return res.data?.practice || res.data?.data || res.data;
  },

  /**
   * Save practice evaluation result to database, increment studylogs & streak
   */
  savePractice: async (payload: SavePracticePayload): Promise<SavePracticeResponse> => {
    const res = await api.post("/practices/save", payload);
    return {
      practice: res.data?.practice || res.data?.data?.practice,
      gamification: res.data?.gamification || res.data?.data?.gamification,
      quota: res.data?.quota || res.data?.data?.quota,
    };
  },

  /**
   * Paginated practice history
   */
  getHistory: async (page = 1, limit = 10) => {
    const res = await api.get("/practices/history", {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * Get all user practices
   */
  getPractices: async (): Promise<Practice[]> => {
    const res = await api.get("/practices");
    return res.data?.practices || res.data?.data || [];
  },

  /**
   * Get practice detail by ID
   */
  getPracticeById: async (id: string): Promise<Practice> => {
    const res = await api.get(`/practices/${id}`);
    return res.data?.practice || res.data?.data;
  },

  /**
   * Delete practice
   */
  deletePractice: async (id: string) => {
    const res = await api.delete(`/practices/${id}`);
    return res.data;
  },

  /**
   * Freeform AI interactive roleplay turn
   */
  roleplayChat: async (payload: {
    lessonId?: string;
    scenarioTitle?: string;
    level?: string;
    conversationHistory: RoleplayMessage[];
    userMessage: string;
  }): Promise<RoleplayChatResponse> => {
    const res = await api.post("/practices/roleplay-chat", payload);
    return res.data?.data || res.data;
  },
};

export default practiceService;
