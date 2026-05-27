import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  Building2,
  Timer,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Palmtree,
  CalendarCheck,
  ClockAlert,
  CalendarPlus,
  FileText,
  ListChecks,
  ReceiptText,
  BookUser,
  Network,
  Globe,
  Lightbulb,
  Headphones,
  BookOpen,
  LifeBuoy,
  IndianRupee,
  BarChart2,
  ClipboardList,
  Target,
  UserMinus,
  Briefcase,
  TrendingUp,
  Megaphone,
  Lock,
  MapPin,
  Wallet,
  Inbox,
  Heart,
  FileSignature,
  Package,
  Plane,
  CreditCard,
  DoorOpen,
  Home,
  ArrowLeftRight,
  Users2,
  Calculator,
  ShieldAlert,
  Shield,
  Bot,
  Crown,
  Gift,
  Map,
  Coins,
  AlertTriangle,
  Fingerprint,
  GraduationCap,
  Scale,
  ClipboardCheck,
  FileSearch,
  HardHat,
  LineChart,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole, OrgPlan } from '@hrms/shared-types';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { canAccess, requiredPlan, PLAN_LABELS } from '@/lib/feature-flags';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type IconType = React.ComponentType<{ className?: string }>;

interface NavItem {
  label: string;
  to: string;
  icon: IconType;
  allow?: UserRole[];
  feature?: string;
}

interface NavGroup {
  key: string;
  label: string;
  icon: IconType;
  to?: string;        // optional: makes the group header itself a navigable link
  children: NavItem[];
}

type SidebarEntry = ({ group: false } & NavItem) | ({ group: true } & NavGroup);

