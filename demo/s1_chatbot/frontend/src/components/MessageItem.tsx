import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">
        {message.role === "user" ? "👤" : "🤖"}
      </div>
      <div className="message-content">
        {message.thinking && (
          <div className="thinking-section">
            <button
              className="thinking-toggle"
              onClick={() => setShowThinking(!showThinking)}
            >
              {showThinking ? "▼ 隐藏思考过程" : "▶ 显示思考过程"}
            </button>
            {showThinking && (
              <div className="thinking-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.thinking}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        <div className="message-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
