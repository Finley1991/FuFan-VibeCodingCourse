import { create } from "zustand";
import type { Message, Conversation } from "../types";

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;

  setConversations: (convs: Conversation[]) => void;
  setCurrentConversation: (id: string | null) => void;
  setMessages: (msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  updateStreamingContent: (text: string) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",

  setConversations: (convs) => set({ conversations: convs }),
  setCurrentConversation: (id) => set({ currentConversationId: id, messages: [], streamingContent: "" }),
  setMessages: (msgs) => set({ messages: msgs }),
  appendMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setStreaming: (streaming, content = "") => set({ isStreaming: streaming, streamingContent: content }),
  updateStreamingContent: (text) => set({ streamingContent: text }),
  addConversation: (conv) => set((state) => ({ conversations: [conv, ...state.conversations] })),
  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
    messages: state.currentConversationId === id ? [] : state.messages,
  })),
}));
