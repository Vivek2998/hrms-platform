import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSessions, useCreateChatSession, useChatMessages, useSendChatMessage } from '@/hooks/useChat';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const createSession = useCreateChatSession();

  async function handleNewSession() {
    const session = await createSession.mutateAsync();
    setActiveSession(session.id);
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <Button className="w-full" size="sm" onClick={handleNewSession} disabled={createSession.isPending}>
            <Plus className="w-4 h-4 mr-2" /> New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : !sessions?.length ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
          ) : (
            sessions.map((s: any) => (
              <button key={s.id} onClick={() => setActiveSession(s.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors',
                  activeSession === s.id && 'bg-muted'
                )}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {s.messages?.[0]?.content?.slice(0, 40) ?? 'New conversation'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(s.updatedAt), 'dd MMM, HH:mm')} · {s._count?.messages ?? 0} msgs
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeSession ? (
        <ChatWindow sessionId={activeSession} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <Bot className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">HR Assistant</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Ask me about leave balances, payslips, company policies, attendance, or any HR-related question.
          </p>
          <Button onClick={handleNewSession} disabled={createSession.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Start a Conversation
          </Button>
        </div>
      )}
    </div>
  );
}

function ChatWindow({ sessionId }: { sessionId: string }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = useChatMessages(sessionId);
  const send = useSendChatMessage(sessionId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput('');
    await send.mutateAsync(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        <span className="font-medium">HR Assistant</span>
        <span className="text-xs text-muted-foreground ml-1">Powered by Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />)}
          </div>
        ) : !messages?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-10 h-10 mb-2" />
            <p className="text-sm">How can I help you today?</p>
          </div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 mr-2 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={cn(
                'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              )}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about leave, payslips, policies..."
          disabled={send.isPending}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim() || send.isPending} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
