import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { Mic, Square } from 'lucide-react';


interface ChatInputProps {
  onSend: (content: string) => void;
  onSendAudio: (file: File) => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend,onSendAudio, isStreaming, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isStreaming && !disabled) {
      onSend(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const recorder = new MediaRecorder(stream);
  mediaRecorderRef.current = recorder;
  audioChunksRef.current = [];

  recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

  recorder.onstop = async () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const file = new File([blob], 'voice.wav', { type: 'audio/wav' });
    onSendAudio(file);
  };

  recorder.start();
  setIsRecording(true);
};

const stopRecording = () => {
  mediaRecorderRef.current?.stop();
  setIsRecording(false);
};

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
            disabled={isStreaming || disabled}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!content.trim() || isStreaming || disabled}
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
  type="button"
  size="icon"
  variant={isRecording ? 'destructive' : 'secondary'}
  onClick={isRecording ? stopRecording : startRecording}
  disabled={isStreaming || disabled}
>
  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
</Button>

        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
}