const ENTRIES: SidebarEntry[] = [
  { group: false, label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { group: false, label: 'Employees', to: '/employees', icon: Users, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] },
  { group: false, label: 'Attendance', to: '/attendance', icon: Clock },
  {
    group: true,
    key: 'leaves',
    label: 'Leaves',
    icon: CalendarDays,
    children: [
      { label: 'Leave Management', to: '/leaves', icon: ListChecks, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] },
      { label: 'Holiday Calendar', to: '/holidays', icon: Palmtree },
      { label: 'My Leaves', to: '/my-leaves', icon: CalendarCheck },
      { label: 'Regularisation', to: '/regularisation', icon: ClockAlert, feature: 'regularisation' },
      { label: 'Comp Off', to: '/comp-off', icon: CalendarPlus, feature: 'comp-off' },
    ],
  },
  {
    group: true,
    key: 'payroll',
    label: 'Payroll',
    icon: DollarSign,
    children: [
      { label: 'Payroll Runs', to: '/payroll', icon: ReceiptText, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'payroll' },
      { label: 'Salary Structure', to: '/salary-structure', icon: BarChart2, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'My Payslips', to: '/my-payslips', icon: IndianRupee, feature: 'my-payslips' },
      { label: 'My Letters', to: '/my-letters', icon: FileText },
      { label: 'Tax Declaration', to: '/tax-declaration', icon: FileText, feature: 'tax-declaration' },
      { label: 'Expense Claims', to: '/expenses', icon: Wallet, feature: 'expenses' },
      { label: 'E-Signatures', to: '/esignatures', icon: FileSignature },
      { label: 'Asset Management', to: '/assets', icon: Package, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Travel Requests', to: '/travel', icon: Plane },
      { label: 'Loans & Advances', to: '/loans', icon: CreditCard },
      { label: 'Meeting Rooms', to: '/rooms', icon: DoorOpen },
      { label: 'Work From Home', to: '/wfh', icon: Home },
      { label: 'Shift Swap', to: '/shift-swap', icon: ArrowLeftRight },
      { label: 'Referrals', to: '/referrals', icon: Users2 },
      { label: 'FnF Settlement', to: '/fnf', icon: Calculator },
      { label: 'Salary Revision', to: '/salary-revision', icon: TrendingUp, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Timesheets', to: '/timesheets', icon: Clock },
      { label: 'Benefits', to: '/benefits', icon: Gift },
    ],
  },
  {
    group: true,
    key: 'company',
    label: 'Company',
    icon: Globe,
    children: [
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
      { label: 'Recognition Wall', to: '/kudos', icon: Heart },
      { label: 'Employee Directory', to: '/directory', icon: BookUser },
      { label: 'Organisation Chart', to: '/org-chart', icon: Network },
    ],
  },
  {
    group: true,
    key: 'performance',
    label: 'Performance',
    icon: Target,
    to: '/performance',   // group header IS the performance overview page
    children: [
      { label: 'KPI / KRA', to: '/kpi-kra', icon: Target },
      { label: 'PIP', to: '/pip', icon: TrendingUp, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] },
      { label: 'Nine-Box Grid', to: '/nine-box', icon: BarChart2, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
    ],
  },
  {
    group: true,
    key: 'people',
    label: 'People',
    icon: Users,
    children: [
      { label: 'Onboarding', to: '/onboarding', icon: ClipboardList, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], feature: 'onboarding' },
      { label: 'Learning Hub', to: '/lms', icon: BookOpen },
      { label: 'Offboarding', to: '/offboarding', icon: UserMinus, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'offboarding' },
      { label: 'Pulse Surveys', to: '/pulse-surveys', icon: BarChart2, feature: 'pulse-surveys' },
      { label: 'Career Paths', to: '/career', icon: Map },
      { label: 'Succession Planning', to: '/succession', icon: Crown, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Skills Matrix', to: '/skills-matrix', icon: Layers },
      { label: 'Headcount Planning', to: '/headcount', icon: Users, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Attrition Prediction', to: '/attrition', icon: AlertTriangle, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Pay Equity', to: '/pay-equity', icon: Scale, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'ESOP / Equity', to: '/esop', icon: LineChart, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'EMPLOYEE'] },
    ],
  },
  { group: false, label: 'Earned Wage Access', to: '/ewa', icon: Coins },
  { group: false, label: 'Biometric Devices', to: '/biometric-devices', icon: Fingerprint, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
  {
    group: true,
    key: 'recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    children: [
      { label: 'Job Postings', to: '/recruitment', icon: Briefcase, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'recruitment' },
      { label: 'Hiring Drives', to: '/hiring-drives', icon: GraduationCap, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'Interview Scorecards', to: '/interview-scorecards', icon: ClipboardCheck, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] },
      { label: 'Resume Parser', to: '/resume-parse', icon: FileSearch, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
    ],
  },
  { group: false, label: 'Contractors', to: '/contractors', icon: HardHat, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
  { group: false, label: 'Mental Health / EAP', to: '/eap', icon: HeartHandshake },
  { group: false, label: 'Analytics', to: '/analytics', icon: TrendingUp, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'analytics' },
  { group: false, label: 'Reports', to: '/reports', icon: FileText, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
  { group: false, label: 'Departments', to: '/departments', icon: Building2, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'departments' },
  { group: false, label: 'Shifts', to: '/shifts', icon: Timer, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'shifts' },
  { group: false, label: 'Office Locations', to: '/office-locations', icon: MapPin, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
  { group: false, label: 'Approval Inbox', to: '/approval-inbox', icon: Inbox, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] },
  {
    group: true,
    key: 'support',
    label: 'Support',
    icon: LifeBuoy,
    children: [
      { label: 'Help Desk', to: '/helpdesk', icon: Headphones, feature: 'helpdesk' },
      { label: 'Suggestion Box', to: '/suggestions', icon: Lightbulb, feature: 'suggestions' },
      { label: 'HR Policies', to: '/hr-policies', icon: BookOpen, feature: 'hr-policies' },
      { label: 'Compliance Calendar', to: '/compliance', icon: Shield, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] },
      { label: 'POSH Cases', to: '/posh', icon: ShieldAlert },
    ],
  },
  { group: false, label: 'Settings', to: '/settings', icon: Settings },
];

function isVisible(item: NavItem, role: UserRole | undefined): boolean {
  return !item.allow || (role != null && item.allow.includes(role));
}

function isLocked(item: NavItem, orgPlan: OrgPlan | undefined): boolean {
  if (!item.feature || !orgPlan) return false;
  return !canAccess(orgPlan, item.feature);
}

// ── Expanded mode item classes ──
function expandedItemClass(isActive: boolean, indent: boolean = false) {
  return cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    indent && 'ml-4',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  );
}

