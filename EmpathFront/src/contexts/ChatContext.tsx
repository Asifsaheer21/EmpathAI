import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Conversation, Message, GroupedConversations } from '@/types';
import { conversationsApi } from '@/services/api';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  getGroupedConversations: () => GroupedConversations;
  sendAudioMessage: (file: File) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    const response = await conversationsApi.getAll();
    if (response.success && response.data) {
      setConversations(response.data.conversations);
    }
    setIsLoading(false);
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
      setIsLoading(true);
      const response = await conversationsApi.getMessages(id);
      if (response.success && response.data) {
        setMessages(response.data.messages);
      }
      setIsLoading(false);
    }
  }, [conversations]);

  const createConversation = useCallback(async () => {
    const response = await conversationsApi.create();
    if (response.success && response.data) {
      const newConversation = response.data;
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
      return newConversation;
    }
    return null;
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const response = await conversationsApi.delete(id);
    if (response.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  }, [currentConversation]);

  const deleteAllConversations = useCallback(async () => {
    const response = await conversationsApi.deleteAll();
    if (response.success) {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start streaming
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await conversationsApi.sendMessage(currentConversation.id, content);
      
      if (!response.ok || !response.body) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                // Add assistant message
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  conversationId: currentConversation.id,
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent('');
              }
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
    }
  }, [currentConversation]);

const sendAudioMessage = useCallback(async (file: File) => {
  if (!currentConversation) return;

  // System message
  setMessages((prev) => [
    ...prev,
    {
      id: `sys-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'user',
      content: '🎙️ Voice message 🎧 Processing your voice...',
      createdAt: new Date().toISOString(),
    },
  ]);

  setIsStreaming(true);
  setStreamingContent('');

  const response = await conversationsApi.sendAudio(
    currentConversation.id,
    file
  );

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = JSON.parse(line.slice(6));

      if (data.content) {
        fullContent += data.content;
        setStreamingContent(fullContent);
      }

      if (data.done) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            conversationId: currentConversation.id,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          },
        ]);
        setStreamingContent('');
      }
    }
  }

  setIsStreaming(false);
}, [currentConversation]);


  const getGroupedConversations = useCallback((): GroupedConversations => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const previous7Days = new Date(today);
    previous7Days.setDate(previous7Days.getDate() - 7);
    const previous30Days = new Date(today);
    previous30Days.setDate(previous30Days.getDate() - 30);

    const groups: GroupedConversations = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: [],
    };

    conversations.forEach((conv) => {
      const date = new Date(conv.updatedAt);
      if (date >= today) {
        groups.today.push(conv);
      } else if (date >= yesterday) {
        groups.yesterday.push(conv);
      } else if (date >= previous7Days) {
        groups.previous7Days.push(conv);
      } else if (date >= previous30Days) {
        groups.previous30Days.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [conversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        loadConversations,
        selectConversation,
        createConversation,
        deleteConversation,
        deleteAllConversations,
        sendMessage,
        sendAudioMessage,
        getGroupedConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
