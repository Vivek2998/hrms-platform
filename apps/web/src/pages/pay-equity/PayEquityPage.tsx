import { Scale, RefreshCw, AlertTriangle, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayEquityLatest, usePayEquityHistory, useGeneratePayEquity } from '@/hooks/usePayEquity';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function fmtINR(amount: number) {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

export default function PayEquityPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: latest, isLoading: latestLoading, isError } = usePayEquityLatest();
  const { data: history = [], isLoading: historyLoading } = usePayEquityHistory();
  const generate = useGeneratePayEquity();

  if (!isHR) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-32">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This page is available to HR and administrators only.
        </p>
      </div>
    );
  }

  const isEmpty = isError || !latest;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <Scale className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Pay Equity Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Gender pay gap and compensation equity insights
            </p>
          </div>
        </div>
        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          variant={isEmpty ? 'default' : 'outline'}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generate.isPending ? 'animate-spin' : ''}`} />
          {isEmpty ? 'Generate First Report' : 'Generate New Report'}
        </Button>
      </div>

      {latestLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-lg border border-dashed bg-muted/20">
          <BarChart2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No pay equity data yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Generate your first pay equity report to see insights.
          </p>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? 'Generating…' : 'Generate Report'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="sm:col-span-1">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-4xl font-bold text-violet-600">
                  {latest.genderGapPct != null
                    ? `${latest.genderGapPct > 0 ? '+' : ''}${latest.genderGapPct.toFixed(1)}%`
                    : '—'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Gender Pay Gap</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Positive = men paid more on average
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average CTC by Gender</CardTitle>
              </CardHeader>
              <CardContent>
                {latest.byGender?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={latest.byGender} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gender" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(v: number) => fmtINR(v)} />
                      <Bar dataKey="avgCTC" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No gender breakdown available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* By Department */}
          {latest.byDepartment?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average CTC by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="pb-2 text-left font-medium text-muted-foreground">Department</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Avg CTC</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Headcount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {latest.byDepartment.map((row: any) => (
                        <tr key={row.department} className="hover:bg-muted/20">
                          <td className="py-2">{row.department}</td>
                          <td className="py-2 text-right font-semibold">{fmtINR(row.avgCTC)}</td>
                          <td className="py-2 text-right text-muted-foreground">{row.count ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* By Designation */}
          {latest.byDesignation?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average CTC by Designation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="pb-2 text-left font-medium text-muted-foreground">Designation</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Avg CTC</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Headcount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {latest.byDesignation.map((row: any) => (
                        <tr key={row.designation} className="hover:bg-muted/20">
                          <td className="py-2">{row.designation}</td>
                          <td className="py-2 text-right font-semibold">{fmtINR(row.avgCTC)}</td>
                          <td className="py-2 text-right text-muted-foreground">{row.count ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {!historyLoading && history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Report History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((snap: any) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between py-1.5 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(snap.createdAt), 'dd MMM yyyy, HH:mm')}
                      </span>
                      <span className="text-sm font-medium">
                        Gap:{' '}
                        {snap.genderGapPct != null
                          ? `${snap.genderGapPct > 0 ? '+' : ''}${snap.genderGapPct.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
