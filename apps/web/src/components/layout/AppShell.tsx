import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AssistantWidget } from './AssistantWidget';
import { CommandPalette } from './CommandPalette';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

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
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AssistantWidget />
      <CommandPalette />
    </div>
  );
}
