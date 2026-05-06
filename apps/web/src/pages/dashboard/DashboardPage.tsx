import { Users, Clock, CalendarDays, DollarSign, Cake, UserPlus, Award, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaves } from '@/hooks/useLeaves';
import { usePayrollRuns } from '@/hooks/usePayroll';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import type {
  BirthdayEntry,
  NewJoineeEntry,
  AnniversaryEntry,
  MyLeaveEntry,
  MyRegularisationEntry,
  MyCompOffEntry,
} from '@/hooks/useDashboardWidgets';
import { toast } from 'sonner';

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
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
  return { from, to };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Avatar({ name, url }: { name: string; url?: string | null | undefined }) {
  if (url) {
    return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
      {initials}
    </div>
  );
}

function BirthdayWidget({ entries, loading }: { entries: BirthdayEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Cake className="text-pink-500 h-5 w-5" />
        <CardTitle className="text-base">Birthdays Today</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No birthdays today.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={`${e.firstName} ${e.lastName}`} url={e.avatarUrl} />
                  <div>
                    <p className="text-sm font-medium">{e.firstName} {e.lastName}</p>
                    {e.designation && <p className="text-muted-foreground text-xs">{e.designation}</p>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 border-pink-300 text-pink-600 hover:bg-pink-50"
                  onClick={() => { toast.success(`🎂 Wishes sent to ${e.firstName}!`); }}
                >
                  Send Wishes
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewJoineeWidget({ entries, loading }: { entries: NewJoineeEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <UserPlus className="text-blue-500 h-5 w-5" />
        <CardTitle className="text-base">New Joinees</CardTitle>
        <span className="text-muted-foreground ml-auto text-xs">Last 30 days</span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No new joinees this month.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <Avatar name={`${e.firstName} ${e.lastName}`} url={e.avatarUrl} />
                <div>
                  <p className="text-sm font-medium">{e.firstName} {e.lastName}</p>
                  <p className="text-muted-foreground text-xs">
                    {e.designation ? `${e.designation} · ` : ''}
                    Joined {fmtDate(e.dateOfJoining)}
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

function AnniversaryWidget({ entries, loading }: { entries: AnniversaryEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Award className="text-amber-500 h-5 w-5" />
        <CardTitle className="text-base">Work Anniversaries</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No anniversaries today.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={`${e.firstName} ${e.lastName}`} url={e.avatarUrl} />
                  <div>
                    <p className="text-sm font-medium">{e.firstName} {e.lastName}</p>
                    {e.designation && <p className="text-muted-foreground text-xs">{e.designation}</p>}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
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

function statusVariant(status: string): 'default' | 'secondary' | 'warning' | 'destructive' | 'success' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'PENDING') return 'warning';
  return 'secondary';
}

function MyPendingRequestsWidget({
  leaves,
  regularisations,
  compOffs,
  loading,
}: {
  leaves: MyLeaveEntry[];
  regularisations: MyRegularisationEntry[];
  compOffs: MyCompOffEntry[];
  loading: boolean;
}) {
  const total = leaves.length + regularisations.length + compOffs.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <ClipboardList className="text-violet-500 h-5 w-5" />
        <CardTitle className="text-base">My Requests</CardTitle>
        {!loading && total > 0 && (
          <Badge variant="warning" className="ml-auto">{total} pending</Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : total === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No pending requests — all clear!
          </p>
        ) : (
          <div className="divide-y">
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{l.leaveType.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {fmtDate(l.fromDate)} – {fmtDate(l.toDate)} · {l.totalDays} day{l.totalDays !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
              </div>
            ))}
            {regularisations.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">Regularisation</p>
                  <p className="text-muted-foreground text-xs">{fmtDate(r.date)}</p>
                </div>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </div>
            ))}
            {compOffs.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">Comp Off</p>
                  <p className="text-muted-foreground text-xs">Worked {fmtDate(c.workedDate)}</p>
                </div>
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);
  const { from, to } = todayRange();

  const { data: empData, isLoading: empLoading } = useEmployees({ limit: 1 });
  const { data: attData, isLoading: attLoading } = useAttendance({ limit: 1, from, to, status: 'PRESENT' });
  const { data: leaveData, isLoading: leaveLoading } = useLeaves({ limit: 5, status: 'PENDING' });
  const { data: payrollData, isLoading: payrollLoading } = usePayrollRuns({ limit: 1 });
  const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets();

  const latestRun = payrollData?.data[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting()}, {user?.firstName ?? 'there'}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at your organisation today.
        </p>
      </div>

      {/* Stat cards — HR/Admin only */}
      {isHR && (
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
      )}

      {/* Celebration widgets — all roles */}
      <div className="grid gap-4 md:grid-cols-3">
        <BirthdayWidget entries={widgets?.birthdays ?? []} loading={widgetsLoading} />
        <NewJoineeWidget entries={widgets?.newJoinees ?? []} loading={widgetsLoading} />
        <AnniversaryWidget entries={widgets?.workAnniversaries ?? []} loading={widgetsLoading} />
      </div>

      {/* My Requests — employee/manager self-view */}
      {widgets?.myPendingRequests && (
        <MyPendingRequestsWidget
          leaves={widgets.myPendingRequests.leaves}
          regularisations={widgets.myPendingRequests.regularisations}
          compOffs={widgets.myPendingRequests.compOffs}
          loading={widgetsLoading}
        />
      )}

      {/* Pending Leave Requests — HR management view */}
      {isHR && (
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
      )}
    </div>
  );
}