// ── Collapsed mode: fixed 36×36 square, mx-auto in li ──
function collapsedIconClass(isActive: boolean) {
  return cn(
    'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  );
}

function flyoutItemClass(isActive: boolean) {
  return cn(
    'flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-accent font-semibold text-accent-foreground'
      : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
  );
}

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const orgName = useAuthStore((s) => s.user?.orgName);
  const orgPlan = useAuthStore((s) => s.user?.orgPlan);
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [flyoutGroup, setFlyoutGroup] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(sidebarOpen);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    setFlyoutGroup(null);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) setFlyoutGroup(null);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarVisible(true);
    } else {
      setOpenGroups(new Set());
      const t = setTimeout(() => setSidebarVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [sidebarOpen]);

  // Auto-open the group whose child matches the current path; close all when no group matches
  useEffect(() => {
    if (!sidebarOpen) return;
    for (const entry of ENTRIES) {
      if (!entry.group) continue;
      const hasActive = entry.children.some(
        (c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'),
      );
      // Also open when on the group's own page (for groups that have a `to`)
      const parentActive =
        entry.to && (location.pathname === entry.to || location.pathname.startsWith(entry.to + '/'));
      if (hasActive || parentActive) {
        setOpenGroups(new Set([entry.key]));
        return;
      }
    }
    // Navigated to a flat route — close all accordions so the flat item can show active
    setOpenGroups(new Set());
  }, [location.pathname, sidebarOpen]);

  function handleGroupClick(key: string, visible: NavItem[]) {
    const isCurrentlyOpen = openGroups.has(key);
    setOpenGroups(isCurrentlyOpen ? new Set() : new Set([key]));
    if (!isCurrentlyOpen) {
      const firstChild = visible.find((c) => !isLocked(c, orgPlan));
      if (firstChild) navigate(firstChild.to);
    }
  }

  // True when an open accordion's children don't include the current URL.
  // Used to suppress the flat-item active highlight in that case.
  const hasOpenGroupWithoutActiveChild = [...openGroups].some((key) => {
    const group = ENTRIES.find((e) => e.group && (e as NavGroup).key === key) as ({ group: true } & NavGroup) | undefined;
    if (!group) return false;
    const visibleChildren = group.children.filter((c) => isVisible(c, role));
    return !visibleChildren.some(
      (c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'),
    );
  });

  return (
    <TooltipProvider delayDuration={400}>
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          id="tour-sidebar"
          className={cn(
            'bg-sidebar fixed left-0 top-0 z-40 flex h-full flex-col border-r overflow-hidden transition-[width,transform] duration-200',
            sidebarOpen ? 'w-64' : 'w-16',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          {/* ── Header: logo + brand + collapse toggle ── */}
          <div className={cn('flex h-16 shrink-0 items-center border-b', sidebarVisible ? 'px-4' : 'justify-center')}>
            {sidebarVisible ? (
              <>
                <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
                  <div className="bg-primary h-8 w-8 shrink-0 rounded-lg" />
                  <span className="text-sidebar-foreground truncate text-sm font-semibold">
                    {orgName ?? 'WorkAxis'}
                  </span>
                </div>
                {/* Desktop-only collapse button in header */}
                <button
                  onClick={toggleSidebar}
                  className="ml-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              /* In collapsed state the expand button IS the header */
              <button
                onClick={toggleSidebar}
                className="hidden h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── Navigation ── */}
          <nav className={cn('flex-1 overflow-y-auto py-3', sidebarVisible ? '[scrollbar-gutter:stable]' : 'overflow-x-hidden')}>
            {/* Expanded: px-2 gutters. Collapsed: fixed-height slots, centered */}
            <ul className={cn(sidebarVisible ? 'space-y-0.5 px-2' : 'space-y-px')}>
              {ENTRIES.map((entry) => {
                // ── Group entries ──
                if (entry.group) {
                  const visible = entry.children.filter((c) => isVisible(c, role));
                  if (visible.length === 0) return null;

                  // Collapsed → Popover flyout
                  if (!sidebarVisible) {
                    const isChildActive = visible.some((c) =>
                      location.pathname === c.to || location.pathname.startsWith(c.to + '/'),
                    );
                    return (
                      <li key={entry.key} className="flex h-10 items-center justify-center">
                        <Popover
                          open={flyoutGroup === entry.key}
                          onOpenChange={(open) => setFlyoutGroup(open ? entry.key : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className={collapsedIconClass(flyoutGroup === entry.key)}
                              aria-label={entry.label}
                            >
                              <entry.icon className="h-5 w-5 shrink-0" />
                              {isChildActive && flyoutGroup !== entry.key && (
                                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary/50 blur-[2px]" />
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="right" align="start" sideOffset={10} className="w-52 p-0">
                            <div className="border-b px-3 py-2.5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {entry.label}
                              </p>
                            </div>
                            <div className="py-1">
                              {/* Parent overview link for groups that have their own page */}
                              {entry.to && (
                                <>
                                  <NavLink
                                    to={entry.to}
                                    end
                                    className={({ isActive }) => flyoutItemClass(isActive)}
                                    onClick={() => setFlyoutGroup(null)}
                                  >
                                    <entry.icon className="h-4 w-4 shrink-0" />
                                    <span>Overview</span>
                                  </NavLink>
                                  {visible.length > 0 && <div className="my-1 border-t" />}
                                </>
                              )}
                              {visible.map((child) => {
                                const locked = isLocked(child, orgPlan);
                                if (locked) {
                                  return (
                                    <button
                                      key={child.to}
                                      onClick={() => {
                                        const plan = child.feature ? requiredPlan(child.feature) : null;
                                        if (plan) toast.info(`${child.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                                      }}
                                      className={cn(flyoutItemClass(false), 'cursor-pointer opacity-50')}
                                    >
                                      <child.icon className="h-4 w-4 shrink-0" />
                                      <span className="flex-1 text-left">{child.label}</span>
                                      <Lock className="h-3 w-3 shrink-0" />
                                    </button>
                                  );
                                }
                                return (
                                  <NavLink
                                    key={child.to}
                                    to={child.to}
                                    className={({ isActive }) => flyoutItemClass(isActive)}
                                    onClick={() => setFlyoutGroup(null)}
                                  >
                                    <child.icon className="h-4 w-4 shrink-0" />
                                    <span>{child.label}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </li>
                    );
                  }

                  // Expanded → inline accordion
                  const isOpen = openGroups.has(entry.key);
                  const isChildActive = visible.some(
                    (c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'),
                  );

                  // ── Groups with their own navigable page (e.g. Performance) ──
                  // Use a plain <button> — identical DOM structure to standard groups.
                  // No nesting, no wrapper: the ChevronDown is a direct flex child at px-3 right,
                  // exactly matching Leaves/Payroll/Company/People in every pixel.
                  // Click when NOT on the page → navigate (useEffect auto-opens the accordion).
                  // Click when already on the page → toggle accordion only.
                  if (entry.to) {
                    const parentTo = entry.to;
                    const isParentActive =
                      location.pathname === parentTo || location.pathname.startsWith(parentTo + '/');
                    return (
                      <li key={entry.key}>
                        <button
                          onClick={() => {
                            if (!isParentActive) {
                              navigate(parentTo);
                              // useEffect will auto-open the group once location changes
                            } else {
                              // Already on this page — just toggle the accordion
                              setOpenGroups(isOpen ? new Set() : new Set([entry.key]));
                            }
                          }}
                          className={cn(
                            'group/nav flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isParentActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <entry.icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-left">{entry.label}</span>
                          {isChildActive && !isOpen && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary/50 blur-[2px]" />
                          )}
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 transition-all duration-200',
                              isOpen
                                ? 'rotate-180 opacity-100'
                                : 'opacity-40 group-hover/nav:opacity-100',
                            )}
                          />
                        </button>
                        <div className={cn('grid overflow-hidden transition-[grid-template-rows] duration-200', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                          <ul className="min-h-0 mt-0.5 space-y-0.5">
                            {visible.map((child) => {
                              const locked = isLocked(child, orgPlan);
                              if (locked) {
                                return (
                                  <li key={child.to}>
                                    <button
                                      onClick={() => {
                                        const plan = child.feature ? requiredPlan(child.feature) : null;
                                        if (plan) toast.info(`${child.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                                      }}
                                      className={cn(expandedItemClass(false, true), 'w-full cursor-pointer opacity-50')}
                                    >
                                      <child.icon className="h-4 w-4 shrink-0" />
                                      <span className="flex-1 text-left">{child.label}</span>
                                      <Lock className="h-3 w-3 shrink-0" />
                                    </button>
                                  </li>
                                );
                              }
                              return (
                                <li key={child.to}>
                                  <NavLink
                                    to={child.to}
                                    className={({ isActive }) => expandedItemClass(isActive, true)}
                                  >
                                    <child.icon className="h-4 w-4 shrink-0" />
                                    <span>{child.label}</span>
                                  </NavLink>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </li>
                    );
                  }

                  // ── Standard groups (header-only toggle, navigates to first child on open) ──
                  return (
                    <li key={entry.key}>
                      <button
                        onClick={() => handleGroupClick(entry.key, visible)}
                        className="group/nav flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <entry.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-left">{entry.label}</span>
                        {isChildActive && !isOpen && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary/50 blur-[2px]" />
                        )}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 transition-all duration-200',
                            isOpen
                              ? 'rotate-180 opacity-100'
                              : 'opacity-40 group-hover/nav:opacity-100',
                          )}
                        />
                      </button>
                      <div className={cn('grid overflow-hidden transition-[grid-template-rows] duration-200', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                        <ul className="min-h-0 mt-0.5 space-y-0.5">
                          {visible.map((child) => {
                            const locked = isLocked(child, orgPlan);
                            if (locked) {
                              return (
                                <li key={child.to}>
                                  <button
                                    onClick={() => {
                                      const plan = child.feature ? requiredPlan(child.feature) : null;
                                      if (plan) toast.info(`${child.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                                    }}
                                    className={cn(expandedItemClass(false, true), 'w-full cursor-pointer opacity-50')}
                                  >
                                    <child.icon className="h-4 w-4 shrink-0" />
                                    <span className="flex-1 text-left">{child.label}</span>
                                    <Lock className="h-3 w-3 shrink-0" />
                                  </button>
                                </li>
                              );
                            }
                            return (
                              <li key={child.to}>
                                <NavLink
                                  to={child.to}
                                  className={({ isActive }) => expandedItemClass(isActive, true)}
                                >
                                  <child.icon className="h-4 w-4 shrink-0" />
                                  <span>{child.label}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                }

                // ── Flat entries ──
                if (!isVisible(entry, role)) return null;
                const locked = isLocked(entry, orgPlan);

                // Collapsed → centered square icon + tooltip
                if (!sidebarVisible) {
                  return (
                    <li key={entry.to} className="flex h-10 items-center justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {locked ? (
                            <button
                              onClick={() => {
                                const plan = entry.feature ? requiredPlan(entry.feature) : null;
                                if (plan) toast.info(`${entry.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                              }}
                              className={cn(collapsedIconClass(false), 'opacity-50')}
                              aria-label={entry.label}
                            >
                              <entry.icon className="h-5 w-5 shrink-0" />
                            </button>
                          ) : (
                            <NavLink
                              to={entry.to}
                              className={({ isActive }) => collapsedIconClass(isActive && !hasOpenGroupWithoutActiveChild)}
                              aria-label={entry.label}
                            >
                              <entry.icon className="h-5 w-5 shrink-0" />
                            </NavLink>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {entry.label}
                          {locked && ' — upgrade required'}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                }

                // Expanded
                return (
                  <li key={entry.to}>
                    {locked ? (
                      <button
                        onClick={() => {
                          const plan = entry.feature ? requiredPlan(entry.feature) : null;
                          if (plan) toast.info(`${entry.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                        }}
                        className={cn(expandedItemClass(false), 'w-full cursor-pointer opacity-50')}
                      >
                        <entry.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-left">{entry.label}</span>
                        <Lock className="h-3 w-3 shrink-0" />
                      </button>
                    ) : (
                      <NavLink
                        to={entry.to}
                        className={({ isActive }) => expandedItemClass(isActive && !hasOpenGroupWithoutActiveChild)}
                      >
                        <entry.icon className="h-5 w-5 shrink-0" />
                        <span>{entry.label}</span>
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer strip — aligns with AppShell content footer for a full-width appearance */}
          <div className="hidden md:flex h-10 shrink-0 items-center border-t overflow-hidden px-3">
            {sidebarVisible && (
              <span className="text-[10px] text-sidebar-foreground/40 truncate">WorkAxis</span>
            )}
          </div>
        </aside>
      </>
    </TooltipProvider>
  );
}
