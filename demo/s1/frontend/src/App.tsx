import { useEffect } from "react";
import ChatLayout from "./components/ChatLayout";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useChatStore } from "./store/chatStore";
import { fetchConversations, fetchConversation } from "./services/api";

function App() {
  const { currentConversationId, setConversations, setCurrentConversation, setMessages } = useChatStore();

  useEffect(() => {
    fetchConversations().then(setConversations).catch(console.error);
  }, [setConversations]);

  useEffect(() => {
    if (currentConversationId) {
      fetchConversation(currentConversationId)
        .then((detail) => setMessages(detail.messages))
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, setMessages]);

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        <MessageList />
        <ChatInput />
      </div>
    </ChatLayout>
  );
}

export default App;
