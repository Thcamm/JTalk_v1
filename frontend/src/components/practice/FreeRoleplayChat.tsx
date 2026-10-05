import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { practiceService } from "@/services/practice.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatJapaneseForSpeech } from "@/utils/japanesePhrasing";
import type { RoleplayMessage } from "@/types";

interface FreeRoleplayChatProps {
  lessonId?: string;
  scenarioTitle: string;
  level?: string;
  initialAiDialogue?: {
    japanese: string;
    furigana?: string;
    romaji?: string;
    translation?: string;
  };
  initialSuggestedAnswers?: Array<{
    japanese: string;
    furigana?: string;
    romaji?: string;
    translation?: string;
  }>;
  showFurigana: boolean;
  showRomaji: boolean;
  showTranslation: boolean;
  onToggleFurigana: () => void;
  onToggleRomaji: () => void;
  onToggleTranslation: () => void;
}

/**
 * Intelligent instant contextual suggestions generator for zero-latency roleplay
 */
const getContextualRoleplaySuggestions = (
  scenarioTitle: string = "",
  aiText: string = "",
  _level: string = "N5"
): Array<{ japanese: string; furigana?: string; romaji?: string; translation?: string }> => {
  const titleLower = scenarioTitle.toLowerCase();
  const textLower = aiText.toLowerCase();

  // 1. Bakery / Bánh mì / Tiệm bánh (e.g. Mua bánh mì ở tiệm bánh Nhật Bản)
  if (
    titleLower.includes("bánh mì") ||
    titleLower.includes("tiệm bánh") ||
    titleLower.includes("bánh") ||
    titleLower.includes("bakery") ||
    titleLower.includes("パン") ||
    textLower.includes("パン")
  ) {
    if (
      textLower.includes("こんにちは") ||
      textLower.includes("いらっしゃい") ||
      textLower.includes("おはよう") ||
      textLower.includes("皆さん")
    ) {
      return [
        {
          japanese: "こんにちは！美味しそうなパンですね。",
          furigana: "こんにちは！おいしそうなパンですね。",
          romaji: "Konnichiwa! Oishisou na pan desu ne.",
          translation: "Chào bạn! Bánh mì trông ngon quá.",
        },
        {
          japanese: "こんにちは！おすすめのパンは何ですか？",
          furigana: "こんにちは！おすすめのパンはなんですか？",
          romaji: "Konnichiwa! Osusume no pan wa nan desu ka?",
          translation: "Chào bạn! Bánh mì gợi ý đặc biệt là gì vậy ạ?",
        },
        {
          japanese: "焼きたてのパンはありますか？",
          furigana: "やきたてのパンはありますか？",
          romaji: "Yakitate no pan wa arimasu ka?",
          translation: "Tiệm có bánh mì mới ra lò không ạ?",
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

  // 2. Cafe / Cà phê / Đồ uống
  if (
    titleLower.includes("cafe") ||
    titleLower.includes("cà phê") ||
    titleLower.includes("カフェ") ||
    titleLower.includes("uống") ||
    textLower.includes("コーヒー") ||
    textLower.includes("ラテ")
  ) {
    if (
      textLower.includes("こんにちは") ||
      textLower.includes("いらっしゃい") ||
      textLower.includes("皆さん")
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

  // 3. Convenience Store / Siêu thị
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
    ];
  }

  // 4. Asking directions / Station / Tàu điện
  if (
    titleLower.includes("đường") ||
    titleLower.includes("ga") ||
    titleLower.includes("tàu") ||
    titleLower.includes("駅") ||
    titleLower.includes("道") ||
    textLower.includes("駅")
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
    textLower.includes("名前") ||
    textLower.includes("初めまして")
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

  // 7. General greeting match (e.g. 皆さんこんにちは, こんにちは)
  if (
    textLower.includes("こんにちは") ||
    textLower.includes("おはよう") ||
    textLower.includes("こんばんは") ||
    textLower.includes("皆さん")
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

  // 8. Default fallback
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
};

export const FreeRoleplayChat: React.FC<FreeRoleplayChatProps> = ({
  lessonId,
  scenarioTitle,
  level = "N5",
  initialAiDialogue,
  initialSuggestedAnswers,
  showFurigana,
  showRomaji,
  showTranslation,
  onToggleFurigana,
  onToggleRomaji,
  onToggleTranslation,
}) => {
  const authStore = useAuthStore();
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Warm up voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      handleVoices();
    }
  }, []);

  // Audio Speech Synthesis function (Microsoft Edge Neural TTS first, then Browser SpeechSynthesis)
  const speakText = useCallback(async (text: string, msgId?: string) => {
    if (!text) return;

    // 1. Cancel any active audio
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

    if (msgId) setPlayingMessageId(msgId);

    // 2. Primary Engine: Microsoft Edge Neural TTS (Studio-grade Tokyo Japanese)
    try {
      const ttsData = await practiceService.synthesizeVoice(
        text,
        "ja-JP-NanamiNeural",
        "FEMALE",
        0.95
      );

      if (ttsData?.audioContent) {
        const mimeType = ttsData.mimeType || "audio/mp3";
        const audio = new Audio(`data:${mimeType};base64,${ttsData.audioContent}`);
        audioElementRef.current = audio;
        audio.onended = () => {
          setPlayingMessageId(null);
          audioElementRef.current = null;
        };
        audio.onerror = () => {
          setPlayingMessageId(null);
          audioElementRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch (_) {
      // Backend TTS offline -> fallback to local browser SpeechSynthesis
    }

    // 3. Fallback: Browser SpeechSynthesis with Bunsetsu phrasing pauses
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const phrasedText = formatJapaneseForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(phrasedText);
        utterance.lang = "ja-JP";
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Prevent GC aborting audio in Chromium
        currentUtteranceRef.current = utterance;
        (window as unknown as { __jtalkUtterance: SpeechSynthesisUtterance }).__jtalkUtterance = utterance;

        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(
          (v) =>
            v.lang === "ja-JP" ||
            v.lang.startsWith("ja") ||
            v.lang.includes("JP") ||
            v.name.toLowerCase().includes("japanese")
        );
        if (jaVoice) {
          utterance.voice = jaVoice;
        }

        utterance.onend = () => {
          setPlayingMessageId(null);
          currentUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setPlayingMessageId(null);
          currentUtteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("TTS playback error:", e);
        setPlayingMessageId(null);
      }
    } else {
      setPlayingMessageId(null);
    }
  }, []);

  // Stop playing audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause();
        } catch (_) {}
      }
    };
  }, []);

  // Initialize conversation with scenario's opening dialogue
  const initConversation = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const defaultOpening = initialAiDialogue || {
      japanese: "いらっしゃいませ！こんにちは。何かお手伝いしましょうか？",
      furigana: "いらっしゃいませ！こんにちは。なにかおてつだいしましょうか？",
      romaji: "Irasshaimase! Konnichiwa. Nanika otetsudai shimashou ka?",
      translation: "Xin chào quý khách! Tôi có thể giúp gì cho bạn ạ?",
    };

    const initialSuggestions =
      initialSuggestedAnswers && initialSuggestedAnswers.length > 0
        ? initialSuggestedAnswers
        : getContextualRoleplaySuggestions(scenarioTitle, defaultOpening.japanese, level);

    const firstMessage: RoleplayMessage = {
      id: `ai-init-${Date.now()}`,
      sender: "ai",
      japanese: defaultOpening.japanese,
      furigana: defaultOpening.furigana,
      romaji: defaultOpening.romaji,
      translation: defaultOpening.translation,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedAnswers: initialSuggestions,
    };

    setMessages([firstMessage]);
    setShowSuggestions(true);
    setInputVal("");
    setLiveTranscript("");

    // Asynchronously fetch fresh AI-generated contextual suggestions for opening dialogue
    practiceService
      .getRoleplaySuggestions({
        lessonId,
        scenarioTitle,
        level,
        aiMessage: defaultOpening.japanese,
      })
      .then((res) => {
        if (res?.suggestedAnswers && res.suggestedAnswers.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === firstMessage.id ? { ...m, suggestedAnswers: res.suggestedAnswers } : m
            )
          );
        }
      })
      .catch((err) => {
        console.warn("Using local contextual suggestions for opening dialogue:", err);
      });

    // Auto-play initial greeting if enabled
    if (autoPlayAudio) {
      setTimeout(() => {
        speakText(defaultOpening.japanese, firstMessage.id);
      }, 500);
    }
  }, [
    initialAiDialogue,
    initialSuggestedAnswers,
    scenarioTitle,
    level,
    lessonId,
    autoPlayAudio,
    speakText,
  ]);

  useEffect(() => {
    initConversation();
  }, [lessonId]);

  // Start recording Japanese speech (Web Speech API)
  const startRecording = useCallback(() => {
    // Check quota for free accounts
    const isPremium = authStore.user?.subscription?.tier === "premium";
    const userCount = authStore.user?.dailyUsage?.practiceCount ?? 0;
    const currentUsed = Math.max(userCount, authStore.dailyPracticeCount);

    if (!isPremium && currentUsed >= 2) {
      toast.error("Bạn đã dùng hết 2 lượt luyện nói miễn phí trong ngày. Nâng cấp Premium để trò chuyện vô hạn!");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API. Bạn có thể nhập văn bản tiếng Nhật trực tiếp vào ô bên dưới.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      isRecordingRef.current = true;
      setIsRecording(true);
      setLiveTranscript("");

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ja-JP";

      let finalTrans = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += trans;
          } else {
            interim += trans;
          }
        }
        const full = finalTrans || interim;
        setLiveTranscript(full);
        setInputVal(full);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === "not-allowed") {
          toast.error("Vui lòng cho phép quyền truy cập Microphone trong trình duyệt.");
          isRecordingRef.current = false;
          setIsRecording(false);
        }
        // Do not abort on transient 'no-speech' error
      };

      recognition.onend = () => {
        // If user is still actively recording, restart recognition so it doesn't shut down
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        } else {
          setIsRecording(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Could not start recording:", err);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [authStore]);

  // Stop recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Send message to AI and receive dynamic roleplay reply
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal || liveTranscript).trim();
    if (!messageText || isLoading) return;

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: RoleplayMessage = {
      id: userMsgId,
      sender: "user",
      japanese: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Append user message immediately to chat stream
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputVal("");
    setLiveTranscript("");
    setIsLoading(true);

    try {
      // Increment quota count
      authStore.incrementDailyPracticeCount();

      const response = await practiceService.roleplayChat({
        lessonId,
        scenarioTitle,
        level,
        conversationHistory: updatedHistory,
        userMessage: messageText,
      });

      if (response && response.aiReply) {
        // Update user message with evaluation feedback from AI
        if (response.userEvaluation) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId
                ? {
                    ...m,
                    evaluation: response.userEvaluation,
                  }
                : m
            )
          );
          // Automatically expand feedback card for the latest user turn
          setExpandedFeedbackId(userMsgId);
        }

        const aiMsgId = `ai-${Date.now()}`;
        const dynamicSuggestions =
          response.suggestedAnswers && response.suggestedAnswers.length > 0
            ? response.suggestedAnswers
            : getContextualRoleplaySuggestions(scenarioTitle, response.aiReply.japanese, level);

        const aiMsg: RoleplayMessage = {
          id: aiMsgId,
          sender: "ai",
          japanese: response.aiReply.japanese,
          furigana: response.aiReply.furigana,
          romaji: response.aiReply.romaji,
          translation: response.aiReply.translation,
          suggestedAnswers: dynamicSuggestions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setShowSuggestions(true);

        // Auto play audio response from AI
        if (autoPlayAudio) {
          setTimeout(() => {
            speakText(aiMsg.japanese, aiMsgId);
          }, 300);
        }
      }
    } catch (err) {
      console.error("Roleplay chat API error:", err);
      toast.error("Không thể kết nối tới gia sư AI. Đang hiển thị phản hồi mẫu.");

      const fallbackSuggestions = getContextualRoleplaySuggestions(
        scenarioTitle,
        "なるほど、分かりました！",
        level
      );

      // Friendly fallback message
      const fallbackAiMsg: RoleplayMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        japanese: "なるほど、分かりました！とても上手な日本語ですね。他に何か言いたいことはありますか？",
        furigana: "なるほど、わかりました！とてもじょうずなにほんごですね。ほかになにかいいたいことはありますか？",
        romaji: "Naruhodo, wakarimashita! Totemo jouzu na nihongo desu ne. Hoka ni nanika iitai koto wa arimasu ka?",
        translation: "Tôi hiểu rồi! Bạn nói tiếng Nhật rất tốt đó. Bạn còn điều gì muốn chia sẻ nữa không?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedAnswers: fallbackSuggestions,
      };

      setMessages((prev) => [...prev, fallbackAiMsg]);
      setShowSuggestions(true);
      if (autoPlayAudio) {
        speakText(fallbackAiMsg.japanese, fallbackAiMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get current suggested answers from the last AI message
  const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
  const suggestedReplies = lastAiMessage?.suggestedAnswers || [];

  // Refresh suggestions with AI for the current active AI dialogue
  const handleRefreshSuggestions = async () => {
    if (!lastAiMessage || isRefreshingSuggestions) return;
    setIsRefreshingSuggestions(true);
    try {
      const res = await practiceService.getRoleplaySuggestions({
        lessonId,
        scenarioTitle,
        level,
        aiMessage: lastAiMessage.japanese,
        conversationHistory: messages,
      });
      if (res?.suggestedAnswers && res.suggestedAnswers.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === lastAiMessage.id ? { ...m, suggestedAnswers: res.suggestedAnswers } : m
          )
        );
        setShowSuggestions(true);
        toast.success("Đã làm mới câu gợi ý phản xạ!");
      }
    } catch (err) {
      console.warn("Could not refresh suggestions:", err);
      toast.error("Chưa thể làm mới câu gợi ý lúc này.");
    } finally {
      setIsRefreshingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors">
      {/* 1. Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs">
            AI
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{scenarioTitle}</h3>
              <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded text-2xs font-bold border border-rose-200/50 dark:border-rose-800/60">
                {level}
              </span>
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Đối đáp tự do theo ngữ cảnh thời gian thực</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Audio Auto-Play Toggle */}
          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            type="button"
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              autoPlayAudio
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
            title={autoPlayAudio ? "Tự động phát âm thanh AI: BẬT" : "Tự động phát âm thanh AI: TẮT"}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            <span className="hidden sm:inline">{autoPlayAudio ? "Tự động đọc" : "Tắt đọc"}</span>
          </button>

          {/* Subtitle controls */}
          <button
            onClick={onToggleFurigana}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showFurigana
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Hiragana
          </button>
          <button
            onClick={onToggleRomaji}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showRomaji
                ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Romaji
          </button>
          <button
            onClick={onToggleTranslation}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showTranslation
                ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            }`}
          >
            Bản dịch
          </button>

          {/* Reset button */}
          <button
            onClick={initConversation}
            type="button"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Làm mới cuộc trò chuyện từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-[#0c121e]/80 transition-colors">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          const isPlaying = playingMessageId === msg.id;
          const isFeedbackOpen = expandedFeedbackId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1.5 animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 dark:text-slate-500 px-1">
                <span>{isAi ? "Gia sư AI" : "Bạn"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2 relative ${
                  isAi
                    ? "bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-tl-sm"
                    : "bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white rounded-tr-sm"
                }`}
              >
                {/* Audio speaker button for AI messages */}
                {isAi && (
                  <button
                    onClick={() => speakText(msg.japanese, msg.id)}
                    type="button"
                    className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors cursor-pointer ${
                      isPlaying
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 animate-pulse"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                    title="Nghe lại phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}

                {/* Primary Japanese Text */}
                <p className="text-base sm:text-lg md:text-xl font-bold font-sans tracking-wide pr-6 leading-relaxed">
                  {msg.japanese}
                </p>

                {/* Hiragana / Furigana subtitle */}
                {showFurigana && msg.furigana && (
                  <p
                    className={`text-xs sm:text-sm font-semibold tracking-wider font-sans ${
                      isAi ? "text-rose-700 dark:text-rose-400" : "text-rose-100"
                    }`}
                  >
                    {msg.furigana}
                  </p>
                )}

                {/* Romaji */}
                {showRomaji && msg.romaji && (
                  <p
                    className={`text-xs font-mono tracking-wide ${
                      isAi ? "text-slate-400 dark:text-slate-400" : "text-amber-100"
                    }`}
                  >
                    {msg.romaji}
                  </p>
                )}

                {/* Vietnamese Translation */}
                {showTranslation && msg.translation && (
                  <p
                    className={`text-xs sm:text-sm font-medium pt-1 border-t ${
                      isAi
                        ? "border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300"
                        : "border-rose-400/40 text-rose-50"
                    }`}
                  >
                    {msg.translation}
                  </p>
                )}
              </div>

              {/* Feedback Accordion for User Messages */}
              {!isAi && msg.evaluation && (
                <div className="max-w-[85%] sm:max-w-[75%] w-full">
                  <button
                    onClick={() => setExpandedFeedbackId(isFeedbackOpen ? null : msg.id)}
                    type="button"
                    className="flex items-center justify-between w-full px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 border border-rose-200/90 dark:border-rose-800 rounded-xl text-2xs font-bold text-rose-800 dark:text-rose-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                      <span>Đánh giá phản xạ: {msg.evaluation.naturalnessScore ?? 85}/100</span>
                    </div>
                    {isFeedbackOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isFeedbackOpen && (
                    <div className="p-3 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/80 rounded-2xl mt-1.5 space-y-2 text-xs shadow-2xs animate-in fade-in duration-150">
                      {msg.evaluation.grammarAdvice && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                            <span>Nhận xét của AI:</span>
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{msg.evaluation.grammarAdvice}</p>
                        </div>
                      )}

                      {msg.evaluation.betterExpression && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                          <span className="font-bold text-rose-800 dark:text-rose-300 block">
                            Cách nói tự nhiên hơn chuẩn bản xứ:
                          </span>
                          <p className="font-bold text-rose-950 dark:text-rose-100 font-sans mt-0.5 text-sm">
                            {msg.evaluation.betterExpression}
                          </p>
                          {showFurigana && msg.evaluation.betterExpressionFurigana && (
                            <p className="text-2xs font-semibold text-rose-700 dark:text-rose-400 font-sans tracking-wide mt-0.5">
                              {msg.evaluation.betterExpressionFurigana}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble when AI is thinking */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs shrink-0">
              AI
            </div>
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl rounded-tl-sm p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-2xs font-semibold text-slate-400 dark:text-slate-500">Gia sư AI đang lắng nghe và suy nghĩ câu đối đáp...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Control & Interactive Recording Zone */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 space-y-3 transition-colors">
        {/* Suggested Quick Replies (Gợi ý câu đối đáp nhanh - Thu gọn tiết kiệm không gian chat) */}
        {suggestedReplies.length > 0 && !isLoading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 border border-amber-200/90 dark:border-amber-900 rounded-full text-2xs font-bold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 animate-spin-slow" />
                  <span>Gợi ý câu đối đáp ({suggestedReplies.length})</span>
                  {showSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={handleRefreshSuggestions}
                  disabled={isRefreshingSuggestions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Tạo gợi ý mới chuẩn ngữ cảnh bằng AI"
                >
                  <Sparkles
                    className={`w-3 h-3 text-amber-500 ${isRefreshingSuggestions ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isRefreshingSuggestions ? "Đang tạo..." : "Đổi gợi ý AI"}
                  </span>
                </button>
              </div>

              {showSuggestions && (
                <span className="text-3xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Bấm câu để điền nhanh & nghe giọng đọc
                </span>
              )}
            </div>

            {showSuggestions && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {suggestedReplies.map((item, idx) => {
                  const jap = typeof item === "string" ? item : item.japanese;
                  const trans = typeof item === "object" ? item.translation : undefined;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputVal(jap);
                        speakText(jap);
                      }}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 rounded-xl transition-all cursor-pointer text-left shrink-0 shadow-2xs"
                      title={trans || "Bấm để chọn câu này"}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-rose-600 font-sans">
                        {jap}
                      </span>
                      {trans && (
                        <span className="text-3xs text-slate-400 group-hover:text-rose-400 hidden md:inline">
                          ({trans})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live speech feedback when recording */}
        {isRecording && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Đang lắng nghe giọng nói tiếng Nhật của bạn:
              </span>
              <span className="text-xs font-bold text-rose-950 dark:text-rose-100 font-sans">
                {liveTranscript || "..."}
              </span>
            </div>
            <button
              onClick={stopRecording}
              type="button"
              className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Xong
            </button>
          </div>
        )}

        {/* Input & Record Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Big Mic Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            type="button"
            className={`p-3 sm:p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isRecording
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                : "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white hover:shadow-md"
            }`}
            title={isRecording ? "Bấm để dừng ghi âm" : "Bấm để nói tiếng Nhật với AI"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
          </button>

          {/* Text input with transcript preview */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isRecording
                  ? "Đang nhận diện giọng nói của bạn..."
                  : "Bấm Micro để nói tiếng Nhật hoặc gõ câu trả lời..."
              }
              className="w-full pl-4 pr-10 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus:border-rose-500 dark:focus:border-rose-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm sm:text-base font-sans font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden transition-all"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => speakText(inputVal)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Nghe phát âm câu này"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-3 sm:p-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-105 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            title="Gửi câu trả lời"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FreeRoleplayChat;
