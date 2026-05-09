import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import MarkdownContent from "./MarkdownContent";
import { useChatStore } from "../store/chatStore";

export default function MessageList() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>How can I help you today?</p>
          </div>
        ) : null}
        {messages.map((msg, i) => (
          <MessageItem key={i} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && streamingContent ? (
          <div className="py-6 px-4 bg-gray-900">
            <div className="max-w-3xl mx-auto">
              <div className="font-semibold text-sm text-gray-400 mb-1">Assistant</div>
              <div className="text-gray-200">
                <MarkdownContent content={streamingContent} />
              </div>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
