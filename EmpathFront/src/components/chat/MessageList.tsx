import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import type { Message } from '@/types';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
        />
      ))}
      {isStreaming && streamingContent && (
        <ChatMessage
          role="assistant"
          content={streamingContent}
          isStreaming
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
