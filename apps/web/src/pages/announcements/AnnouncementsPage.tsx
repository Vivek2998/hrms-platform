import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff, Trash2, Plus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from '@/hooks/useAnnouncements';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

function NewAnnouncementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateAnnouncement();
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, expiresAt: '' });

  function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) return;
    createMutation.mutate(
      {
        title:     form.title.trim(),
        content:   form.content.trim(),
        isPinned:  form.isPinned,
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt + 'T23:59:59.000Z').toISOString() } : {}),
      },
      {
        onSuccess: () => {
          setForm({ title: '', content: '', isPinned: false, expiresAt: '' });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Announcement title…"
              value={form.title}
              onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); }}
            />
          </div>
          <div className="space-y-1">
            <Label>Content <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Write your announcement here…"
              rows={5}
              value={form.content}
              onChange={(e) => { setForm((f) => ({ ...f, content: e.target.value })); }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Expires On <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                type="date"
                value={form.expiresAt}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setForm((f) => ({ ...f, expiresAt: e.target.value })); }}
              />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex cursor-pointer items-center gap-2">
                <div
                  role="checkbox"
                  aria-checked={form.isPinned}
                  onClick={() => { setForm((f) => ({ ...f, isPinned: !f.isPinned })); }}
                  className={cn(
                    'relative h-5 w-9 rounded-full transition-colors',
                    form.isPinned ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                      form.isPinned ? 'left-4' : 'left-0.5',
                    )}
                  />
                </div>
                <span className="text-sm">Pin to top</span>
              </label>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            This announcement will be sent as a notification to all active employees.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !form.title.trim() || !form.content.trim()}
          >
            {createMutation.isPending ? 'Posting…' : 'Post Announcement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementCard({
  announcement,
  isHR,
}: {
  announcement: Announcement;
  isHR: boolean;
}) {
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function togglePin() {
    updateMutation.mutate({ id: announcement.id, input: { isPinned: !announcement.isPinned } });
  }

  return (
    <>
      <Card className={cn('transition-shadow', announcement.isPinned && 'border-primary/40 shadow-sm')}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              announcement.isPinned ? 'bg-primary/10' : 'bg-muted',
            )}>
              <Megaphone className={cn('h-4 w-4', announcement.isPinned ? 'text-primary' : 'text-muted-foreground')} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {announcement.isPinned && (
                  <Pin className="text-primary h-3 w-3 shrink-0" />
                )}
                <p className="truncate font-semibold">{announcement.title}</p>
              </div>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">{announcement.content}</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                </p>
                {announcement.expiresAt && (
                  <p className="text-muted-foreground text-xs">
                    Expires {new Date(announcement.expiresAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {isHR && (
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={updateMutation.isPending}
                  onClick={togglePin}
                  title={announcement.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  {announcement.isPinned
                    ? <PinOff className="h-4 w-4" />
                    : <Pin className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-8 w-8"
                  onClick={() => { setConfirmDelete(true); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{announcement.title}&rdquo; will be removed for all employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => { deleteMutation.mutate(announcement.id, { onSuccess: () => { setConfirmDelete(false); } }); }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AnnouncementsPage() {
  const [showNew, setShowNew] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const isHR = role != null && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);

  const { data: announcements = [], isLoading } = useAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            {isHR ? 'Post and manage company-wide announcements' : 'Company news and updates'}
          </p>
        </div>
        {isHR && (
          <Button onClick={() => { setShowNew(true); }}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          illustration="announcements"
          title="No announcements yet"
          description={isHR ? 'Keep your team informed by posting the first announcement.' : 'No company announcements at this time.'}
          action={isHR ? { label: 'Post First Announcement', onClick: () => { setShowNew(true); } } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} isHR={isHR} />
          ))}
        </div>
      )}

      <NewAnnouncementDialog open={showNew} onClose={() => { setShowNew(false); }} />
    </div>
  );
}
