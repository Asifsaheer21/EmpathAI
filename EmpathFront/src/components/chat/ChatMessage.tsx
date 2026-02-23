// import { cn } from '@/lib/utils';
// import { Bot, User } from 'lucide-react';

// interface ChatMessageProps {
//   role: 'user' | 'assistant';
//   content: string;
//   isStreaming?: boolean;
// }

// export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
//   return (
//     <div
//       className={cn(
//         'group relative flex gap-4 px-4 py-6 md:px-8',
//         role === 'assistant' && 'bg-muted/50'
//       )}
//     >
//       <div
//         className={cn(
//           'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
//           role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
//         )}
//       >
//         {role === 'user' ? (
//           <User className="h-4 w-4" />
//         ) : (
//           <Bot className="h-4 w-4" />
//         )}
//       </div>
//       <div className="flex-1 space-y-2 overflow-hidden">
//         <p className="text-sm font-medium">
//           {role === 'user' ? 'You' : 'AI Assistant'}
//         </p>
//         <div className="prose prose-sm dark:prose-invert max-w-none">
//           <p className="whitespace-pre-wrap break-words">{content}</p>
//           {isStreaming && (
//             <span className="inline-block h-4 w-2 animate-pulse bg-foreground/50" />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { cn } from '@/lib/utils';
import { Bot, User, Volume2, Square } from 'lucide-react';
import { useRef, useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    try {
      // If already speaking, stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        setIsSpeaking(false);
        return;
      }

      // Ensure Puter is available
      const puter = (window as any).puter;
      if (!puter?.ai?.txt2speech) {
        alert("Puter.js not loaded. Add: <script src='https://js.puter.com/v2/'></script>");
        return;
      }

      setIsSpeaking(true);

      const audio: HTMLAudioElement = await puter.ai.txt2speech(content, {
        language: "en-IN",       
        engine: "generative",   
        voice: "Kajal", 
      });

      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        setIsSpeaking(false);
      };

      audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      audioRef.current = null;
      setIsSpeaking(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex gap-4 px-4 py-6 md:px-8',
        role === 'assistant' && 'bg-muted/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">
            {role === 'user' ? 'You' : 'AI Assistant'}
          </p>

          {/* ✅ Speak button (only for assistant) */}
          {role === "assistant" && (
            <button
              onClick={handleSpeak}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "rounded-md border px-2 py-1 text-xs flex items-center gap-1",
                "hover:bg-muted"
              )}
              title={isSpeaking ? "Stop" : "Read aloud"}
            >
              {isSpeaking ? (
                <>
                  <Square className="h-3 w-3" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" /> Read
                </>
              )}
            </button>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap break-words">{content}</p>
          {isStreaming && (
            <span className="inline-block h-4 w-2 animate-pulse bg-foreground/50" />
          )}
        </div>
      </div>
    </div>
  );
}