import { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { Conversation } from '@/types';

interface ChatHistoryGroupProps {
  title: string;
  conversations: Conversation[];
}

export function ChatHistoryGroup({ title, conversations }: ChatHistoryGroupProps) {
  const { currentConversation, selectConversation, deleteConversation } = useChat();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center rounded-lg transition-colors ${
              currentConversation?.id === conv.id
                ? 'bg-sidebar-accent'
                : 'hover:bg-sidebar-accent/50'
            }`}
          >
            <button
              onClick={() => selectConversation(conv.id)}
              className="flex flex-1 items-center gap-2 px-2 py-2 text-left"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">
                {conv.title || conv.preview || 'New Chat'}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setDeleteId(conv.id)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
