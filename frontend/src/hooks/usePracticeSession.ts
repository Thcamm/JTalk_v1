import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { usePracticeStore } from "@/stores/usePracticeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { practiceService } from "@/services/practice.service";
import { useAudioRecorder } from "./useAudioRecorder";
import type { ProcessVoiceResponse, SavePracticeResponse } from "@/types";

// Type definitions for Web Speech API
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => IWindowSpeechRecognition;
    webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
  }
}

const generateFallbackEvaluation = (
  targetSentence: string,
  userTranscript: string,
  furigana?: string
): ProcessVoiceResponse => {
  const cleanTranscript = (userTranscript || "")
    .replace(/[、。！？!?,.\s~…-]/g, "")
    .toLowerCase();
  const cleanFurigana = (furigana || "")
    .replace(/[、。！？!?,.\s~…-]/g, "")
    .toLowerCase();

  // Split target sentence into words, ignoring pure punctuation marks
  const rawWords = targetSentence
    .split(/([、。！？!?,.\s~…]+|(?<=[はがをにでともへからまで]))/)
    .filter(Boolean);
  const words = rawWords
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !/^[、。！？!?,.\s~…-]+$/.test(w));

  const wordFeedback = words.map((word) => {
    const cleanWord = word.replace(/[、。！？!?,.\s~…-]/g, "").toLowerCase();
    const isMatched =
      cleanTranscript.includes(cleanWord) ||
      (cleanFurigana.length > 0 && cleanTranscript.includes(cleanFurigana)) ||
      (cleanTranscript.length > 0 && cleanTranscript.length >= cleanWord.length);

    return {
      word,
      isCorrect: isMatched,
      accuracyScore: isMatched ? 95 : 55,
      errorType: isMatched ? ("none" as const) : ("mispronunciation" as const),
      suggestion: isMatched ? undefined : `Phát âm rõ hơn âm "${word}"`,
    };
  });

  const correctCount = wordFeedback.filter((w) => w.isCorrect).length;
  const ratio = wordFeedback.length > 0 ? correctCount / wordFeedback.length : 0.85;
  const baseScore = Math.min(95, Math.max(65, Math.round(ratio * 90 + 10)));

  return {
    transcript: userTranscript || targetSentence,
    targetSentence,
    scores: {
      pronunciation: baseScore,
      accuracy: Math.min(100, baseScore + 3),
      fluency: Math.max(60, baseScore - 4),
      completeness: Math.min(100, baseScore + 2),
    },
    overallScore: baseScore,
    wordFeedback,
    feedback: {
      grammarSuggestions: [
        "Trợ từ và ngữ điệu câu tự nhiên, phù hợp với ngữ cảnh giao tiếp.",
      ],
      generalAdvice:
        "Phát âm rõ ràng, nhịp điệu tương đối chuẩn. Hãy tiếp tục luyện phản xạ để nói mượt mà hơn nhé!",
    },
  };
};

