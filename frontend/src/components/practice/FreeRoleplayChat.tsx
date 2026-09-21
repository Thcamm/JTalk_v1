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
  showFurigana: boolean;
  showRomaji: boolean;
  showTranslation: boolean;
  onToggleFurigana: () => void;
  onToggleRomaji: () => void;
  onToggleTranslation: () => void;
}

export const FreeRoleplayChat: React.FC<FreeRoleplayChatProps> = ({
  lessonId,
  scenarioTitle,
  level = "N5",
  initialAiDialogue,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Audio Speech Synthesis function
  const speakText = useCallback((text: string, msgId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.startsWith("ja") || v.lang.includes("JP"));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      if (msgId) setPlayingMessageId(msgId);
      utterance.onend = () => setPlayingMessageId(null);
      utterance.onerror = () => setPlayingMessageId(null);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS playback error:", e);
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

    const firstMessage: RoleplayMessage = {
      id: `ai-init-${Date.now()}`,
      sender: "ai",
      japanese: defaultOpening.japanese,
      furigana: defaultOpening.furigana,
      romaji: defaultOpening.romaji,
      translation: defaultOpening.translation,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedAnswers: [
        {
          japanese: "はい、お願いします。",
          furigana: "はい、おねがいします。",
          romaji: "Hai, onegaishimasu.",
          translation: "Vâng, nhờ bạn giúp đỡ.",
        },
        {
          japanese: "おすすめは何ですか？",
          furigana: "おすすめはなんですか？",
          romaji: "Osusume wa nan desu ka?",
          translation: "Món gợi ý đặc biệt là gì vậy ạ?",
        },
      ],
    };

    setMessages([firstMessage]);
    setInputVal("");
    setLiveTranscript("");

    // Auto-play initial greeting if enabled
    if (autoPlayAudio) {
      setTimeout(() => {
        speakText(defaultOpening.japanese, firstMessage.id);
      }, 500);
    }
  }, [initialAiDialogue, autoPlayAudio, speakText]);

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
        console.warn("Speech recognition error:", e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setLiveTranscript("");
    } catch (err) {
      console.error("Could not start recording:", err);
      setIsRecording(false);
    }
  }, [authStore]);

  // Stop recording
  const stopRecording = useCallback(() => {
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
        const aiMsg: RoleplayMessage = {
          id: aiMsgId,
          sender: "ai",
          japanese: response.aiReply.japanese,
          furigana: response.aiReply.furigana,
          romaji: response.aiReply.romaji,
          translation: response.aiReply.translation,
          suggestedAnswers: response.suggestedAnswers,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);

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

      // Friendly fallback message
      const fallbackAiMsg: RoleplayMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        japanese: "なるほど、分かりました！とても上手な日本語ですね。他に何か言いたいことはありますか？",
        furigana: "なるほど、わかりました！とてもじょうずなにほんごですね。ほかになにかいいたいことはありますか？",
        romaji: "Naruhodo, wakarimashita! Totemo jouzu na nihongo desu ne. Hoka ni nanika iitai koto wa arimasu ka?",
        translation: "Tôi hiểu rồi! Bạn nói tiếng Nhật rất tốt đó. Bạn còn điều gì muốn chia sẻ nữa không?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedAnswers: [
          {
            japanese: "はい、もっと話したいです。",
            furigana: "はい、もっとはなしたいです。",
            romaji: "Hai, motto hanashitai desu.",
            translation: "Vâng, tôi muốn trò chuyện thêm.",
          },
          {
            japanese: "今日はこれで終わります。",
            furigana: "きょうはこれでおわります。",
            romaji: "Kyou wa kore de owarimasu.",
            translation: "Hôm nay đến đây thôi ạ.",
          },
        ],
      };

      setMessages((prev) => [...prev, fallbackAiMsg]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs">
            AI
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{scenarioTitle}</h3>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-bold">
                {level}
              </span>
            </div>
            <p className="text-2xs text-slate-500">Đối đáp tự do theo ngữ cảnh thời gian thực</p>
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
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title={autoPlayAudio ? "Tự động phát âm thanh AI: BẬT" : "Tự động phát âm thanh AI: TẮT"}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{autoPlayAudio ? "Tự động đọc" : "Tắt đọc"}</span>
          </button>

          {/* Subtitle controls */}
          <button
            onClick={onToggleFurigana}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showFurigana
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            Hiragana
          </button>
          <button
            onClick={onToggleRomaji}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showRomaji
                ? "bg-slate-200 border-slate-300 text-slate-800"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            Romaji
          </button>
          <button
            onClick={onToggleTranslation}
            type="button"
            className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-colors cursor-pointer ${
              showTranslation
                ? "bg-slate-200 border-slate-300 text-slate-800"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            Bản dịch
          </button>

          {/* Reset button */}
          <button
            onClick={initConversation}
            type="button"
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Làm mới cuộc trò chuyện từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAFAFC]">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          const isPlaying = playingMessageId === msg.id;
          const isFeedbackOpen = expandedFeedbackId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1.5 animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 px-1">
                <span>{isAi ? "Gia sư AI" : "Bạn"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-2 relative ${
                  isAi
                    ? "bg-white border border-slate-200 text-slate-900 rounded-tl-sm"
                    : "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm"
                }`}
              >
                {/* Audio speaker button for AI messages */}
                {isAi && (
                  <button
                    onClick={() => speakText(msg.japanese, msg.id)}
                    type="button"
                    className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors cursor-pointer ${
                      isPlaying
                        ? "bg-emerald-100 text-emerald-700 animate-pulse"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                      isAi ? "text-emerald-700" : "text-emerald-100"
                    }`}
                  >
                    {msg.furigana}
                  </p>
                )}

                {/* Romaji */}
                {showRomaji && msg.romaji && (
                  <p
                    className={`text-xs font-mono tracking-wide ${
                      isAi ? "text-slate-400" : "text-emerald-200"
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
                        ? "border-slate-100 text-slate-600"
                        : "border-emerald-500/50 text-emerald-50"
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
                    className="flex items-center justify-between w-full px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl text-2xs font-bold text-emerald-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đánh giá phản xạ: {msg.evaluation.naturalnessScore ?? 85}/100</span>
                    </div>
                    {isFeedbackOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isFeedbackOpen && (
                    <div className="p-3 bg-white border border-emerald-200 rounded-2xl mt-1.5 space-y-2 text-xs shadow-2xs animate-in fade-in duration-150">
                      {msg.evaluation.grammarAdvice && (
                        <div>
                          <span className="font-bold text-slate-700 block">💡 Nhận xét của AI:</span>
                          <p className="text-slate-600 leading-relaxed">{msg.evaluation.grammarAdvice}</p>
                        </div>
                      )}

                      {msg.evaluation.betterExpression && (
                        <div className="pt-1.5 border-t border-slate-100">
                          <span className="font-bold text-emerald-800 block">
                            ✨ Cách nói tự nhiên hơn chuẩn bản xứ:
                          </span>
                          <p className="font-bold text-emerald-950 font-sans mt-0.5 text-sm">
                            {msg.evaluation.betterExpression}
                          </p>
                          {showFurigana && msg.evaluation.betterExpressionFurigana && (
                            <p className="text-2xs font-semibold text-emerald-700 font-sans tracking-wide mt-0.5">
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
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
              AI
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-sm p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-2xs font-semibold text-slate-400">Gia sư AI đang lắng nghe và suy nghĩ câu đối đáp...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Control & Interactive Recording Zone */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-200/90 space-y-3">
        {/* Suggested Quick Replies (Gợi ý câu trả lời nhanh khi người học bị bí từ) */}
        {suggestedReplies.length > 0 && !isLoading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Gợi ý câu đối đáp (kèm phiên âm Hiragana / Katakana):
              </span>
              <span className="text-3xs text-slate-400">Bấm để nghe & chọn phản xạ</span>
            </div>
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
              {suggestedReplies.map((item, idx) => {
                const jap = typeof item === "string" ? item : item.japanese;
                const furi = typeof item === "object" ? item.furigana : undefined;
                const trans = typeof item === "object" ? item.translation : undefined;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputVal(jap);
                      speakText(jap);
                    }}
                    className="group relative flex flex-col justify-between px-3.5 py-2 bg-slate-50 hover:bg-emerald-50/90 border border-slate-200/90 hover:border-emerald-300 rounded-2xl transition-all cursor-pointer text-left shadow-2xs shrink-0 max-w-[280px]"
                    title="Bấm để đưa câu này vào ô nhập và nghe giọng đọc mẫu"
                  >
                    <div className="flex items-center justify-between w-full gap-2 mb-0.5">
                      <span className="font-bold text-xs sm:text-sm font-sans text-slate-900 group-hover:text-emerald-900">
                        {jap}
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </div>
                    {showFurigana && furi && furi !== jap && (
                      <span className="text-2xs font-semibold text-emerald-700 font-sans tracking-wide">
                        {furi}
                      </span>
                    )}
                    {showTranslation && trans && (
                      <span className="text-3xs font-medium text-slate-500 group-hover:text-emerald-800 mt-0.5 line-clamp-1">
                        {trans}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live speech feedback when recording */}
        {isRecording && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-800">
                Đang lắng nghe giọng nói tiếng Nhật của bạn:
              </span>
              <span className="text-xs font-bold text-rose-950 font-sans">
                {liveTranscript || "..."}
              </span>
            </div>
            <button
              onClick={stopRecording}
              type="button"
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
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
                : "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-md"
            }`}
            title={isRecording ? "Bấm để dừng ghi âm" : "Bấm để nói tiếng Nhật với AI"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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
              className="w-full pl-4 pr-10 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-sm sm:text-base font-sans font-medium text-slate-900 focus:outline-none transition-all"
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
            className="p-3 sm:p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
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
