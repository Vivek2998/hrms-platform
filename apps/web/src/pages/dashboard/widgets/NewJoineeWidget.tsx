import { UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fmtDate } from '../utils';
import type { NewJoineeEntry } from '@/hooks/useDashboardWidgets';

// P-4: uses Avatar component instead of the duplicate PersonAvatar pattern
export function NewJoineeWidget({ entries, loading }: { entries: NewJoineeEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-3">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
            <UserPlus className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">New Joinees</span>
          <span className="text-[10px] text-muted-foreground/50">· 30 days</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No new joinees</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={e.avatarUrl ?? undefined} alt={`${e.firstName} ${e.lastName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {`${e.firstName[0]}${e.lastName[0]}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.firstName} {e.lastName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {e.designation ? `${e.designation} · ` : ''}Joined {fmtDate(e.dateOfJoining)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
