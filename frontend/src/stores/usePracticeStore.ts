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
    const dialogues = lesson.dialogues && lesson.dialogues.length > 0
      ? lesson.dialogues
      : [
          {
            order: 1,
            speaker: "ai" as const,
            japanese: lesson.sampleSentence || "こんにちは！元気ですか？",
            translation: lesson.translation || "Xin chào! Bạn có khỏe không?",
            expectedAnswer: lesson.sampleSentence || "はい、元気です。",
          },
        ];

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
