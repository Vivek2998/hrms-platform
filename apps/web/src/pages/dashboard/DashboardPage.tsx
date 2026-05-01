import { Users, Clock, CalendarDays, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";

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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Good morning, {user?.firstName ?? "there"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening at your organisation today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="—"
          subtitle="Loading..."
          icon={Users}
          loading
        />
        <StatCard
          title="Present Today"
          value="—"
          subtitle="Loading..."
          icon={Clock}
          loading
        />
        <StatCard
          title="On Leave"
          value="—"
          subtitle="Loading..."
          icon={CalendarDays}
          loading
        />
        <StatCard
          title="Payroll (This Month)"
          value="—"
          subtitle="Loading..."
          icon={DollarSign}
          loading
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dashboard data will appear here once the API is connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
