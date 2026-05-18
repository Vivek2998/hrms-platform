import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, CalendarDays, AlignJustify } from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Home', to: '/dashboard' },
  { icon: Clock, label: 'Attendance', to: '/attendance' },
  { icon: CalendarDays, label: 'Leaves', to: '/my-leaves' },
] as const;

export function BottomNav() {
  const { toggleSidebar } = useUiStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-2 md:hidden">
      {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-lg px-5 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
      <button
        onClick={toggleSidebar}
        className="text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-0.5 rounded-lg px-5 py-2 text-xs font-medium transition-colors"
      >
        <AlignJustify className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  );
}
