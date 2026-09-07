import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtDate, statusVariant } from '../utils';
import type {
  MyLeaveEntry,
  MyRegularisationEntry,
  MyCompOffEntry,
} from '@/hooks/useDashboardWidgets';

export function MyRequestsWidget({
  leaves, regularisations, compOffs, loading,
}: {
  leaves: MyLeaveEntry[];
  regularisations: MyRegularisationEntry[];
  compOffs: MyCompOffEntry[];
  loading: boolean;
}) {
  const total = leaves.length + regularisations.length + compOffs.length;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
          <ClipboardList className="h-4 w-4 text-violet-500" />
        </div>
        <CardTitle className="text-sm font-semibold">My Requests</CardTitle>
        {!loading && total > 0 && (
          <Badge variant="warning" className="ml-auto">{total} pending</Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : total === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No pending requests — you&apos;re all clear!</p>
        ) : (
          <div className="divide-y">
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{l.leaveType.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {fmtDate(l.fromDate)} – {fmtDate(l.toDate)} · {l.totalDays}d
                  </p>
                </div>
                <Badge variant={statusVariant(l.status)} className="ml-2 shrink-0">{l.status}</Badge>
              </div>
            ))}
            {regularisations.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Regularisation</p>
                  <p className="text-muted-foreground text-xs">{fmtDate(r.date)}</p>
                </div>
                <Badge variant={statusVariant(r.status)} className="ml-2 shrink-0">{r.status}</Badge>
              </div>
            ))}
            {compOffs.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Comp Off</p>
                  <p className="text-muted-foreground text-xs">Worked {fmtDate(c.workedDate)}</p>
                </div>
                <Badge variant={statusVariant(c.status)} className="ml-2 shrink-0">{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
