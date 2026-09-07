import React from 'react';
import { Cake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGiveKudos } from '@/hooks/useKudos';
import { cn } from '@/lib/utils';
import { useCarousel, CAROUSEL_ANIM_MS } from '@/hooks/useCarousel';
import type { BirthdayEntry } from '@/hooks/useDashboardWidgets';

const BDAY_SPARKLES = [
  { top: '10%', left: '6%',  size: 10, delay: '0s'    },
  { top: '16%', left: '89%', size: 8,  delay: '0.65s' },
  { top: '48%', left: '3%',  size: 7,  delay: '1.1s'  },
  { top: '52%', left: '92%', size: 9,  delay: '0.35s' },
  { top: '76%', left: '17%', size: 7,  delay: '1.45s' },
  { top: '70%', left: '79%', size: 6,  delay: '0.85s' },
  { top: '32%', left: '48%', size: 5,  delay: '0.5s'  },
];

export function BirthdayWidget({ entries, loading }: { entries: BirthdayEntry[]; loading: boolean }) {
  const giveKudos = useGiveKudos();
  const [wished, setWished] = React.useState<Set<string>>(new Set());
  const { current, prev, direction, transitioning, navigate, handlers } = useCarousel(entries.length);

  function renderRow(e: BirthdayEntry, showWish: boolean) {
    return (
      <div className="flex items-center gap-2.5 py-1 pl-1">
        {e.avatarUrl ? (
          <img src={e.avatarUrl} alt={`${e.firstName} ${e.lastName}`}
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/40" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-2 ring-white/30">
            {`${e.firstName[0]}${e.lastName[0]}`.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{e.firstName} {e.lastName}</p>
          {e.designation && <p className="truncate text-xs text-white/70">{e.designation}</p>}
        </div>
        {showWish && (
          <button
            disabled={wished.has(e.id) || giveKudos.isPending}
            onClick={() => {
              if (wished.has(e.id) || giveKudos.isPending) return;
              giveKudos.mutate(
                { toEmployeeId: e.id, category: 'OTHER', message: `Happy Birthday ${e.firstName}! 🎂 Wishing you a wonderful day!`, isPublic: true },
                { onSuccess: () => setWished((ws) => new Set(ws).add(e.id)) },
              );
            }}
            className={cn(
              'h-7 shrink-0 rounded-md border px-3 text-xs font-medium transition-all',
              wished.has(e.id)
                ? 'cursor-default border-white/30 bg-white/20 text-white/80'
                : 'border-white/50 bg-white/15 text-white hover:bg-white/30 hover:border-white/70',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {wished.has(e.id) ? '🎂 Wished!' : 'Wish 🎂'}
          </button>
        )}
      </div>
    );
  }

  const entry = entries[current];
  const trackStart = direction === 'left' ? '0%'   : '-50%';
  const trackEnd   = direction === 'left' ? '-50%' : '0%';

  return (
    <Card className="relative overflow-hidden border-0 bg-linear-to-br from-rose-400 via-pink-500 to-fuchsia-500 shadow-lg shadow-pink-500/25">
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-orange-300/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-4 right-1/3 h-16 w-16 rounded-full bg-yellow-200/10 blur-xl" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BDAY_SPARKLES.map((s, i) => (
          <span key={i} className="absolute select-none text-white" style={{
            top: s.top, left: s.left, fontSize: `${s.size}px`,
            animation: 'bday-twinkle 2.4s ease-in-out infinite',
            animationDelay: s.delay,
          }}>✦</span>
        ))}
      </div>

      <CardContent className="relative pt-3">
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
            <Cake className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Birthdays Today</span>
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
          <div className="select-none" {...handlers}>
            <div className="w-full overflow-hidden">
              {prev !== null && entries[prev] ? (
                <div
                  className="flex"
                  style={{
                    width: '200%',
                    transform: `translateX(${transitioning ? trackEnd : trackStart})`,
                    transition: transitioning
                      ? `transform ${CAROUSEL_ANIM_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                      : 'none',
                    willChange: 'transform',
                  }}
                >
                  {direction === 'left' ? (
                    <>
                      <div className="w-1/2 min-w-0 shrink-0">{renderRow(entries[prev]!, false)}</div>
                      <div className="w-1/2 min-w-0 shrink-0">{renderRow(entry!, true)}</div>
                    </>
                  ) : (
                    <>
                      <div className="w-1/2 min-w-0 shrink-0">{renderRow(entry!, true)}</div>
                      <div className="w-1/2 min-w-0 shrink-0">{renderRow(entries[prev]!, false)}</div>
                    </>
                  )}
                </div>
              ) : (
                renderRow(entry!, true)
              )}
            </div>
            {entries.length > 1 && (
              <div className="flex justify-center gap-1.5 pt-2" role="tablist" aria-label="Birthday carousel navigation">
                {entries.map((e, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`${e.firstName} ${e.lastName} — slide ${i + 1} of ${entries.length}`}
                    onClick={() => navigate(i)}
                    className={cn('h-1.5 rounded-full transition-all duration-300',
                      i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/35')}
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
