import { Shield, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useComplianceCalendar } from '@/hooks/useCompliance';
import { format, isPast, isToday } from 'date-fns';

const TYPE_META: Record<string, { label: string; color: string }> = {
  PF: { label: 'PF', color: 'bg-blue-100 text-blue-700' },
  ESI: { label: 'ESI', color: 'bg-purple-100 text-purple-700' },
  PT: { label: 'PT', color: 'bg-orange-100 text-orange-700' },
  TDS: { label: 'TDS', color: 'bg-red-100 text-red-700' },
  QUARTERLY: { label: 'Quarterly', color: 'bg-teal-100 text-teal-700' },
};

export default function CompliancePage() {
  const { data, isLoading } = useComplianceCalendar();

  const grouped = data
    ? (data as any[]).reduce<Record<string, any[]>>((acc, item) => {
        const month = format(new Date(item.dueDate), 'MMMM yyyy');
        if (!acc[month]) acc[month] = [];
        acc[month].push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          Compliance Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Statutory filing deadlines — PF, ESI, PT, TDS</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : !data?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">No deadlines found</h3>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {month}
              </h2>
              <div className="space-y-2">
                {items.map((item: any, idx: number) => {
                  const due = new Date(item.dueDate);
                  const overdue = isPast(due) && !isToday(due);
                  const today = isToday(due);
                  const meta: { label: string; color: string } = TYPE_META[item.type] ?? { label: item.type as string, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <Card key={idx} className={`border shadow-sm ${overdue ? 'border-red-200' : today ? 'border-amber-300' : ''}`}>
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {overdue ? (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(due, 'dd MMM yyyy')}
                              {overdue && <span className="text-red-500 ml-2 font-medium">Overdue</span>}
                              {today && <span className="text-amber-600 ml-2 font-medium">Due Today</span>}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${meta.color} shrink-0`}>
                          {meta.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
