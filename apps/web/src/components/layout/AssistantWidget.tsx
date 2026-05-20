import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSessions, useCreateChatSession, useChatMessages, useSendChatMessage } from '@/hooks/useChat';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const createSession = useCreateChatSession();
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();

  async function handleNewSession() {
    const session = await createSession.mutateAsync();
    setActiveSession(session.id);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          open
            ? 'bg-muted text-foreground hover:bg-muted/80'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
        aria-label="Assistant"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-200',
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Assistant</p>
            <p className="text-[10px] text-muted-foreground">Powered by Claude</p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleNewSession} disabled={createSession.isPending} className="h-7 gap-1 px-2 text-xs">
            <Plus className="h-3 w-3" /> New
          </Button>
        </div>

        {activeSession ? (
          <ChatWindow sessionId={activeSession} onBack={() => setActiveSession(null)} />
        ) : (
          /* Session list */
          <div className="flex flex-1 flex-col overflow-hidden">
            {sessionsLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : !sessions?.length ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium">Ask me anything about HR</p>
                <p className="text-xs text-muted-foreground">Leave balances, payslips, policies, attendance…</p>
                <Button size="sm" onClick={handleNewSession} disabled={createSession.isPending}>
                  <Plus className="mr-1 h-3 w-3" /> Start a Conversation
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {sessions.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    className="flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{s.messages?.[0]?.content?.slice(0, 42) ?? 'New conversation'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(s.updatedAt), 'dd MMM, HH:mm')} · {s._count?.messages ?? 0} msgs
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ChatWindow({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <button onClick={onBack} className="flex items-center gap-1.5 border-b px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50">
        ← Back to conversations
      </button>

      <div className="flex-1 overflow-y-auto space-y-3 px-3 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-3/4 rounded-xl" />)}
          </div>
        ) : !messages?.length ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Bot className="mb-2 h-8 w-8" />
            <p className="text-xs">How can I help you today?</p>
          </div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-3 w-3" />
                </div>
              )}
              <div className={cn(
                'max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm',
              )}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {send.isPending && (
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-3 w-3" />
            </div>
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t px-3 py-2.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about leave, payslips, policies…"
          disabled={send.isPending}
          className="h-8 flex-1 text-xs"
        />
        <Button onClick={handleSend} disabled={!input.trim() || send.isPending} size="icon" className="h-8 w-8 shrink-0">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
