import { Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AnniversaryEntry } from '@/hooks/useDashboardWidgets';

// P-4: uses Avatar component instead of the duplicate PersonAvatar pattern
export function AnniversaryWidget({ entries, loading }: { entries: AnniversaryEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-3">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
            <Award className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Work Anniversaries</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No anniversaries today</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={e.avatarUrl ?? undefined} alt={`${e.firstName} ${e.lastName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {`${e.firstName[0]}${e.lastName[0]}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.firstName} {e.lastName}</p>
                    {e.designation && <p className="text-muted-foreground truncate text-xs">{e.designation}</p>}
                  </div>
                </div>
                <Badge variant="warning" className="shrink-0">
                  {e.years} yr{e.years !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
