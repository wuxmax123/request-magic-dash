import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  rfq_id: string;
  user_id: string;
  message: string | null;
  attachments: string[];
  created_at: string;
}

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
}

interface RFQCommunicationProps {
  rfqId: string;
}

export function RFQCommunication({ rfqId }: RFQCommunicationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    getCurrentUser();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`rfq-messages-${rfqId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rfq_messages',
          filter: `rfq_id=eq.${rfqId}`
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rfqId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadMessages = async () => {
    const { data: messagesData, error: messagesError } = await supabase
      .from('rfq_messages')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Failed to load messages:', messagesError);
      return;
    }

    setMessages(messagesData);

    // Load user profiles for all unique user_ids
    const userIds = [...new Set(messagesData.map(m => m.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesData) {
      const profilesMap = new Map<string, Profile>();
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
      setProfiles(profilesMap);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('rfq-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('rfq-attachments')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const attachmentUrls = await uploadFiles();

      const { error } = await supabase
        .from('rfq_messages')
        .insert({
          rfq_id: rfqId,
          user_id: currentUserId!,
          message: newMessage.trim() || null,
          attachments: attachmentUrls
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFiles([]);
      
      toast({
        title: '发送成功 Sent',
        description: '消息已发送 Message sent successfully'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: '发送失败 Failed',
        description: '消息发送失败 Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUserDisplayName = (msg: Message) => {
    const profile = profiles.get(msg.user_id);
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    return msg.user_id === currentUserId ? '我 Me' : '对方 Other';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无消息，开始沟通吧 No messages yet, start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.user_id === currentUserId;
              const displayName = getUserDisplayName(msg);

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isCurrentUser && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn('flex flex-col gap-1', isCurrentUser && 'items-end')}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{displayName}</span>
                      <span>
                        {new Date(msg.created_at).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-md',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.message && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      )}
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'flex items-center gap-2 text-xs hover:underline',
                                isCurrentUser ? 'text-primary-foreground' : 'text-foreground'
                              )}
                            >
                              <FileText className="h-3 w-3" />
                              附件 {idx + 1} Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-muted rounded px-2 py-1 text-xs"
              >
                <FileText className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... Type a message..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={uploading}
          />
          
          <Button
            onClick={sendMessage}
            disabled={uploading || (!newMessage.trim() && selectedFiles.length === 0)}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}