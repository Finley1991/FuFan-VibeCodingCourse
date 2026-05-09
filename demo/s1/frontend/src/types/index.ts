export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  content: string;
  conversation_id?: string;
}

export interface ChatDelta {
  delta?: string;
  done?: boolean;
  error?: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}
