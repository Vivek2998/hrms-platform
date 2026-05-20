import { useState } from 'react';
import { TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttritionScores, useComputeAttrition } from '@/hooks/useAttrition';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const RISK_META: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: 'Low', className: 'bg-green-100 text-green-700' },
};

function SummaryCard({
  level,
  count,
}: {
  level: string;
  count: number;
}) {
  const meta = RISK_META[level]!;
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-muted-foreground">{meta.label} Risk</p>
          </div>
          <Badge variant="outline" className={`${meta.className} text-xs`}>
            {level}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AttritionPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: scores = [], isLoading } = useAttritionScores();
  const compute = useComputeAttrition();
  const [computing, setComputing] = useState(false);

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

  const counts = {
    CRITICAL: scores.filter((s: any) => s.riskLevel === 'CRITICAL').length,
    HIGH: scores.filter((s: any) => s.riskLevel === 'HIGH').length,
    MEDIUM: scores.filter((s: any) => s.riskLevel === 'MEDIUM').length,
    LOW: scores.filter((s: any) => s.riskLevel === 'LOW').length,
  };

  async function handleRecompute() {
    setComputing(true);
    try {
      await compute.mutateAsync();
    } finally {
      setComputing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Attrition Prediction</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered employee flight risk analysis
            </p>
          </div>
        </div>
        <Button
          onClick={handleRecompute}
          disabled={computing || compute.isPending}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${computing ? 'animate-spin' : ''}`} />
          Recompute
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
          <SummaryCard key={level} level={level} count={counts[level]} />
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading || computing ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="py-20 text-center">
            <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No data available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Recompute" to generate attrition scores.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Key Factors</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Computed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scores.map((row: any) => {
                  const meta = RISK_META[row.riskLevel] ?? RISK_META['LOW'];
                  return (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {row.employee?.firstName} {row.employee?.lastName}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {row.employee?.designation ?? row.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 max-w-[80px]">
                            <div
                              className={`h-2 rounded-full ${
                                row.riskScore >= 75
                                  ? 'bg-red-500'
                                  : row.riskScore >= 50
                                  ? 'bg-orange-500'
                                  : row.riskScore >= 25
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(row.riskScore, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-xs">{row.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[240px]">
                        {Array.isArray(row.factors)
                          ? row.factors.join(', ')
                          : row.factors ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.computedAt
                          ? format(new Date(row.computedAt), 'dd MMM yyyy')
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
