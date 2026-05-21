import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  LayoutDashboard, Users, Clock, Building2, Timer,
  Settings, Palmtree, CalendarCheck, ClockAlert, CalendarPlus, FileText,
  ReceiptText, BookUser, Network, Lightbulb, Headphones, BookOpen,
  IndianRupee, BarChart2, Target, UserMinus, Briefcase, TrendingUp, Megaphone,
  MapPin, Wallet, Inbox, Heart, FileSignature, Package, Plane, CreditCard,
  DoorOpen, Home, ArrowLeftRight, Users2, Calculator, ShieldAlert, Shield,
  Crown, Coins, AlertTriangle, Fingerprint, GraduationCap, Scale, ClipboardCheck,
  FileSearch, HardHat, LineChart, HeartHandshake, Sun, Moon, Monitor, LogOut,
  ClipboardList, ListChecks, Map,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command';

// ── Nav item definition ──────────────────────────────────────────────────────

type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

interface PaletteItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  keywords?: string;
  allow?: UserRole[];
}

const NAV_ITEMS: PaletteItem[] = [
  // Core
  { group: 'Core HR', label: 'Dashboard',         to: '/dashboard',         icon: LayoutDashboard },
  { group: 'Core HR', label: 'Employees',          to: '/employees',         icon: Users,          allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },
  { group: 'Core HR', label: 'Attendance',         to: '/attendance',        icon: Clock },
  { group: 'Core HR', label: 'Departments',        to: '/departments',       icon: Building2,      allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Core HR', label: 'Shifts',             to: '/shifts',            icon: Timer,          allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Core HR', label: 'Office Locations',   to: '/office-locations',  icon: MapPin,         allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Core HR', label: 'Biometric Devices',  to: '/biometric-devices', icon: Fingerprint,    allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Core HR', label: 'Approval Inbox',     to: '/approval-inbox',    icon: Inbox,          allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },

  // Leaves
  { group: 'Leaves', label: 'Leave Management',  to: '/leaves',         icon: ListChecks,   allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },
  { group: 'Leaves', label: 'My Leaves',         to: '/my-leaves',      icon: CalendarCheck },
  { group: 'Leaves', label: 'Holiday Calendar',  to: '/holidays',       icon: Palmtree },
  { group: 'Leaves', label: 'Regularisation',    to: '/regularisation', icon: ClockAlert },
  { group: 'Leaves', label: 'Comp Off',          to: '/comp-off',       icon: CalendarPlus },

  // Payroll & Finance
  { group: 'Payroll & Finance', label: 'Payroll Runs',      to: '/payroll',           icon: ReceiptText,   allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Payroll & Finance', label: 'Salary Structure',  to: '/salary-structure',  icon: BarChart2,     allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Payroll & Finance', label: 'My Payslips',       to: '/my-payslips',       icon: IndianRupee },
  { group: 'Payroll & Finance', label: 'My Letters',        to: '/my-letters',        icon: FileText },
  { group: 'Payroll & Finance', label: 'Tax Declaration',   to: '/tax-declaration',   icon: FileText },
  { group: 'Payroll & Finance', label: 'Expense Claims',    to: '/expenses',          icon: Wallet },
  { group: 'Payroll & Finance', label: 'Travel Requests',   to: '/travel',            icon: Plane },
  { group: 'Payroll & Finance', label: 'Loans & Advances',  to: '/loans',             icon: CreditCard },
  { group: 'Payroll & Finance', label: 'Salary Revision',   to: '/salary-revision',   icon: TrendingUp,    allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Payroll & Finance', label: 'Timesheets',        to: '/timesheets',        icon: Clock },
  { group: 'Payroll & Finance', label: 'Benefits',          to: '/benefits',          icon: Heart },
  { group: 'Payroll & Finance', label: 'Earned Wage Access',to: '/ewa',               icon: Coins },
  { group: 'Payroll & Finance', label: 'FnF Settlement',    to: '/fnf',               icon: Calculator },
  { group: 'Payroll & Finance', label: 'ESOP / Equity',     to: '/esop',              icon: LineChart },

  // Self-Service
  { group: 'Self-Service', label: 'Work From Home',    to: '/wfh',        icon: Home },
  { group: 'Self-Service', label: 'Shift Swap',        to: '/shift-swap', icon: ArrowLeftRight },
  { group: 'Self-Service', label: 'Referrals',         to: '/referrals',  icon: Users2 },
  { group: 'Self-Service', label: 'E-Signatures',      to: '/esignatures',icon: FileSignature },
  { group: 'Self-Service', label: 'Asset Management',  to: '/assets',     icon: Package },
  { group: 'Self-Service', label: 'Meeting Rooms',     to: '/rooms',      icon: DoorOpen },

  // Company
  { group: 'Company', label: 'Announcements',      to: '/announcements', icon: Megaphone },
  { group: 'Company', label: 'Recognition Wall',   to: '/kudos',         icon: Heart },
  { group: 'Company', label: 'Employee Directory', to: '/directory',     icon: BookUser },
  { group: 'Company', label: 'Organisation Chart', to: '/org-chart',     icon: Network },

  // People & Performance
  { group: 'People & Performance', label: 'Performance',         to: '/performance',   icon: Target },
  { group: 'People & Performance', label: 'Learning Hub',        to: '/lms',           icon: BookOpen },
  { group: 'People & Performance', label: 'Onboarding',          to: '/onboarding',    icon: ClipboardList },
  { group: 'People & Performance', label: 'Offboarding',         to: '/offboarding',   icon: UserMinus,     allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Pulse Surveys',       to: '/pulse-surveys', icon: BarChart2 },
  { group: 'People & Performance', label: 'PIP',                 to: '/pip',           icon: Target,        allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },
  { group: 'People & Performance', label: 'Nine-Box Grid',       to: '/nine-box',      icon: BarChart2,     allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Career Paths',        to: '/career',        icon: Map },
  { group: 'People & Performance', label: 'Succession Planning', to: '/succession',    icon: Crown,         allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Headcount Planning',  to: '/headcount',     icon: Users,         allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Attrition Prediction',to: '/attrition',     icon: AlertTriangle, allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Pay Equity',          to: '/pay-equity',    icon: Scale,         allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'People & Performance', label: 'Mental Health / EAP', to: '/eap',           icon: HeartHandshake },

  // Recruitment
  { group: 'Recruitment', label: 'Job Postings',          to: '/recruitment',          icon: Briefcase,      allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Recruitment', label: 'Hiring Drives',         to: '/hiring-drives',        icon: GraduationCap,  allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Recruitment', label: 'Interview Scorecards',  to: '/interview-scorecards', icon: ClipboardCheck, allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },
  { group: 'Recruitment', label: 'Resume Parser',         to: '/resume-parse',         icon: FileSearch,     allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },

  // Analytics & Support
  { group: 'Analytics & Reports', label: 'Analytics',           to: '/analytics', icon: TrendingUp,  allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Analytics & Reports', label: 'Reports',             to: '/reports',   icon: FileText,    allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Support & Compliance', label: 'Help Desk',          to: '/helpdesk',    icon: Headphones },
  { group: 'Support & Compliance', label: 'Suggestion Box',     to: '/suggestions', icon: Lightbulb },
  { group: 'Support & Compliance', label: 'HR Policies',        to: '/hr-policies', icon: BookOpen },
  { group: 'Support & Compliance', label: 'Compliance Calendar',to: '/compliance',  icon: Shield, allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },
  { group: 'Support & Compliance', label: 'POSH Cases',         to: '/posh',        icon: ShieldAlert },
  { group: 'Support & Compliance', label: 'Contractors',        to: '/contractors', icon: HardHat, allow: ['SUPER_ADMIN','ORG_ADMIN','HR'] },

  // Settings
  { group: 'Account', label: 'My Profile / Settings', to: '/settings', icon: Settings },
];

const QUICK_ITEMS: PaletteItem[] = [
  { group: 'Quick', label: 'Dashboard',       to: '/dashboard',       icon: LayoutDashboard },
  { group: 'Quick', label: 'My Leaves',       to: '/my-leaves',       icon: CalendarCheck },
  { group: 'Quick', label: 'Attendance',      to: '/attendance',      icon: Clock },
  { group: 'Quick', label: 'My Payslips',     to: '/my-payslips',     icon: IndianRupee },
  { group: 'Quick', label: 'Approval Inbox',  to: '/approval-inbox',  icon: Inbox, allow: ['SUPER_ADMIN','ORG_ADMIN','HR','MANAGER'] },
  { group: 'Quick', label: 'Announcements',   to: '/announcements',   icon: Megaphone },
];

// ── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useUiStore();
  const { logout, user } = useAuthStore();
  const role = user?.role as UserRole | undefined;

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle]);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  function canSee(item: PaletteItem) {
    return !item.allow || (role != null && item.allow.includes(role));
  }

  const visibleNav = NAV_ITEMS.filter(canSee);
  const visibleQuick = QUICK_ITEMS.filter(canSee);

  const groups = [...new Set(visibleNav.map((i) => i.group))];

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2',
            'bg-background border shadow-2xl rounded-xl overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[14%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[14%]',
            'duration-150',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>

          <Command>
            <CommandInput placeholder="Search pages, actions…" autoFocus />

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {/* Quick Actions — shown when no query typed */}
              <CommandGroup heading="Quick Access">
                {visibleQuick.map((item) => (
                  <CommandItem
                    key={item.to}
                    value={item.label}
                    onSelect={() => run(() => navigate(item.to))}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* All nav pages grouped */}
              {groups.map((group) => {
                const items = visibleNav.filter((i) => i.group === group);
                return (
                  <CommandGroup key={group} heading={group}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.to}
                        value={`${item.label} ${item.group}`}
                        onSelect={() => run(() => navigate(item.to))}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{item.label}</span>
                        <CommandShortcut className="text-[11px] opacity-50">{item.group}</CommandShortcut>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}

              <CommandSeparator />

              {/* System actions */}
              <CommandGroup heading="Actions">
                <CommandItem
                  value={`theme toggle ${nextTheme}`}
                  onSelect={() => run(() => setTheme(nextTheme))}
                >
                  <ThemeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Switch to {nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} mode</span>
                </CommandItem>
                <CommandItem
                  value="settings profile"
                  onSelect={() => run(() => navigate('/settings'))}
                >
                  <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>My Profile & Settings</span>
                </CommandItem>
                <CommandItem
                  value="logout sign out"
                  onSelect={() => run(() => { logout(); navigate('/login'); })}
                  className="text-destructive aria-selected:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log out</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>

            {/* Footer hint */}
            <div className="border-t px-3 py-2 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span><kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
              <span><kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> select</span>
              <span><kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">esc</kbd> close</span>
              <span className="ml-auto"><kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> to open</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
