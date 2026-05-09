import { useCallback, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { streamChat } from "../services/api";

export function useChat() {
  const { appendMessage, setStreaming, updateStreamingContent, currentConversationId } = useChatStore();
  const controllerRef = useRef<AbortController | null>(null);
  const accumulatedRef = useRef("");

  const sendMessage = useCallback(async (content: string) => {
    appendMessage({ role: "user", content });
    setStreaming(true, "");
    accumulatedRef.current = "";

    controllerRef.current = streamChat(
      { content, conversation_id: currentConversationId || undefined },
      (data) => {
        if (data.error) {
          console.error("Stream error:", data.error);
          setStreaming(false);
          controllerRef.current = null;
        } else if (data.done) {
          // 保存完整的 AI 回复到消息列表
          if (accumulatedRef.current) {
            appendMessage({ role: "assistant", content: accumulatedRef.current });
          }
          setStreaming(false);
          controllerRef.current = null;
        } else if (data.delta) {
          accumulatedRef.current += data.delta;
          updateStreamingContent(accumulatedRef.current);
        }
      },
    );
  }, [appendMessage, setStreaming, updateStreamingContent, currentConversationId]);

  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    // 保存已累积的内容
    if (accumulatedRef.current) {
      appendMessage({ role: "assistant", content: accumulatedRef.current });
      accumulatedRef.current = "";
    }
    setStreaming(false);
    controllerRef.current = null;
  }, [appendMessage, setStreaming]);

  return { sendMessage, stopStreaming, isStreaming: useChatStore((s) => s.isStreaming) };
}
