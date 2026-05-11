import { useEffect, useRef } from "react";
import { useCurrentSession } from "../store/useChatStore";
import { MessageItem } from "./MessageItem";

export function MessageList() {
  const currentSession = useCurrentSession();
  const messages = currentSession?.messages || [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <h3>开始新对话</h3>
        <p>输入消息开始与AI聊天</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={scrollRef}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

