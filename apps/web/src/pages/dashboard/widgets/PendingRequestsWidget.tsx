import { useNavigate } from 'react-router-dom';
import { Inbox, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { TYPE_META } from '../utils';
import type { ApprovalInboxItem } from '@hrms/shared-types';

export function PendingRequestsWidget({
  items, loading, error, onRetry,
}: {
  items: ApprovalInboxItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const displayItems = items.slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
            <Inbox className="h-4 w-4 text-rose-500" />
          </div>
          <CardTitle className="text-sm font-semibold">Pending Requests</CardTitle>
          {!loading && items.length > 0 && (
            <Badge variant="warning" className="ml-1">{items.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-2 text-xs"
          onClick={() => void navigate('/approval-inbox')}
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No pending requests — all clear!
          </p>
        ) : (
          <div className="divide-y">
            {displayItems.map((item) => {
              const meta = TYPE_META[item.type] ?? { label: item.type, color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.color)}>
                        {meta.label}
                      </span>
                      <p className="truncate text-sm font-medium">{item.employeeName}</p>
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {item.title}{item.subtitle ? ` · ${item.subtitle}` : ''}
                    </p>
                  </div>
                  <Badge variant="warning" className="shrink-0">PENDING</Badge>
                </div>
              );
            })}
            {items.length > 8 && (
              <p className="pt-3 text-center text-xs text-muted-foreground">
                +{items.length - 8} more —{' '}
                <button className="text-primary hover:underline" onClick={() => void navigate('/approval-inbox')}>
                  view all
                </button>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
