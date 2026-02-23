import { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { conversationsApi } from '@/services/api';

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    loadConversations,
    createConversation,
    sendMessage,
    sendAudioMessage
  } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSend = async (content: string) => {
    if (!currentConversation) {
      await createConversation();
    }
    await sendMessage(content);
  };

  const handleExampleClick = async (message: string) => {
    if (!currentConversation) {
      await createConversation();
    }
    await sendMessage(message);
  };
const handleSendAudio = async (file: File) => {
  if (!currentConversation) {
    await createConversation();
  }
  await sendAudioMessage(file);
};

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex flex-1 flex-col overflow-hidden">
        {messages.length === 0 && !isStreaming ? (
          <WelcomeScreen onExampleClick={handleExampleClick} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        )}
        <ChatInput
  onSend={handleSend}
  onSendAudio={handleSendAudio}   // ✅ ADD
  isStreaming={isStreaming}
/>

      </main>
    </div>
  );
}
