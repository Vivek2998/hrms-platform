import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users, Clock, CalendarDays, DollarSign, Cake, UserPlus, Award,
  ClipboardList, CalendarCheck, IndianRupee, CalendarPlus, ChevronRight,
  ReceiptText, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaves } from '@/hooks/useLeaves';
import { usePayrollRuns } from '@/hooks/usePayroll';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useGiveKudos } from '@/hooks/useKudos';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { SetupGuide } from '@/components/onboarding/SetupGuide';
import { AutoTour, useProductTour } from '@/components/onboarding/ProductTour';
import { useSetupGuide } from '@/hooks/useSetupGuide';
import type { UserRole } from '@hrms/shared-types';
import type {
  BirthdayEntry,
  NewJoineeEntry,
  AnniversaryEntry,
  MyLeaveEntry,
  MyRegularisationEntry,
  MyCompOffEntry,
} from '@/hooks/useDashboardWidgets';

// ── Helpers ──────────────────────────────────────────────────────

function todayRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
  return { from, to };
}

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

const QUOTES: { text: string; author: string }[] = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'What we think, we become.', author: 'Gautama Buddha' },
  { text: 'The mind is everything. What you think you become.', author: 'Gautama Buddha' },
  { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'Life is what happens when you are busy making other plans.', author: 'Allen Saunders' },
  { text: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.', author: 'Mother Teresa' },
  { text: 'When you reach the end of your rope, tie a knot in it and hang on.', author: 'Franklin D. Roosevelt' },
  { text: 'Always remember that you are absolutely unique. Just like everyone else.', author: 'Margaret Mead' },
  { text: 'Do not go where the path may lead; go instead where there is no path and leave a trail.', author: 'Ralph Waldo Emerson' },
  { text: 'You will face many defeats in life, but never let yourself be defeated.', author: 'Maya Angelou' },
  { text: 'In the end, it is not the years in your life that count. It is the life in your years.', author: 'Abraham Lincoln' },
  { text: 'Never let the fear of striking out keep you from playing the game.', author: 'Babe Ruth' },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
  { text: 'In this life we cannot do great things. We can only do small things with great love.', author: 'Mother Teresa' },
  { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { text: 'Try to be a rainbow in someone else\'s cloud.', author: 'Maya Angelou' },
  { text: 'Do not judge each day by the harvest you reap but by the seeds that you plant.', author: 'Robert Louis Stevenson' },
  { text: 'Spread kindness like confetti.', author: 'Anonymous' },
  { text: 'Yesterday is history, tomorrow is a mystery, today is a gift.', author: 'Eleanor Roosevelt' },
  { text: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'Darkness cannot drive out darkness; only light can do that.', author: 'Martin Luther King Jr.' },
  { text: 'Shoot for the moon. Even if you miss, you\'ll land among the stars.', author: 'Les Brown' },
  { text: 'No one can make you feel inferior without your consent.', author: 'Eleanor Roosevelt' },
  { text: 'I have learned over the years that when one\'s mind is made up, this diminishes fear.', author: 'Rosa Parks' },
  { text: 'I alone cannot change the world, but I can cast a stone across the waters to create many ripples.', author: 'Mother Teresa' },
  { text: 'Nothing is impossible, the word itself says "I\'m possible"!', author: 'Audrey Hepburn' },
  { text: 'The question is not who is going to let me; it\'s who is going to stop me.', author: 'Ayn Rand' },
  { text: 'Every moment is a fresh beginning.', author: 'T.S. Eliot' },
  { text: 'Without courage, wisdom bears no fruit.', author: 'Baltasar Gracian' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'All our dreams can come true, if we have the courage to pursue them.', author: 'Walt Disney' },
  { text: 'First, have a definite, clear practical ideal — a goal, an objective.', author: 'Aristotle' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: 'Limitations live only in our minds. But if we use our imaginations, possibilities are limitless.', author: 'Jamie Paolinetti' },
  { text: 'If you hear a voice within you say "you cannot paint," then by all means paint and that voice will be silenced.', author: 'Vincent Van Gogh' },
  { text: 'There is only one way to avoid criticism: do nothing, say nothing, and be nothing.', author: 'Aristotle' },
  { text: 'Ask and it will be given to you; search and you will find; knock and the door will be opened for you.', author: 'Jesus of Nazareth' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'If you can dream it, you can achieve it.', author: 'Zig Ziglar' },
  { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
  { text: 'I attribute my success to this: I never gave or took any excuse.', author: 'Florence Nightingale' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
  { text: 'I have not failed. I\'ve just found 10,000 ways that won\'t work.', author: 'Thomas Edison' },
  { text: 'The most common way people give up their power is by thinking they don\'t have any.', author: 'Alice Walker' },
  { text: 'The mind is not a vessel to be filled but a fire to be ignited.', author: 'Plutarch' },
  { text: 'You become what you believe.', author: 'Oprah Winfrey' },
  { text: 'The best revenge is massive success.', author: 'Frank Sinatra' },
  { text: 'People who are crazy enough to think they can change the world, are the ones who do.', author: 'Rob Siltanen' },
  { text: 'Failure will never overtake me if my determination to succeed is strong enough.', author: 'Og Mandino' },
  { text: 'Entrepreneurs are great at dealing with uncertainty and also very good at minimizing risk.', author: 'Mohnish Pabrai' },
  { text: 'We may encounter many defeats but we must not be defeated.', author: 'Maya Angelou' },
  { text: 'Knowing is not enough; we must apply. Wishing is not enough; we must do.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Imagine your life is perfect in every respect; what would it look like?', author: 'Brian Tracy' },
  { text: 'We generate fears while we sit. We overcome them by action.', author: 'Dr. Henry Link' },
];

function ThoughtOfTheDay() {
  const now = new Date();
  const idx = (now.getFullYear() * 1000 + (now.getMonth() + 1) * 31 + now.getDate()) % QUOTES.length;
  const quote = QUOTES[idx];
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

// ── Stat Card ────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  accentClass: string;
  iconBg: string;
  iconFg: string;
}

function StatCard({ title, value, subtitle, icon: Icon, loading, accentClass, iconBg, iconFg }: StatCardProps) {
  return (
    <Card className={cn('border-l-4', accentClass)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', iconBg)}>
          <Icon className={cn('h-5 w-5', iconFg)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium">{title}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <>
              <p className="text-lg font-bold leading-tight">{value}</p>
              <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
            </>
          )}
        </div>
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

function BirthdayWidget({ entries, loading }: { entries: BirthdayEntry[]; loading: boolean }) {
  const giveKudos = useGiveKudos();
  const [wished, setWished] = React.useState<Set<string>>(new Set());

  function handleWish(e: BirthdayEntry) {
    if (wished.has(e.id) || giveKudos.isPending) return;
    giveKudos.mutate(
      { toEmployeeId: e.id, category: 'OTHER', message: `Happy Birthday ${e.firstName}! 🎂 Wishing you a wonderful day!`, isPublic: true },
      { onSuccess: () => setWished((prev) => new Set(prev).add(e.id)) },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
          <Cake className="h-4 w-4 text-pink-500" />
        </div>
        <CardTitle className="text-sm font-semibold">Birthdays Today</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No birthdays today</p>
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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={wished.has(e.id) || giveKudos.isPending}
                  className="h-7 shrink-0 border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950 disabled:opacity-60"
                  onClick={() => handleWish(e)}
                >
                  {wished.has(e.id) ? '🎂 Wished!' : 'Wish'}
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
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
          <UserPlus className="h-4 w-4 text-blue-500" />
        </div>
        <CardTitle className="text-sm font-semibold">New Joinees</CardTitle>
        <span className="text-muted-foreground ml-auto text-xs">30 days</span>
      </CardHeader>
      <CardContent className="pt-0">
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
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Award className="h-4 w-4 text-amber-500" />
        </div>
        <CardTitle className="text-sm font-semibold">Work Anniversaries</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);
  const { state: guideState } = useSetupGuide();
  const { start: startTour } = useProductTour();
  const { from, to } = todayRange();

  const { data: empData, isLoading: empLoading } = useEmployees({ limit: 1 });
  const { data: attData, isLoading: attLoading } = useAttendance({ limit: 1, from, to, status: 'PRESENT' });
  const { data: leaveData, isLoading: leaveLoading, isError: leaveError, refetch: refetchLeaves } = useLeaves({ limit: 5, status: 'PENDING' });
  const { data: payrollData, isLoading: payrollLoading } = usePayrollRuns({ limit: 1 });
  const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets();

  const latestRun = payrollData?.data[0];

  return (
    <div className="space-y-4">
      <AutoTour />

      <div id="tour-hero">
        <HeroCard />
      </div>

      <ThoughtOfTheDay />

      <div id="tour-quick-actions">
        <QuickActionsSection role={role} />
      </div>

      {!guideState.dismissed && (
        <div id="tour-setup-guide">
          <SetupGuide onStartTour={startTour} />
        </div>
      )}

      {isHR && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={empData?.meta.total.toString() ?? '—'}
            subtitle="active headcount"
            icon={Users}
            loading={empLoading}
            accentClass="border-l-blue-500"
            iconBg="bg-blue-100 dark:bg-blue-950"
            iconFg="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Present Today"
            value={attData?.meta.total.toString() ?? '—'}
            subtitle="punched in so far"
            icon={Clock}
            loading={attLoading}
            accentClass="border-l-green-500"
            iconBg="bg-green-100 dark:bg-green-950"
            iconFg="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Pending Leaves"
            value={leaveData?.meta.total.toString() ?? '—'}
            subtitle="awaiting approval"
            icon={CalendarDays}
            loading={leaveLoading}
            accentClass="border-l-amber-500"
            iconBg="bg-amber-100 dark:bg-amber-950"
            iconFg="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Last Payroll"
            value={latestRun ? `₹${(latestRun.totalNetPay / 100_000).toFixed(1)}L` : '—'}
            subtitle={latestRun ? `${String(latestRun.month)}/${String(latestRun.year)} · ${latestRun.status}` : 'no runs yet'}
            icon={DollarSign}
            loading={payrollLoading}
            accentClass="border-l-violet-500"
            iconBg="bg-violet-100 dark:bg-violet-950"
            iconFg="text-violet-600 dark:text-violet-400"
          />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                <CalendarDays className="h-4 w-4 text-rose-500" />
              </div>
              <CardTitle className="text-sm font-semibold">Pending Leave Requests</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-2 text-xs"
              onClick={() => void navigate('/leaves')}
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {leaveLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : leaveError ? (
              <ErrorState onRetry={() => void refetchLeaves()} />
            ) : leaveData?.data.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No pending leave requests — all clear!
              </p>
            ) : (
              <div className="divide-y">
                {leaveData?.data.map((leave) => (
                  <div key={leave.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {leave.employee
                          ? `${leave.employee.firstName} ${leave.employee.lastName}`
                          : leave.employeeId}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {leave.leaveType?.name ?? 'Leave'} ·{' '}
                        {new Date(leave.fromDate).toLocaleDateString('en-IN')} –{' '}
                        {new Date(leave.toDate).toLocaleDateString('en-IN')} · {leave.totalDays}d
                      </p>
                    </div>
                    <Badge variant="warning" className="shrink-0">PENDING</Badge>
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
