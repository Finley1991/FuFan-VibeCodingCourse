import { useChatStore } from "../store/useChatStore";

export function Sidebar() {
  const {
    sessions,
    currentSessionId,
    addSession,
    deleteSession,
    selectSession,
    toggleSettings,
  } = useChatStore();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ChatBot</h2>
        <button className="new-chat-btn" onClick={addSession}>
          + 新对话
        </button>
      </div>
      <div className="session-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${
              session.id === currentSessionId ? "active" : ""
            }`}
            onClick={() => selectSession(session.id)}
          >
            <span className="session-title">{session.title}</span>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteSession(session.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="settings-btn" onClick={toggleSettings}>
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
}

