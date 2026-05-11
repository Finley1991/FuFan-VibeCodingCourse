export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  isThinking?: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Settings {
  model: string;
  temperature: number;
  apiKey: string;
}

