import { useEffect, useState } from "react";

import ChatArea from "@/components/speaking/ChatArea";
import ActionArea from "@/components/speaking/ActionArea";
import ResultModal from "@/components/speaking/ResultModal";
import ConversationHeader from "@/components/speaking/ConversationHeader";

import { conversation } from "@/data/conversation";

import type {
  Message,
  Step,
} from "@/data/speaking";

export default function SpeakingPracticePage() {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [step, setStep] =
    useState<Step>("ai");

  const [turn, setTurn] = useState(0);

  const [score] = useState(92);

  useEffect(() => {
    speakAiTurn(0);
  }, []);

  const speakAiTurn = (
    index: number
  ) => {
    const text =
      conversation[index].ai;

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text,
      },
    ]);

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ja-JP";

    utterance.onend = () =>
      setStep("user");

    speechSynthesis.speak(
      utterance
    );
  };

  const startRecording = () => {
    setStep("recording");

    setTimeout(() => {
      const answer =
        conversation[turn].expected;

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: answer,
        },
      ]);

      if (
        turn ===
        conversation.length - 1
      ) {
        setStep("processing");

        setTimeout(() => {
          setStep("result");
        }, 3000);

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
          onEndChat={() =>
            setStep("result")
          }
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
        score={score}
        onClose={() =>
          setStep("user")
        }
        onRetry={() =>
          window.location.reload()
        }
      />
    </>
  );
}