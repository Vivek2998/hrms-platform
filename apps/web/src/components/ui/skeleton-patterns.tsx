import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

const CHART_BARS = [40, 65, 52, 80, 45, 72, 58, 88, 43, 70, 55, 76];

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {CHART_BARS.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between px-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 w-8" />
        ))}
      </div>
    </div>
  );
}

export function DialogContentSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-9', i % 3 === 1 ? 'w-5/6' : i % 3 === 2 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}
