import { useCallback, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { streamChat } from "../services/api";

export function useChat() {
  const { appendMessage, setStreaming, updateStreamingContent, currentConversationId } = useChatStore();
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    appendMessage({ role: "user", content });
    setStreaming(true, "");

    let accumulated = "";
    controllerRef.current = streamChat(
      { content, conversation_id: currentConversationId || undefined },
      (data) => {
        if (data.error) {
          console.error("Stream error:", data.error);
          setStreaming(false);
        } else if (data.done) {
          setStreaming(false);
          controllerRef.current = null;
        } else if (data.delta) {
          accumulated += data.delta;
          updateStreamingContent(accumulated);
        }
      },
    );
  }, [appendMessage, setStreaming, updateStreamingContent, currentConversationId]);

  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming(false);
    controllerRef.current = null;
  }, [setStreaming]);

  return { sendMessage, stopStreaming, isStreaming: useChatStore((s) => s.isStreaming) };
}
