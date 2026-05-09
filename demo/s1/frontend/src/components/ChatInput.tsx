import { useState, useRef } from "react";
import { useChat } from "../hooks/useChat";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage, stopStreaming, isStreaming } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    await sendMessage(content);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      <div className="max-w-3xl mx-auto relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={isStreaming}
          className="w-full bg-gray-700 text-white rounded-lg pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="absolute right-2 bottom-2 p-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
