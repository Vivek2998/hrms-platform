import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HeroCard() {
  const user = useAuthStore((s) => s.user);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="from-primary to-primary/80 relative overflow-hidden rounded-xl bg-linear-to-br p-5 shadow-md">
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
