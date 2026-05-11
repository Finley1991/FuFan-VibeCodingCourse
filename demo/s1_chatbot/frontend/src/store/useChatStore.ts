import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Message, Session, Settings } from "../types";

interface ChatStore {
  sessions: Session[];
  currentSessionId: string | null;
  settings: Settings;
  showSettings: boolean;

  addSession: () => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  selectSession: (id: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setSettings: (settings: Partial<Settings>) => void;
  toggleSettings: () => void;
  getCurrentSession: () => Session | null;
}

const mockSession: Session = {
  id: "1",
  title: "新对话",
  createdAt: Date.now(),
  messages: [
    { id: "1", role: "user", content: "你好！" },
    {
      id: "2",
      role: "assistant",
      content: "你好！我是AI助手，有什么可以帮助你的吗？",
      thinking: "让我思考一下如何回复这个问候...",
    },
  ],
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [mockSession],
      currentSessionId: "1",
      settings: {
        model: "deepseek-v4-flash",
        temperature: 0.7,
        apiKey: "",
      },
      showSettings: false,

      getCurrentSession: () => {
        const state = get();
        return state.sessions.find((s) => s.id === state.currentSessionId) || null;
      },

      addSession: () => {
        const newSession: Session = {
          id: Date.now().toString(),
          title: "新对话",
          createdAt: Date.now(),
          messages: [],
        };
        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: newSession.id,
        }));
      },

      deleteSession: (id: string) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            currentSessionId:
              state.currentSessionId === id
                ? newSessions[newSessions.length - 1]?.id || null
                : state.currentSessionId,
          };
        });
      },

      renameSession: (id: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
          ),
        }));
      },

      selectSession: (id: string) => {
        set({ currentSessionId: id });
      },

      addMessage: (message: Message) => {
        set((state) => {
          if (!state.currentSessionId) return {};
          return {
            sessions: state.sessions.map((s) =>
              s.id === state.currentSessionId
                ? { ...s, messages: [...s.messages, message] }
                : s
            ),
          };
        });
      },

      updateMessage: (id: string, updates: Partial<Message>) => {
        set((state) => {
          if (!state.currentSessionId) return {};
          return {
            sessions: state.sessions.map((s) =>
              s.id === state.currentSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === id ? { ...m, ...updates } : m
                    ),
                  }
                : s
            ),
          };
        });
      },

      setSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      toggleSettings: () => {
        set((state) => ({ showSettings: !state.showSettings }));
      },
    }),
    {
      name: "chatbot-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useCurrentSession() {
  return useChatStore((state) =>
    state.sessions.find((s) => s.id === state.currentSessionId) || null
  );
}

