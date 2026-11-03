import { User } from "lucide-react";
import type { Message } from "@/data/speaking";

type Props = {
  message: Message;
};

export default function ChatMessage({
  message,
}: Props) {
  const isAI = message.sender === "ai";

  return (
    <div
      className={`flex items-end gap-3 ${isAI ? "justify-start" : "justify-end"
        }`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />

          <div
            className="
              relative
              h-11
              w-11
              rounded-full
              bg-gradient-chat
              flex
              items-center
              justify-center
              text-white
              shadow-glow
            "
          >
            <img
              src="https://www.studytienganh.vn/upload/2022/05/112275.jpg"
              alt="AI"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
        </div>
      )}

      {/* Message */}
      <div
        className={`
          max-w-[85%]
          sm:max-w-[75%]
          rounded-2xl
          sm:rounded-3xl
          px-3.5
          sm:px-5
          py-2.5
          sm:py-4
          shadow-bubble
          ${isAI
            ? "chat-bubble-received"
            : "bg-gradient-chat text-white"
          }
        `}
      >
        <div className="mb-1 text-xs opacity-70">
          {isAI ? "Aki" : "You"}
        </div>

        <p className="leading-relaxed text-sm sm:text-base break-words [overflow-wrap:anywhere]">
          {message.text}
        </p>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div
          className="
            h-11
            w-11
            rounded-full
            bg-muted
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <User size={20} />
        </div>
      )}
    </div>
  );
}