import { useState } from 'react';
import { Heart, Send, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useKudosFeed, useGiveKudos, useReactToKudos, useDeleteKudos } from '@/hooks/useKudos';
import { useAuthStore } from '@/stores/auth.store';
import { formatDistanceToNow } from 'date-fns';
import type { Kudos, KudosCategory } from '@hrms/shared-types';

const CATEGORIES: { value: KudosCategory; label: string; emoji: string }[] = [
  { value: 'TEAMWORK', label: 'Teamwork', emoji: '🤝' },
  { value: 'INNOVATION', label: 'Innovation', emoji: '💡' },
  { value: 'LEADERSHIP', label: 'Leadership', emoji: '🌟' },
  { value: 'CUSTOMER_FOCUS', label: 'Customer Focus', emoji: '🎯' },
  { value: 'GOING_ABOVE_AND_BEYOND', label: 'Above & Beyond', emoji: '🚀' },
  { value: 'PROBLEM_SOLVING', label: 'Problem Solving', emoji: '🔧' },
  { value: 'MENTORSHIP', label: 'Mentorship', emoji: '🎓' },
  { value: 'OTHER', label: 'Other', emoji: '👏' },
];

const QUICK_REACTIONS = ['👍', '❤️', '🎉', '🙌', '🔥'];

const CATEGORY_META: Record<KudosCategory, { label: string; emoji: string; color: string }> = {
  TEAMWORK: { label: 'Teamwork', emoji: '🤝', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  INNOVATION: { label: 'Innovation', emoji: '💡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  LEADERSHIP: { label: 'Leadership', emoji: '🌟', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  CUSTOMER_FOCUS: { label: 'Customer Focus', emoji: '🎯', color: 'bg-green-100 text-green-700 border-green-200' },
  GOING_ABOVE_AND_BEYOND: { label: 'Above & Beyond', emoji: '🚀', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  PROBLEM_SOLVING: { label: 'Problem Solving', emoji: '🔧', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  MENTORSHIP: { label: 'Mentorship', emoji: '🎓', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  OTHER: { label: 'Other', emoji: '👏', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function KudosPage() {
  const [showGive, setShowGive] = useState(false);
  const { data: kudos, isLoading } = useKudosFeed();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            Recognition Wall
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Celebrate your colleagues</p>
        </div>
        <Button onClick={() => setShowGive(true)} className="bg-rose-500 hover:bg-rose-600 text-white">
          <Send className="w-4 h-4 mr-2" />
          Give Kudos
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : !kudos || kudos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold">Be the first to recognise someone!</h3>
          <p className="text-muted-foreground text-sm mt-1">Spread positivity in your team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {kudos.map((k) => (
            <KudosCard key={k.id} kudos={k} currentUserId={user?.id ?? ''} />
          ))}
        </div>
      )}

      <GiveKudosDialog open={showGive} onClose={() => setShowGive(false)} />
    </div>
  );
}

function KudosCard({ kudos, currentUserId }: { kudos: Kudos; currentUserId: string }) {
  const react = useReactToKudos();
  const del = useDeleteKudos();
  const meta = CATEGORY_META[kudos.category];
  const isOwner = kudos.fromEmployeeId === currentUserId;

  const totalReactions = Object.values(kudos.reactions).reduce((s, arr) => s + arr.length, 0);

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-3 px-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {kudos.fromEmployee.firstName[0]}{kudos.fromEmployee.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {kudos.fromEmployee.firstName} {kudos.fromEmployee.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{kudos.fromEmployee.designation ?? kudos.fromEmployee.employeeCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(kudos.createdAt), { addSuffix: true })}
            </span>
            {isOwner && (
              <button
                onClick={() => del.mutate(kudos.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* To + Category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">to</span>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold">
              {kudos.toEmployee.firstName[0]}{kudos.toEmployee.lastName[0]}
            </div>
            <span className="text-sm font-semibold">
              {kudos.toEmployee.firstName} {kudos.toEmployee.lastName}
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${meta.color}`}>
            {meta.emoji} {meta.label}
          </Badge>
        </div>

        {/* Message */}
        <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg p-3 italic">
          "{kudos.message}"
        </p>

        {/* Reactions */}
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_REACTIONS.map((emoji) => {
            const reactors = kudos.reactions[emoji] ?? [];
            const reacted = reactors.includes(currentUserId);
            return (
              <button
                key={emoji}
                onClick={() => react.mutate({ id: kudos.id, emoji })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  reacted
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'border-border text-muted-foreground hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {emoji}
                {reactors.length > 0 && <span>{reactors.length}</span>}
              </button>
            );
          })}
          {totalReactions > 0 && (
            <span className="text-xs text-muted-foreground ml-1">{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GiveKudosDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [toId, setToId] = useState('');
  const [category, setCategory] = useState<KudosCategory>('TEAMWORK');
  const [message, setMessage] = useState('');
  const give = useGiveKudos();

  async function handleSubmit() {
    if (!toId.trim() || !message.trim()) return;
    await give.mutateAsync({ toEmployeeId: toId.trim(), category, message: message.trim() });
    setToId('');
    setMessage('');
    setCategory('TEAMWORK');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-rose-500" />
            Give Kudos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Employee ID (UUID)</Label>
            <Input
              placeholder="Paste the employee's ID"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            />
          </div>
          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    category === c.value
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-border text-muted-foreground hover:border-rose-300'
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className="leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="What did they do that deserves recognition?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/500</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!toId.trim() || !message.trim() || give.isPending}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Kudos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
