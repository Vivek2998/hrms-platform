import React from 'react';
import { Cake, UserPlus, Award, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserRole } from '@hrms/shared-types';

interface KpiTile {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  bg: string;
  fg: string;
}

export function KPISummary({
  birthdays,
  newJoinees,
  anniversaries,
  pendingApprovals,
  isApprover,
  loading,
}: {
  birthdays: number;
  newJoinees: number;
  anniversaries: number;
  pendingApprovals: number;
  isApprover: boolean;
  loading: boolean;
  role?: UserRole;
}) {
  const tiles: KpiTile[] = [
    { icon: Cake,     label: 'Birthdays Today', value: birthdays,         bg: 'bg-action-rose-bg',   fg: 'text-action-rose-fg' },
    { icon: UserPlus, label: 'New Joinees',      value: newJoinees,        bg: 'bg-action-blue-bg',   fg: 'text-action-blue-fg' },
    { icon: Award,    label: 'Anniversaries',    value: anniversaries,     bg: 'bg-action-amber-bg',  fg: 'text-action-amber-fg' },
    ...(isApprover
      ? [{ icon: Inbox, label: 'Pending Approvals', value: pendingApprovals, bg: 'bg-action-violet-bg', fg: 'text-action-violet-fg' }]
      : []),
  ];
  return (
    <div className={cn('grid gap-3', isApprover ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
      {tiles.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', t.bg)}>
            <t.icon className={cn('h-4 w-4', t.fg)} />
          </div>
          <div>
            {loading ? (
              <Skeleton className="mb-1 h-5 w-8" />
            ) : (
              <p className="text-lg font-bold tabular-nums leading-none">{t.value}</p>
            )}
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
