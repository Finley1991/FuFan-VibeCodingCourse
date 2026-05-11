import { useState } from "react";
import { useChatStore, useCurrentSession } from "../store/useChatStore";
import { sendMessage } from "../api";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage, updateMessage, settings, getCurrentSession } = useChatStore();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);

    // 使用 store 方法直接获取最新的当前会话，避免闭包陷阱
    const currentSession = getCurrentSession();
    if (!currentSession) {
      setIsLoading(false);
      return;
    }

    // 构建消息列表
    const messagesForAPI = [
      ...currentSession.messages
        .filter(m => m.content && m.content.trim())
        .map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent }
    ];

    // 添加用户消息到界面
    const userMessageId = Date.now().toString();
    addMessage({
      id: userMessageId,
      role: "user",
      content: userContent,
    });

    // 添加空的助手消息占位符
    const assistantMessageId = (Date.now() + 1).toString();
    addMessage({
      id: assistantMessageId,
      role: "assistant",
      content: "",
      thinking: "",
    });

    try {
      let fullContent = "";
      let fullThinking = "";

      // 调用 API
      for await (const chunk of sendMessage(
        messagesForAPI,
        settings.model,
        settings.temperature
      )) {
        if (chunk.type === "reasoning") {
          fullThinking += chunk.content;
          updateMessage(assistantMessageId, { thinking: fullThinking });
        } else if (chunk.type === "content") {
          fullContent += chunk.content;
          updateMessage(assistantMessageId, { content: fullContent });
        } else if (chunk.type === "error") {
          updateMessage(assistantMessageId, { content: "错误: " + chunk.content });
        }
      }
    } catch (err) {
      updateMessage(assistantMessageId, {
        content: "抱歉，发生了错误：" + (err as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  );
}
