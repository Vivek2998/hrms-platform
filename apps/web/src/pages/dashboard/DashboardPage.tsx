import { Users, Clock, CalendarDays, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaves } from '@/hooks/useLeaves';
import { usePayrollRuns } from '@/hooks/usePayroll';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function todayRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();
  return { from, to };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { from, to } = todayRange();

  const { data: empData, isLoading: empLoading } = useEmployees({ limit: 1 });
  const { data: attData, isLoading: attLoading } = useAttendance({
    limit: 1,
    from,
    to,
    status: 'PRESENT',
  });
  const { data: leaveData, isLoading: leaveLoading } = useLeaves({
    limit: 5,
    status: 'PENDING',
  });
  const { data: payrollData, isLoading: payrollLoading } = usePayrollRuns({ limit: 1 });

  const latestRun = payrollData?.data[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good morning, {user?.firstName ?? 'there'}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at your organisation today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={empData?.meta.total.toString() ?? '—'}
          subtitle="active headcount"
          icon={Users}
          loading={empLoading}
        />
        <StatCard
          title="Present Today"
          value={attData?.meta.total.toString() ?? '—'}
          subtitle="punched in so far"
          icon={Clock}
          loading={attLoading}
        />
        <StatCard
          title="Pending Leaves"
          value={leaveData?.meta.total.toString() ?? '—'}
          subtitle="awaiting approval"
          icon={CalendarDays}
          loading={leaveLoading}
        />
        <StatCard
          title="Last Payroll"
          value={latestRun ? `₹${(latestRun.totalNetPay / 100_000).toFixed(1)}L` : '—'}
          subtitle={
            latestRun
              ? `${String(latestRun.month)}/${String(latestRun.year)} · ${latestRun.status}`
              : 'no runs yet'
          }
          icon={DollarSign}
          loading={payrollLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : leaveData?.data.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No pending leave requests — all clear!
            </p>
          ) : (
            <div className="divide-y">
              {leaveData?.data.map((leave) => (
                <div key={leave.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {leave.employee
                        ? `${leave.employee.firstName} ${leave.employee.lastName}`
                        : leave.employeeId}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {leave.leaveType?.name ?? 'Leave'} ·{' '}
                      {new Date(leave.fromDate).toLocaleDateString('en-IN')} –{' '}
                      {new Date(leave.toDate).toLocaleDateString('en-IN')} · {leave.totalDays} day
                      {leave.totalDays !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="warning">PENDING</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
