"use client";

import { useEffect, useState } from "react";
import { useParams } from "@/lib/react-router-compat";

import ChatArea from "@/components/speaking/ChatArea";
import ActionArea from "@/components/speaking/ActionArea";
import ResultModal from "@/components/speaking/ResultModal";
import ConversationHeader from "@/components/speaking/ConversationHeader";

import { conversation } from "@/data/conversation";
import { practiceService } from "@/services/practice.service";
import type { Practice } from "@/types";

import type {
  Message,
  Step,
} from "@/data/speaking";

export default function SpeakingPracticePage() {
  const params = useParams<{ lessonId?: string }>();
  const lessonId = params.lessonId || "lesson-1";

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("ai");
  const [turn, setTurn] = useState(0);
  const [currentPractice, setCurrentPractice] = useState<Practice | null>(null);

  useEffect(() => {
    speakAiTurn(0);
  }, []);

  const speakAiTurn = async (index: number) => {
    const text = conversation[index].ai;

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text,
      },
    ]);

    // 1. Try Microsoft Edge Neural TTS first for high quality speech
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
        audio.onended = () => setStep("user");
        audio.onerror = () => setStep("user");
        await audio.play();
        return;
      }
    } catch (_) {
      // Fallback to browser synthesis
    }

    // 2. Fallback: Browser Web Speech API
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.onend = () => setStep("user");
      utterance.onerror = () => setStep("user");
      speechSynthesis.speak(utterance);
    } else {
      setStep("user");
    }
  };

  const finishPracticeSession = async () => {
    setStep("processing");

    try {
      // Create real Practice record in database with status "pending"
      const created = await practiceService.createPractice(
        lessonId,
        conversation[0]?.expected || "図書館で勉強します"
      );
      setCurrentPractice(created);
    } catch (err) {
      console.error("Lỗi khi tạo bài luyện tập:", err);
    } finally {
      setStep("result");
    }
  };

  const startRecording = () => {
    setStep("recording");

    setTimeout(() => {
      const answer = conversation[turn].expected;

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: answer,
        },
      ]);

      if (turn === conversation.length - 1) {
        finishPracticeSession();
        return;
      }

      const nextTurn = turn + 1;
      setTurn(nextTurn);
      setStep("ai");

      setTimeout(() => {
        speakAiTurn(nextTurn);
      }, 1200);
    }, 2500);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-8 py-6 h-screen flex flex-col">
        <ConversationHeader
          title="図書館での勉強相談"
          onEndChat={finishPracticeSession}
        />

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <ChatArea
            messages={messages}
            isTyping={step === "ai"}
          />
        </div>

        {/* Voice */}
        <ActionArea
          step={step}
          onRecord={startRecording}
        />
      </div>

      <ResultModal
        open={step === "result"}
        practice={currentPractice}
        onClose={() => setStep("user")}
        onRetry={() => window.location.reload()}
      />
    </>
  );
}