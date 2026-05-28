import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, TrendingDown, Lock, AlertTriangle } from 'lucide-react';
import { ChartSkeleton } from '@/components/ui/skeleton-patterns';
import { useCountUp } from '@/hooks/useCountUp';
import { useAuthStore } from '@/stores/auth.store';
import {
  useAnalyticsOverview,
  useHeadcountTrend,
  useDepartmentBreakdown,
  useAttendanceSummary,
  useLeaveUtilization,
  usePayrollTrend,
} from '@/hooks/useAnalytics';

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: '#22c55e',
  ABSENT: '#ef4444',
  LATE: '#f59e0b',
  HALF_DAY: '#a78bfa',
  WFH: '#3b82f6',
  ON_LEAVE: '#fb923c',
  HOLIDAY: '#6366f1',
  WEEKEND: '#d1d5db',
  PENDING: '#94a3b8',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const STAGGER = ['animate-stagger-1', 'animate-stagger-2', 'animate-stagger-3', 'animate-stagger-4'];

function StatCard({ label, target, suffix = '', icon: Icon, color, bg, isLoading, index }: {
  label: string; target: number | undefined; suffix?: string;
  icon: React.ElementType; color: string; bg: string; isLoading: boolean; index: number;
}) {
  const count = useCountUp(isLoading ? undefined : target);
  return (
    <Card className={STAGGER[index]}>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          {isLoading
            ? <div className="bg-muted h-6 w-12 animate-pulse rounded mt-1" />
            : <p className="text-xl font-bold">{target !== undefined ? `${count}${suffix}` : '—'}</p>
          }
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewCards() {
  const { data, isLoading } = useAnalyticsOverview();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Employees" target={data?.totalActive} icon={Users} color="text-blue-600" bg="bg-blue-50" isLoading={isLoading} index={0} />
      <StatCard label="New This Month" target={data?.newThisMonth} icon={UserPlus} color="text-green-600" bg="bg-green-50" isLoading={isLoading} index={1} />
      <StatCard label="Exited This Month" target={data?.termThisMonth} icon={UserMinus} color="text-red-600" bg="bg-red-50" isLoading={isLoading} index={2} />
      <StatCard label="Attrition Rate" target={data?.attritionRate} suffix="%" icon={TrendingDown} color="text-orange-600" bg="bg-orange-50" isLoading={isLoading} index={3} />
    </div>
  );
}

function HeadcountTrendChart() {
  const { data, isLoading } = useHeadcountTrend();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Headcount Trend (12 months)</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'Employees']} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function DepartmentChart() {
  const { data, isLoading } = useDepartmentBreakdown();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Employees by Department</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <ChartSkeleton /> : !data?.length ? (
          <p className="text-muted-foreground text-sm text-center py-8">No department data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function AttendanceChart() {
  const { data, isLoading } = useAttendanceSummary();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Attendance Summary (Last 30 Days)</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <ChartSkeleton /> : !data?.length ? (
          <p className="text-muted-foreground text-sm text-center py-8">No attendance data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={ATTENDANCE_COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveUtilizationChart() {
  const { data, isLoading } = useLeaveUtilization();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Leave Utilization (This Year)</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <ChartSkeleton /> : !data?.length ? (
          <p className="text-muted-foreground text-sm text-center py-8">No leave data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="allocated" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Allocated" />
              <Bar dataKey="used" fill="#6366f1" radius={[4, 4, 0, 0]} name="Used" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function PayrollTrendChart() {
  const { data, isLoading } = usePayrollTrend();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Payroll Cost Trend</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <ChartSkeleton /> : !data?.length ? (
          <p className="text-muted-foreground text-sm text-center py-8">No payroll data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => [`₹${fmt(v)}`, name]} />
              <Legend />
              <Area type="monotone" dataKey="gross" stroke="#a78bfa" fill="#ede9fe" strokeWidth={2} name="Gross" />
              <Area type="monotone" dataKey="netPay" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} name="Net Pay" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');
  // Analytics endpoints require GROWTH plan or higher (plan-guard on backend)
  const hasPlan = ['GROWTH', 'ENTERPRISE'].includes(user?.orgPlan ?? '');

  // Guard 1 — role: non-HR users must not trigger HR-only API calls
  if (!isHR) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Analytics is available to HR and administrators only.
        </p>
      </div>
    );
  }

  // Guard 2 — plan: backend returns 402 for FREE/STARTER; stop queries before they fire
  if (!hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">GROWTH Plan Required</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Workforce Analytics is available on the GROWTH plan and above.
          Please upgrade your subscription to unlock this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workforce Analytics</h1>
        <p className="text-muted-foreground">Insights across headcount, attendance, leaves, and payroll</p>
      </div>

      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeadcountTrendChart />
        <DepartmentChart />
        <AttendanceChart />
        <LeaveUtilizationChart />
      </div>

      <PayrollTrendChart />
    </div>
  );
}
