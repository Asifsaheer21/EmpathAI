import { Bot, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onExampleClick: (message: string) => void;
}

const examplePrompts = [
  "I’m not sure where to begin, but I need to talk to someone",
  "Something happened that’s been bothering me a lot",
  "I feel overwhelmed and need help explaining my situation",
  "I’m struggling to put what happened into words",
];

export function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      
      <h1 className="mb-2 text-3xl font-bold">How can I help you today?</h1>
      <p className="mb-8 text-muted-foreground">
        Start a conversation or try one of these examples
      </p>

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onExampleClick(prompt)}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
