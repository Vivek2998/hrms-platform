import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatSessions, useCreateChatSession, useChatMessages } from '@/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Markdown bubble shared between streamed and historical messages ────────────

const mdComponents = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => <ul className="my-1 list-disc pl-4 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children: React.ReactNode }) => <ol className="my-1 list-decimal pl-4 space-y-0.5">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="my-1.5 overflow-x-auto rounded bg-background/60 p-2 font-mono text-xs">{children}</pre>
  ),
};

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 mr-2 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

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

      {/* Chat area */}
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

// ── Chat window ───────────────────────────────────────────────────────────────

function ChatWindow({ sessionId }: { sessionId: string }) {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [toolStatus, setToolStatus] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading, refetch } = useChatMessages(sessionId);
  const qc = useQueryClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setStreaming(true);
    setStreamText('');
    setToolStatus('');

    // Optimistic user message
    qc.setQueryData(['chat-messages', sessionId], (old: any[] | undefined) => [
      ...(old ?? []),
      { id: `opt-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() },
    ]);

    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${BASE_URL}/api/v1/chat/sessions/${sessionId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok || !res.body) throw new Error('Stream error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const evt = JSON.parse(line.slice(6)) as { type: string; text?: string; tool?: string };
          if (evt.type === 'delta' && evt.text) {
            accumulated += evt.text;
            setStreamText(accumulated);
            setToolStatus('');
          } else if (evt.type === 'tool_call' && evt.tool) {
            setToolStatus(`Checking ${evt.tool.replace(/_/g, ' ')}…`);
          } else if (evt.type === 'done') {
            await refetch();
            qc.invalidateQueries({ queryKey: ['chat-sessions'] });
          }
        }
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setStreaming(false);
      setStreamText('');
      setToolStatus('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        <span className="font-medium">HR Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />)}
          </div>
        ) : !messages?.length && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-10 h-10 mb-2" />
            <p className="text-sm">How can I help you today?</p>
          </div>
        ) : (
          messages?.map((m: any) => (
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
                {m.role === 'user' ? m.content : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}

        {/* Tool status indicator */}
        {toolStatus && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9">
            <span className="inline-flex gap-1">
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            {toolStatus}
          </div>
        )}

        {/* Streaming assistant bubble */}
        {streaming && streamText && <AssistantBubble content={streamText} />}

        {/* Waiting dots (before first delta arrives) */}
        {streaming && !streamText && !toolStatus && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 mr-2">
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
          disabled={streaming}
          className="flex-1"
        />
        <Button onClick={() => void handleSend()} disabled={!input.trim() || streaming} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
