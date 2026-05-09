import { useChatStore } from "../store/chatStore";
import { fetchConversations, createConversation, deleteConversation } from "../services/api";

export default function Sidebar() {
  const { conversations, currentConversationId, setConversations, setCurrentConversation, addConversation, removeConversation } = useChatStore();

  const reload = () => fetchConversations().then(setConversations);

  const handleNew = async () => {
    const conv = await createConversation();
    addConversation({ id: conv.id, title: conv.title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    setCurrentConversation(conv.id);
  };

  const handleSelect = (id: string) => {
    setCurrentConversation(id);
    fetchConversations().then(setConversations);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    removeConversation(id);
  };

  return (
    <div className="w-64 h-full bg-gray-900 text-gray-300 flex flex-col p-3">
      <button
        onClick={handleNew}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-left mb-4"
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 ${currentConversationId === conv.id ? "bg-white/10" : ""}`}
          >
            <span className="truncate text-sm">{conv.title}</span>
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
