import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users, Clock, CalendarDays, Cake, UserPlus, Award,
  ClipboardList, CalendarCheck, IndianRupee, CalendarPlus, ChevronRight,
  ReceiptText, Building2, Inbox, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useApprovalInbox } from '@/hooks/useApprovalInbox';
import { useGiveKudos } from '@/hooks/useKudos';
import { ErrorState } from '@/components/ui/error-state';
import { getDailyQuote } from '@/data/quotes';
import type { QuoteCategory } from '@/data/quotes';
import { cn } from '@/lib/utils';
import { SetupGuide } from '@/components/onboarding/SetupGuide';
import { AutoTour, useProductTour } from '@/components/onboarding/ProductTour';
import { useSetupGuide } from '@/hooks/useSetupGuide';
import type { UserRole } from '@hrms/shared-types';
import type { ApprovalInboxItem } from '@hrms/shared-types';
import type {
  BirthdayEntry,
  NewJoineeEntry,
  AnniversaryEntry,
  MyLeaveEntry,
  MyRegularisationEntry,
  MyCompOffEntry,
} from '@/hooks/useDashboardWidgets';

// ── Helpers ──────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function statusVariant(status: string): 'default' | 'secondary' | 'warning' | 'destructive' | 'success' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'PENDING') return 'warning';
  return 'secondary';
}

// ── Thought of the Day ───────────────────────────────────────────

function ThoughtOfTheDay({ category }: { category?: string }) {
  const quote = getDailyQuote((category ?? 'default') as QuoteCategory);
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3 text-center">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
        Thought of the Day
      </p>
      <p className="text-foreground mt-1 text-sm italic">&ldquo;{quote.text}&rdquo;</p>
      <p className="text-muted-foreground mt-1 text-[11px] font-medium">— {quote.author}</p>
    </div>
  );
}

// ── Hero Section ─────────────────────────────────────────────────

function HeroCard() {
  const user = useAuthStore((s) => s.user);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="from-primary to-primary/80 relative overflow-hidden rounded-xl bg-gradient-to-br p-5 shadow-md">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 right-16 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-primary-foreground/70 text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
          <h1 className="text-primary-foreground mt-0.5 text-xl font-bold">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-primary-foreground/70 mt-0.5 truncate text-sm">{user?.orgName}</p>
        </div>
        <Avatar className="h-14 w-14 shrink-0 border-2 border-white/30 shadow-md">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

// ── Quick Actions ────────────────────────────────────────────────

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
      { icon: Users, label: 'Employees', to: '/employees', bg: 'bg-blue-100 dark:bg-blue-950', fg: 'text-blue-600 dark:text-blue-400' },
      { icon: CalendarDays, label: 'Approvals', to: '/leaves', bg: 'bg-amber-100 dark:bg-amber-950', fg: 'text-amber-600 dark:text-amber-400' },
      { icon: ReceiptText, label: 'Payroll', to: '/payroll', bg: 'bg-green-100 dark:bg-green-950', fg: 'text-green-600 dark:text-green-400' },
      { icon: Building2, label: 'Departments', to: '/departments', bg: 'bg-violet-100 dark:bg-violet-950', fg: 'text-violet-600 dark:text-violet-400' },
    ];
  }
  if (role === 'MANAGER') {
    return [
      { icon: CalendarCheck, label: 'Apply Leave', to: '/my-leaves', bg: 'bg-blue-100 dark:bg-blue-950', fg: 'text-blue-600 dark:text-blue-400' },
      { icon: CalendarDays, label: 'Approvals', to: '/leaves', bg: 'bg-amber-100 dark:bg-amber-950', fg: 'text-amber-600 dark:text-amber-400' },
      { icon: Clock, label: 'Attendance', to: '/attendance', bg: 'bg-green-100 dark:bg-green-950', fg: 'text-green-600 dark:text-green-400' },
      { icon: IndianRupee, label: 'Payslips', to: '/my-payslips', bg: 'bg-violet-100 dark:bg-violet-950', fg: 'text-violet-600 dark:text-violet-400' },
    ];
  }
  return [
    { icon: CalendarCheck, label: 'Apply Leave', to: '/my-leaves', bg: 'bg-blue-100 dark:bg-blue-950', fg: 'text-blue-600 dark:text-blue-400' },
    { icon: Clock, label: 'Attendance', to: '/attendance', bg: 'bg-green-100 dark:bg-green-950', fg: 'text-green-600 dark:text-green-400' },
    { icon: IndianRupee, label: 'Payslips', to: '/my-payslips', bg: 'bg-amber-100 dark:bg-amber-950', fg: 'text-amber-600 dark:text-amber-400' },
    { icon: CalendarPlus, label: 'Comp Off', to: '/comp-off', bg: 'bg-violet-100 dark:bg-violet-950', fg: 'text-violet-600 dark:text-violet-400' },
  ];
}

