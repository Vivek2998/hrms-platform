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
  Palmtree,
  CalendarCheck,
  ClockAlert,
  CalendarPlus,
  FileText,
} from 'lucide-react';
import type { UserRole } from '@hrms/shared-types';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  allow?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Employees',
    to: '/employees',
    icon: Users,
    allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'],
  },
  { label: 'Attendance', to: '/attendance', icon: Clock },
  { label: 'Leaves', to: '/leaves', icon: CalendarDays },
  {
    label: 'Payroll',
    to: '/payroll',
    icon: DollarSign,
    allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'],
  },
  {
    label: 'Departments',
    to: '/departments',
    icon: Building2,
    allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'],
  },
  {
    label: 'Shifts',
    to: '/shifts',
    icon: Timer,
    allow: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'],
  },
  { label: 'Holiday Calendar', to: '/holidays', icon: Palmtree },
  { label: 'My Leaves', to: '/my-leaves', icon: CalendarCheck },
  { label: 'Regularisation', to: '/regularisation', icon: ClockAlert },
  { label: 'Comp Off', to: '/comp-off', icon: CalendarPlus },
  { label: 'Tax Declaration', to: '/tax-declaration', icon: FileText },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const orgName = useAuthStore((s) => s.user?.orgName);
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allow || (role && item.allow.includes(role)),
  );

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
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
