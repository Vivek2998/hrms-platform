import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  Building2,
  Timer,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
} from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole, OrgPlan } from '@hrms/shared-types';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';
import { canAccess, requiredPlan, PLAN_LABELS } from '@/lib/feature-flags';

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
      { label: 'My Payslips', to: '/my-payslips', icon: IndianRupee, feature: 'my-payslips' },
      { label: 'Tax Declaration', to: '/tax-declaration', icon: FileText, feature: 'tax-declaration' },
    ],
  },
  {
    group: true,
    key: 'company',
    label: 'Company',
    icon: Globe,
    children: [
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
      { label: 'Employee Directory', to: '/directory', icon: BookUser },
      { label: 'Organisation Chart', to: '/org-chart', icon: Network },
    ],
  },
  {
    group: true,
    key: 'people',
    label: 'People',
    icon: Users,
    children: [
      { label: 'Onboarding', to: '/onboarding', icon: ClipboardList, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], feature: 'onboarding' },
      { label: 'Performance', to: '/performance', icon: Target, feature: 'performance' },
      { label: 'Offboarding', to: '/offboarding', icon: UserMinus, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'offboarding' },
      { label: 'Pulse Surveys', to: '/pulse-surveys', icon: BarChart2, feature: 'pulse-surveys' },
    ],
  },
  {
    group: true,
    key: 'support',
    label: 'Support',
    icon: LifeBuoy,
    children: [
      { label: 'Help Desk', to: '/helpdesk', icon: Headphones, feature: 'helpdesk' },
      { label: 'Suggestion Box', to: '/suggestions', icon: Lightbulb, feature: 'suggestions' },
      { label: 'HR Policies', to: '/hr-policies', icon: BookOpen, feature: 'hr-policies' },
    ],
  },
  { group: false, label: 'Recruitment', to: '/recruitment', icon: Briefcase, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'recruitment' },
  { group: false, label: 'Analytics', to: '/analytics', icon: TrendingUp, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'analytics' },
  { group: false, label: 'Departments', to: '/departments', icon: Building2, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'departments' },
  { group: false, label: 'Shifts', to: '/shifts', icon: Timer, allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'], feature: 'shifts' },
  { group: false, label: 'Settings', to: '/settings', icon: Settings },
];

function isVisible(item: NavItem, role: UserRole | undefined): boolean {
  return !item.allow || (role != null && item.allow.includes(role));
}

function isLocked(item: NavItem, orgPlan: OrgPlan | undefined): boolean {
  if (!item.feature || !orgPlan) return false;
  return !canAccess(orgPlan, item.feature);
}

function itemClass(isActive: boolean, indent: boolean) {
  return cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    indent && 'ml-4',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  );
}

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const orgName = useAuthStore((s) => s.user?.orgName);
  const orgPlan = useAuthStore((s) => s.user?.orgPlan);
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setOpenGroups((prev) => new Set(prev.has(key) ? [] : [key]));
  }

  return (
    <aside
      className={cn(
        'bg-sidebar fixed left-0 top-0 z-40 flex h-full flex-col border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-primary h-8 w-8 shrink-0 rounded-lg" />
            <span className="text-sidebar-foreground truncate text-sm font-semibold">
              {orgName ?? 'HRMS'}
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto rounded-md p-1.5"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {ENTRIES.map((entry) => {
            if (entry.group) {
              const visible = entry.children.filter((c) => isVisible(c, role));
              if (visible.length === 0) return null;
              const isOpen = openGroups.has(entry.key);

              return (
                <li key={entry.key}>
                  {sidebarOpen && (
                    <button
                      onClick={() => { toggleGroup(entry.key); }}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <entry.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{entry.label}</span>
                      <ChevronDown
                        className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                      />
                    </button>
                  )}
                  {(isOpen || !sidebarOpen) && (
                    <ul className={cn('space-y-1', sidebarOpen && 'mt-1')}>
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
                                className={cn(
                                  itemClass(false, sidebarOpen),
                                  'w-full cursor-pointer opacity-50',
                                )}
                              >
                                <child.icon className="h-5 w-5 shrink-0" />
                                {sidebarOpen && (
                                  <>
                                    <span className="flex-1 text-left">{child.label}</span>
                                    <Lock className="h-3 w-3 shrink-0" />
                                  </>
                                )}
                              </button>
                            </li>
                          );
                        }
                        return (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              className={({ isActive }) => itemClass(isActive, sidebarOpen)}
                            >
                              <child.icon className="h-5 w-5 shrink-0" />
                              {sidebarOpen && <span>{child.label}</span>}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            if (!isVisible(entry, role)) return null;

            const locked = isLocked(entry, orgPlan);
            if (locked) {
              return (
                <li key={entry.to}>
                  <button
                    onClick={() => {
                      const plan = entry.feature ? requiredPlan(entry.feature) : null;
                      if (plan) toast.info(`${entry.label} requires the ${PLAN_LABELS[plan]} plan. Please upgrade.`);
                    }}
                    className={cn(itemClass(false, false), 'w-full cursor-pointer opacity-50')}
                  >
                    <entry.icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{entry.label}</span>
                        <Lock className="h-3 w-3 shrink-0" />
                      </>
                    )}
                  </button>
                </li>
              );
            }

            return (
              <li key={entry.to}>
                <NavLink
                  to={entry.to}
                  className={({ isActive }) => itemClass(isActive, false)}
                >
                  <entry.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{entry.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
