import { Sidebar } from './components/Sidebar'
import { MessageList } from './components/MessageList'
import { ChatInput } from './components/ChatInput'
import { SettingsPanel } from './components/SettingsPanel'
import './App.css'

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="chat-area">
        <MessageList />
        <ChatInput />
      </main>
      <SettingsPanel />
    </div>
  )
}

export default App