function QuickActionsSection({ role }: { role: UserRole | undefined }) {
  const navigate = useNavigate();
  const actions = getQuickActions(role);
  return (
    <div>
      <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
        Quick Actions
      </p>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((a) => (
          <button
            key={a.to}
            onClick={() => void navigate(a.to)}
            className="bg-card hover:bg-accent flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors active:scale-95"
          >
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-full', a.bg)}>
              <a.icon className={cn('h-5 w-5', a.fg)} />
            </div>
            <span className="text-center text-[11px] font-medium leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Pending Request type labels ───────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string }> = {
  LEAVE:          { label: 'Leave',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  EXPENSE:        { label: 'Expense',        color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  REGULARISATION: { label: 'Regularisation', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  COMP_OFF:       { label: 'Comp Off',       color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
  HELPDESK:       { label: 'Helpdesk',       color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' },
};

// ── Pending Requests Widget ───────────────────────────────────────

function PendingRequestsWidget({
  items, loading, error, onRetry,
}: {
  items: ApprovalInboxItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const displayItems = items.slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
            <Inbox className="h-4 w-4 text-rose-500" />
          </div>
          <CardTitle className="text-sm font-semibold">Pending Requests</CardTitle>
          {!loading && items.length > 0 && (
            <Badge variant="warning" className="ml-1">{items.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-2 text-xs"
          onClick={() => void navigate('/approval-inbox')}
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No pending requests — all clear!
          </p>
        ) : (
          <div className="divide-y">
            {displayItems.map((item) => {
              const meta = TYPE_META[item.type] ?? { label: item.type, color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.color)}>
                        {meta.label}
                      </span>
                      <p className="truncate text-sm font-medium">{item.employeeName}</p>
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {item.title}{item.subtitle ? ` · ${item.subtitle}` : ''}
                    </p>
                  </div>
                  <Badge variant="warning" className="shrink-0">PENDING</Badge>
                </div>
              );
            })}
            {items.length > 8 && (
              <p className="pt-3 text-center text-xs text-muted-foreground">
                +{items.length - 8} more —{' '}
                <button className="text-primary hover:underline" onClick={() => void navigate('/approval-inbox')}>
                  view all
                </button>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Person Avatar ────────────────────────────────────────────────

function PersonAvatar({ name, url }: { name: string; url?: string | null | undefined }) {
  if (url) return <img src={url} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
      {initials}
    </div>
  );
}

// ── Celebration Widgets ──────────────────────────────────────────

// Fixed sparkle positions — deterministic, no layout thrash
const BDAY_SPARKLES = [
  { top: '10%', left: '6%',  size: 10, delay: '0s'    },
  { top: '16%', left: '89%', size: 8,  delay: '0.65s' },
  { top: '48%', left: '3%',  size: 7,  delay: '1.1s'  },
  { top: '52%', left: '92%', size: 9,  delay: '0.35s' },
  { top: '76%', left: '17%', size: 7,  delay: '1.45s' },
  { top: '70%', left: '79%', size: 6,  delay: '0.85s' },
  { top: '32%', left: '48%', size: 5,  delay: '0.5s'  },
];

function BirthdayWidget({ entries, loading }: { entries: BirthdayEntry[]; loading: boolean }) {
  const giveKudos = useGiveKudos();
  const [wished, setWished] = React.useState<Set<string>>(new Set());
  const [current, setCurrent] = React.useState(0);
  const [direction, setDirection] = React.useState<'left' | 'right'>('left');
  const dragStartX = React.useRef<number | null>(null);

  function navigate(next: number) {
    if (next === current) return;
    setDirection(next > current ? 'left' : 'right');
    setCurrent(next);
  }

  function onTouchStart(ev: React.TouchEvent) { dragStartX.current = ev.touches[0].clientX; }
  function onTouchEnd(ev: React.TouchEvent) {
    if (dragStartX.current === null) return;
    const dx = ev.changedTouches[0].clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) navigate(Math.min(current + 1, entries.length - 1));
    else        navigate(Math.max(current - 1, 0));
  }
  function onMouseDown(ev: React.MouseEvent) { dragStartX.current = ev.clientX; }
  function onMouseUp(ev: React.MouseEvent) {
    if (dragStartX.current === null) return;
    const dx = ev.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) navigate(Math.min(current + 1, entries.length - 1));
    else        navigate(Math.max(current - 1, 0));
  }

  const entry = entries[current];

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 shadow-lg shadow-pink-500/25">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-orange-300/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-4 right-1/3 h-16 w-16 rounded-full bg-yellow-200/10 blur-xl" />

      {/* Animated sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BDAY_SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute select-none text-white"
            style={{
              top: s.top, left: s.left,
              fontSize: `${s.size}px`,
              animation: 'bday-twinkle 2.4s ease-in-out infinite',
              animationDelay: s.delay,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <CardContent className="relative pt-3">
        {/* Centered label — quiet, doesn't compete with content */}
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <Cake className="h-3 w-3 text-white/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Birthdays Today</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2.5 py-2">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-white/20" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24 bg-white/20" />
              <Skeleton className="h-3 w-16 bg-white/20" />
            </div>
            <Skeleton className="h-7 w-16 shrink-0 rounded-md bg-white/20" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/70">No birthdays today 🎂</p>
        ) : (
          <div
            className="select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
          >
            <div
              key={current}
              className="flex items-center gap-2.5 py-1"
              style={{
                animation: `${direction === 'left' ? 'bday-slide-from-right' : 'bday-slide-from-left'} 260ms ease-out both`,
              }}
            >
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={`${entry.firstName} ${entry.lastName}`}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-2 ring-white/30">
                  {`${entry.firstName[0]}${entry.lastName[0]}`.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{entry.firstName} {entry.lastName}</p>
                {entry.designation && (
                  <p className="truncate text-xs text-white/70">{entry.designation}</p>
                )}
              </div>
              <button
                disabled={wished.has(entry.id) || giveKudos.isPending}
                onClick={() => {
                  if (wished.has(entry.id) || giveKudos.isPending) return;
                  giveKudos.mutate(
                    { toEmployeeId: entry.id, category: 'OTHER', message: `Happy Birthday ${entry.firstName}! 🎂 Wishing you a wonderful day!`, isPublic: true },
                    { onSuccess: () => setWished((prev) => new Set(prev).add(entry.id)) },
                  );
                }}
                className={cn(
                  'h-7 shrink-0 rounded-md border px-3 text-xs font-medium transition-all',
                  wished.has(entry.id)
                    ? 'cursor-default border-white/30 bg-white/20 text-white/80'
                    : 'border-white/50 bg-white/15 text-white hover:bg-white/30 hover:border-white/70',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {wished.has(entry.id) ? '🎂 Wished!' : 'Wish 🎂'}
              </button>
            </div>
            {entries.length > 1 && (
              <div className="flex justify-center gap-1.5 pt-2">
                {entries.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/35',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewJoineeWidget({ entries, loading }: { entries: NewJoineeEntry[]; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-3">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <UserPlus className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">New Joinees</span>
          <span className="text-[9px] text-muted-foreground/40">· 30 days</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No new joinees</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5">
                <PersonAvatar name={`${e.firstName} ${e.lastName}`} url={e.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.firstName} {e.lastName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {e.designation ? `${e.designation} · ` : ''}Joined {fmtDate(e.dateOfJoining)}
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
      <CardContent className="pt-3">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <Award className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Work Anniversaries</span>
        </div>
        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No anniversaries today</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={`${e.firstName} ${e.lastName}`} url={e.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.firstName} {e.lastName}</p>
                    {e.designation && <p className="text-muted-foreground truncate text-xs">{e.designation}</p>}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
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

// ── My Requests Widget ───────────────────────────────────────────

function MyRequestsWidget({
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

// ── Main Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);
  const { state: guideState } = useSetupGuide();
  const { start: startTour } = useProductTour();

  const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets();
  const {
    data: inboxItems = [],
    isLoading: inboxLoading,
    isError: inboxError,
    refetch: refetchInbox,
  } = useApprovalInbox();

  return (
    <div className="space-y-4">
      <AutoTour />

      <div id="tour-hero">
        <HeroCard />
      </div>

      <ThoughtOfTheDay category={widgets?.quoteCategory} />

      <div id="tour-quick-actions">
        <QuickActionsSection role={role} />
      </div>

      {!guideState.dismissed && (
        <div id="tour-setup-guide">
          <SetupGuide onStartTour={startTour} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <BirthdayWidget entries={widgets?.birthdays ?? []} loading={widgetsLoading} />
        <NewJoineeWidget entries={widgets?.newJoinees ?? []} loading={widgetsLoading} />
        <AnniversaryWidget entries={widgets?.workAnniversaries ?? []} loading={widgetsLoading} />
      </div>

      {widgets?.myPendingRequests && (
        <MyRequestsWidget
          leaves={widgets.myPendingRequests.leaves}
          regularisations={widgets.myPendingRequests.regularisations}
          compOffs={widgets.myPendingRequests.compOffs}
          loading={widgetsLoading}
        />
      )}

      {isHR && (
        <PendingRequestsWidget
          items={inboxItems}
          loading={inboxLoading}
          error={inboxError}
          onRetry={() => void refetchInbox()}
        />
      )}
    </div>
  );
}
