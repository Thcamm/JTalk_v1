import ChatMessage from "./ChatMessage";
import type { Message } from "@/data/speaking";

type Props = {
  messages: Message[];
  isTyping: boolean;
};

export default function ChatArea({
  messages,
  isTyping,
}: Props) {
  return (
    <div
      className="
        h-full
        overflow-y-auto
        space-y-6
        pr-2
        bg-card
        ounded-2xl
        p-4
      "
    >
      {messages.map(
        (message, index) => (
          <ChatMessage
            key={index}
            message={message}
          />
        )
      )}

      {isTyping && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">

          <div className="size-2 rounded-full bg-primary animate-bounce" />

          <div
            className="size-2 rounded-full bg-primary animate-bounce"
            style={{
              animationDelay:
                "0.2s",
            }}
          />

          <div
            className="size-2 rounded-full bg-primary animate-bounce"
            style={{
              animationDelay:
                "0.4s",
            }}
          />

          <span>Aki đang trả lời...</span>

        </div>
      )}
    </div>
  );
}