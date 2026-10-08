import { create } from "zustand";
import type { Lesson, Dialogue, ProcessVoiceResponse, Practice } from "@/types";

export interface PracticeState {
  currentLesson: Lesson | null;
  currentDialogueIndex: number;
  dialogues: Dialogue[];
  isRecording: boolean;
  isEvaluating: boolean;
  isSaving: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationSeconds: number;
  clientTranscript: string;
  currentEvaluation: ProcessVoiceResponse | null;
  recentSavedPractice: Practice | null;
  quotaExceeded: boolean;
  errorMessage: string | null;

  // Actions
  setLesson: (lesson: Lesson) => void;
  setCurrentDialogueIndex: (index: number) => void;
  nextDialogue: () => void;
  prevDialogue: () => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsEvaluating: (isEvaluating: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setAudioData: (blob: Blob | null, url: string | null, duration?: number) => void;
  setClientTranscript: (transcript: string) => void;
  setCurrentEvaluation: (evaluation: ProcessVoiceResponse | null) => void;
  setRecentSavedPractice: (practice: Practice | null) => void;
  setQuotaExceeded: (quotaExceeded: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  resetSessionState: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  currentLesson: null,
  currentDialogueIndex: 0,
  dialogues: [],
  isRecording: false,
  isEvaluating: false,
  isSaving: false,
  audioBlob: null,
  audioUrl: null,
  durationSeconds: 0,
  clientTranscript: "",
  currentEvaluation: null,
  recentSavedPractice: null,
  quotaExceeded: false,
  errorMessage: null,

  setLesson: (lesson: Lesson) => {
    const hasJapanese = (str?: string) =>
      Boolean(str && /[぀-ゟ゠-ヿ一-龯]/.test(str));

    // Lọc hoặc xây dựng hội thoại đảm bảo trường japanese TUYỆT ĐỐI không phải là tiếng Việt
    let dialogues =
      Array.isArray(lesson.dialogues) && lesson.dialogues.length > 0
        ? lesson.dialogues.filter((d) => hasJapanese(d.japanese))
        : [];

    if (dialogues.length === 0) {
      const validJapanese = hasJapanese(lesson.sampleSentence)
        ? lesson.sampleSentence!
        : "初めまして、どうぞよろしくお願いします。";
      const validTranslation = hasJapanese(lesson.sampleSentence)
        ? lesson.translation || ""
        : "Rất vui được gặp bạn, mong nhận được sự giúp đỡ.";

      dialogues = [
        {
          order: 1,
          speaker: "ai" as const,
          japanese: "こんにちは！新しいクラスへようこそ。お名前は何ですか？",
          furigana: "こんにちは！あたらしいクラスへようこそ。おなまえはなんですか？",
          romaji: "Konnichiwa! Atarashii kurasu e youkoso. Onamae wa nan desu ka?",
          translation: "Xin chào! Chào mừng bạn tới lớp học mới. Bạn tên là gì thế?",
          expectedAnswer: validJapanese,
        },
        {
          order: 2,
          speaker: "user" as const,
          japanese: validJapanese,
          furigana: validJapanese,
          romaji: "",
          translation: validTranslation,
          expectedAnswer: validJapanese,
        },
      ];
    }

    set({
      currentLesson: lesson,
      dialogues,
      currentDialogueIndex: 0,
      currentEvaluation: null,
      recentSavedPractice: null,
      clientTranscript: "",
      audioBlob: null,
      audioUrl: null,
      durationSeconds: 0,
      quotaExceeded: false,
      errorMessage: null,
      isRecording: false,
      isEvaluating: false,
      isSaving: false,
    });
  },

  setCurrentDialogueIndex: (index: number) => {
    const { dialogues } = get();
    if (index >= 0 && index < dialogues.length) {
      set({
        currentDialogueIndex: index,
        currentEvaluation: null,
        clientTranscript: "",
        audioBlob: null,
        audioUrl: null,
        durationSeconds: 0,
        errorMessage: null,
        isRecording: false,
        isEvaluating: false,
        isSaving: false,
      });
    }
  },

  nextDialogue: () => {
    const { currentDialogueIndex, dialogues } = get();
    if (currentDialogueIndex < dialogues.length - 1) {
      set({
        currentDialogueIndex: currentDialogueIndex + 1,
        currentEvaluation: null,
        clientTranscript: "",
        audioBlob: null,
        audioUrl: null,
        durationSeconds: 0,
        errorMessage: null,
        isRecording: false,
        isEvaluating: false,
        isSaving: false,
      });
    }
  },

  prevDialogue: () => {
    const { currentDialogueIndex } = get();
    if (currentDialogueIndex > 0) {
      set({
        currentDialogueIndex: currentDialogueIndex - 1,
        currentEvaluation: null,
        clientTranscript: "",
        audioBlob: null,
        audioUrl: null,
        durationSeconds: 0,
        errorMessage: null,
        isRecording: false,
        isEvaluating: false,
        isSaving: false,
      });
    }
  },

  setIsRecording: (isRecording: boolean) => set({ isRecording }),
  setIsEvaluating: (isEvaluating: boolean) => set({ isEvaluating }),
  setIsSaving: (isSaving: boolean) => set({ isSaving }),

  setAudioData: (blob: Blob | null, url: string | null, duration = 0) =>
    set({ audioBlob: blob, audioUrl: url, durationSeconds: duration }),

  setClientTranscript: (clientTranscript: string) => set({ clientTranscript }),

  setCurrentEvaluation: (currentEvaluation: ProcessVoiceResponse | null) =>
    set({ currentEvaluation }),

  setRecentSavedPractice: (recentSavedPractice: Practice | null) =>
    set({ recentSavedPractice }),

  setQuotaExceeded: (quotaExceeded: boolean) => set({ quotaExceeded }),
  setErrorMessage: (errorMessage: string | null) => set({ errorMessage }),

  resetSessionState: () =>
    set({
      currentLesson: null,
      dialogues: [],
      currentDialogueIndex: 0,
      isRecording: false,
      isEvaluating: false,
      isSaving: false,
      audioBlob: null,
      audioUrl: null,
      durationSeconds: 0,
      clientTranscript: "",
      currentEvaluation: null,
      recentSavedPractice: null,
      quotaExceeded: false,
      errorMessage: null,
    }),
}));

export default usePracticeStore;