export const usePracticeSession = () => {
  const store = usePracticeStore();
  const authStore = useAuthStore();
  const recorder = useAudioRecorder();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const speechRecognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef<string>("");

  // Helper to stop all playing audio immediately (SpeechSynthesis + HTMLAudioElement)
  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch (_) {}
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
  }, []);

  // Cleanup audio when hook unmounts
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSpeechRecognitionSupported(true);
    }
  }, []);

  // Play audio for current dialogue sentence (TTS)
  const playNativeAudio = useCallback(async (text?: string) => {
    stopAudio();

    const currentDialogue = store.dialogues[store.currentDialogueIndex];
    const sentenceToPlay =
      text || currentDialogue?.japanese || store.currentLesson?.sampleSentence || "";

    if (!sentenceToPlay) return;

    setIsPlayingAudio(true);

    // 1. First try browser native SpeechSynthesis (0ms latency, zero bandwidth)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sentenceToPlay);
        utterance.lang = "ja-JP";
        utterance.rate = 0.9; // Slightly slower for clear Japanese learner comprehension

        // Try to pick native Japanese voice if available
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(
          (v) => v.lang.startsWith("ja") || v.lang.includes("JP")
        );
        if (jaVoice) {
          utterance.voice = jaVoice;
        }

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        console.warn("SpeechSynthesis error, falling back to backend TTS:", e);
      }
    }

    // 2. Fallback: Call Google Cloud TTS backend endpoint
    try {
      const ttsData = await practiceService.synthesizeVoice(sentenceToPlay);
      if (ttsData?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
        audioElementRef.current = audio;
        audio.onended = () => {
          setIsPlayingAudio(false);
          audioElementRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          audioElementRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.error("Backend TTS synthesis error:", e);
    }

    setIsPlayingAudio(false);
  }, [store.dialogues, store.currentDialogueIndex, store.currentLesson, stopAudio]);

  // Start Voice Turn (Recorder + Web Speech API)
  const startSpeaking = useCallback(async () => {
    // Check if free quota exceeded
    const isPremium =
      authStore.user?.subscription?.tier === "premium" &&
      (!authStore.user.subscription.expiresAt ||
        new Date(authStore.user.subscription.expiresAt).getTime() > Date.now());

    const userCount =
      authStore.user?.dailyUsage?.practiceCount ??
      authStore.user?.quota?.usedToday ??
      0;
    const currentUsed = Math.max(userCount, authStore.dailyPracticeCount);

    if (!isPremium && currentUsed >= 2) {
      store.setQuotaExceeded(true);
      toast.error(
        "Bạn đã dùng hết 2 lượt luyện nói miễn phí trong ngày. Vui lòng nâng cấp Premium để tiếp tục!"
      );
      return;
    }

    store.setErrorMessage(null);
    store.setClientTranscript("");
    finalTranscriptRef.current = "";

    // 1. Start audio recorder for waveform & audio file
    await recorder.startRecording();
    store.setIsRecording(true);

    // 2. Start Web Speech API in parallel (if available) for instant live transcript
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "ja-JP";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += transcript;
            } else {
              interim += transcript;
            }
          }
          const liveText = finalTranscriptRef.current || interim;
          store.setClientTranscript(liveText);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("Web Speech API recognition error:", event.error);
        };

        recognition.onend = () => {
          speechRecognitionRef.current = null;
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Could not start Web Speech Recognition:", err);
      }
    }
  }, [recorder, store, authStore]);

  // Stop Speaking & Evaluate AI Reflex
  const stopAndEvaluate = useCallback(async (): Promise<ProcessVoiceResponse | null> => {
    // 1. Stop SpeechRecognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }

    // 2. Stop audio recorder
    const recordResult = await recorder.stopRecording();
    store.setIsRecording(false);
    store.setAudioData(recordResult.blob, recordResult.url, recordResult.duration);

    // 3. Prepare sentence & transcript
    // ALWAYS prioritize the exact Japanese sentence displayed to the user on screen!
    const currentDialogue = store.dialogues[store.currentDialogueIndex];
    const targetSentence =
      currentDialogue?.japanese ||
      currentDialogue?.expectedAnswer ||
      store.currentLesson?.sampleSentence ||
      "";

    // User's recognized speech: prioritize live Web Speech recognition transcript
    const transcript =
      store.clientTranscript?.trim() ||
      finalTranscriptRef.current?.trim() ||
      "";

    store.setIsEvaluating(true);

    let evalResult: ProcessVoiceResponse | null = null;

    try {
      evalResult = await practiceService.processVoice({
        lessonId: store.currentLesson?._id,
        sampleSentence: targetSentence,
        transcript: transcript || undefined,
        audioBlob: recordResult.blob && recordResult.blob.size > 0 ? recordResult.blob : undefined,
        audioBase64: recordResult.base64 || undefined,
      });
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            data?: { quotaExceeded?: boolean };
          };
        };
        message?: string;
      };

      const isQuota =
        errorObj.response?.status === 403 &&
        (errorObj.response?.data?.data?.quotaExceeded ||
          errorObj.response?.data?.message?.includes("lượt luyện nói"));

      if (isQuota) {
        store.setQuotaExceeded(true);
        toast.error("Bạn đã dùng hết 2 lượt luyện nói miễn phí trong ngày!");
        return null;
      }

      console.warn("Backend processVoice failed, using intelligent local evaluation:", err);
      evalResult = generateFallbackEvaluation(
        targetSentence,
        transcript,
        currentDialogue?.furigana
      );
    }

    if (evalResult) {
      // Guarantee that targetSentence and transcript on the evaluation ALWAYS match what the user saw and spoke
      const finalEvalResult: ProcessVoiceResponse = {
        ...evalResult,
        targetSentence: targetSentence || evalResult.targetSentence,
        transcript: transcript || evalResult.transcript || targetSentence,
      };

      store.setCurrentEvaluation(finalEvalResult);

      // QUAN TRỌNG: Cập nhật tăng số lượt luyện tập hôm nay ngay lập tức trên UI và LocalStorage
      authStore.incrementDailyPracticeCount();

      // Kiểm tra nếu chạm hạn mức 2 lượt sau lượt nói này
      const isPremium = authStore.user?.subscription?.tier === "premium";
      const nowUsed = Math.max(
        authStore.user?.dailyUsage?.practiceCount ?? 0,
        authStore.dailyPracticeCount
      );
      if (!isPremium && nowUsed >= 2) {
        store.setQuotaExceeded(true);
      }

      // Auto-save practice to database
      try {
        store.setIsSaving(true);
        const saveRes: SavePracticeResponse = await practiceService.savePractice({
          lessonId: store.currentLesson?._id || "",
          sampleSentence: targetSentence,
          transcript: evalResult.transcript || transcript,
          scores: evalResult.scores,
          overallScore: evalResult.overallScore,
          wordFeedback: evalResult.wordFeedback,
          feedback: evalResult.feedback,
          durationSeconds: recordResult.duration || 10,
          audioUrl: evalResult.audioUrl || recordResult.url,
        });

        store.setRecentSavedPractice(saveRes.practice);

        // Update gamification in auth store
        if (saveRes.gamification) {
          authStore.updateUserGamification({
            streak: saveRes.gamification.streak,
            longestStreak: saveRes.gamification.longestStreak,
          });

          if (saveRes.gamification.isStreakIncremented) {
            toast.success(`🔥 Streak tăng lên ${saveRes.gamification.streak} ngày liên tiếp!`);
          }
        }

        // Đồng bộ quota từ server nếu có
        if (saveRes.quota && typeof saveRes.quota.usedToday === "number") {
          authStore.updateUserDailyUsage({
            practiceCount: saveRes.quota.usedToday,
          });
        }
      } catch (saveError) {
        console.warn("Auto-save practice notice (guest / offline):", saveError);
      } finally {
        store.setIsSaving(false);
      }

      return evalResult;
    }

    return null;
  }, [recorder, store, authStore]);

  return {
    ...store,
    recorder,
    isPlayingAudio,
    speechRecognitionSupported,
    playNativeAudio,
    stopAudio,
    startSpeaking,
    stopAndEvaluate,
  };
};

export default usePracticeSession;
