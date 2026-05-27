import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AssistantWidget } from './AssistantWidget';
import { CommandPalette } from './CommandPalette';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const location = useLocation();

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          'ml-0',
          sidebarOpen ? 'md:ml-64' : 'md:ml-16',
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-14">
          <div key={location.pathname} className="animate-page-enter h-full">
            <Outlet />
          </div>
        </main>
        <footer className="hidden md:flex shrink-0 items-center justify-between border-t bg-background px-6 py-2">
          <span className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} WorkAxis · All rights reserved
          </span>
          <span className="text-[11px] text-muted-foreground">
            HR Platform · v1.0
          </span>
        </footer>
      </div>
      <BottomNav />
      <AssistantWidget />
      <CommandPalette />
    </div>
  );
}
