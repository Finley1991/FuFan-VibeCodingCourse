import { useChatStore } from "../store/useChatStore";

export function SettingsPanel() {
  const { settings, setSettings, showSettings, toggleSettings } =
    useChatStore();

  if (!showSettings) return null;

  return (
    <div className="settings-overlay" onClick={toggleSettings}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="close-btn" onClick={toggleSettings}>
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-item">
            <label>模型</label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ model: e.target.value })}
            >
              <option value="deepseek-v4-flash">deepseek-v4-flash</option>
              <option value="deepseek-reasoner">deepseek-reasoner</option>
            </select>
          </div>
          <div className="setting-item">
            <label>温度: {settings.temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings({ temperature: parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="setting-item">
            <label>API Key</label>
            <input
              type="password"
              placeholder="输入你的DeepSeek API Key"
              value={settings.apiKey}
              onChange={(e) => setSettings({ apiKey: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

