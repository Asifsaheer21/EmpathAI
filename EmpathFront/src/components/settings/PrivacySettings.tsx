import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { userApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PrivacySettings() {
  const navigate = useNavigate();
  const { deleteAccount } = useAuth();
  const { deleteAllConversations } = useChat();
  const { toast } = useToast();

  const [chatHistory, setChatHistory] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [showDeleteChatsDialog, setShowDeleteChatsDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await userApi.exportData();
      if (response.success && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-assistant-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Export complete',
          description: 'Your data has been downloaded.',
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export your data. Please try again.',
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const handleDeleteAllChats = async () => {
    setIsDeletingChats(true);
    await deleteAllConversations();
    setShowDeleteChatsDialog(false);
    setIsDeletingChats(false);
    toast({
      title: 'Chats deleted',
      description: 'All your conversations have been deleted.',
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    const result = await deleteAccount();
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      setIsDeletingAccount(false);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Controls</CardTitle>
          <CardDescription>Manage how your data is used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="chat-history">Chat History</Label>
              <p className="text-sm text-muted-foreground">
                Save your conversations for future reference
              </p>
            </div>
            <Switch
              id="chat-history"
              checked={chatHistory}
              onCheckedChange={setChatHistory}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-collection">Usage Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve the AI by sharing usage data
              </p>
            </div>
            <Switch
              id="data-collection"
              checked={dataCollection}
              onCheckedChange={setDataCollection}
            />
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download a copy of all your data including conversations and account
            information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export all data
              </>
            )}
          </Button>
        </CardContent>
      </Card> */}
      
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete all conversations</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your chat history
              </p>
            </div>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteChatsDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAccountDialog(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteChatsDialog} onOpenChange={setShowDeleteChatsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your chat history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllChats}
              disabled={isDeletingChats}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingChats ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
