import { Link } from 'react-router-dom';
import {
  Users, Clock, CalendarDays, IndianRupee, CalendarCheck, ReceiptText,
  Building2, CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@hrms/shared-types';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  bg: string;
  fg: string;
}

function getQuickActions(role: UserRole | undefined): QuickAction[] {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'HR';
  if (isAdmin) {
    return [
      { icon: Users,       label: 'Employees',  to: '/employees',    bg: 'bg-action-blue-bg',   fg: 'text-action-blue-fg' },
      { icon: CalendarDays,label: 'Approvals',  to: '/leaves',       bg: 'bg-action-amber-bg',  fg: 'text-action-amber-fg' },
      { icon: ReceiptText, label: 'Payroll',    to: '/payroll',      bg: 'bg-action-green-bg',  fg: 'text-action-green-fg' },
      { icon: Building2,   label: 'Departments',to: '/departments',  bg: 'bg-action-violet-bg', fg: 'text-action-violet-fg' },
    ];
  }
  if (role === 'MANAGER') {
    return [
      { icon: CalendarCheck, label: 'Apply Leave', to: '/my-leaves',    bg: 'bg-action-blue-bg',   fg: 'text-action-blue-fg' },
      { icon: CalendarDays,  label: 'Approvals',   to: '/leaves',       bg: 'bg-action-amber-bg',  fg: 'text-action-amber-fg' },
      { icon: Clock,         label: 'Attendance',  to: '/attendance',   bg: 'bg-action-green-bg',  fg: 'text-action-green-fg' },
      { icon: IndianRupee,   label: 'Payslips',    to: '/my-payslips',  bg: 'bg-action-violet-bg', fg: 'text-action-violet-fg' },
    ];
  }
  return [
    { icon: CalendarCheck, label: 'Apply Leave', to: '/my-leaves',   bg: 'bg-action-blue-bg',   fg: 'text-action-blue-fg' },
    { icon: Clock,         label: 'Attendance',  to: '/attendance',  bg: 'bg-action-green-bg',  fg: 'text-action-green-fg' },
    { icon: IndianRupee,   label: 'Payslips',    to: '/my-payslips', bg: 'bg-action-amber-bg',  fg: 'text-action-amber-fg' },
    { icon: CalendarPlus,  label: 'Comp Off',    to: '/comp-off',    bg: 'bg-action-violet-bg', fg: 'text-action-violet-fg' },
  ];
}

// P-7: use <Link> instead of <button onClick={navigate}> — enables middle-click and right-click context menu
export function QuickActionsSection({ role }: { role: UserRole | undefined }) {
  const actions = getQuickActions(role);
  return (
    <div>
      <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
        Quick Actions
      </p>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="bg-card hover:bg-accent flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors active:scale-95"
          >
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-full', a.bg)}>
              <a.icon className={cn('h-5 w-5', a.fg)} />
            </div>
            <span className="text-center text-[11px] font-medium leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
