import { Button } from './button';
import { cn } from '@/lib/utils';

function ErrorIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <circle cx="60" cy="60" r="32" fill="var(--destructive)" fillOpacity=".12" stroke="var(--destructive)" strokeWidth="2" strokeOpacity=".3" />
      <line x1="60" y1="44" x2="60" y2="66" stroke="var(--destructive)" strokeWidth="4" strokeLinecap="round" strokeOpacity=".7" />
      <circle cx="60" cy="76" r="2.5" fill="var(--destructive)" fillOpacity=".7" />
      <circle cx="84" cy="36" r="6" fill="var(--destructive)" opacity=".15" />
      <circle cx="34" cy="80" r="5" fill="var(--destructive)" opacity=".12" />
    </svg>
  );
}

function NetworkIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <path d="M30 60 C30 60 42 42 60 42 C78 42 90 60 90 60" stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" strokeOpacity=".4" />
      <path d="M40 70 C40 70 48 58 60 58 C72 58 80 70 80 70" stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" strokeOpacity=".5" />
      <circle cx="60" cy="80" r="5" fill="var(--muted-foreground)" opacity=".5" />
      <line x1="38" y1="38" x2="82" y2="82" stroke="var(--destructive)" strokeWidth="3" strokeLinecap="round" strokeOpacity=".6" />
    </svg>
  );
}

function NotFoundIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <rect x="32" y="30" width="56" height="60" rx="8" fill="var(--background)" stroke="var(--muted-foreground)" strokeWidth="2" strokeOpacity=".4" />
      <line x1="44" y1="48" x2="76" y2="48" stroke="var(--muted-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".35" />
      <line x1="44" y1="58" x2="68" y2="58" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeOpacity=".25" />
      <line x1="44" y1="68" x2="60" y2="68" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeOpacity=".2" />
      <circle cx="78" cy="78" r="16" fill="var(--background)" stroke="var(--muted-foreground)" strokeWidth="2.5" strokeOpacity=".5" />
      <line x1="72" y1="72" x2="84" y2="84" stroke="var(--muted-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".4" />
      <line x1="84" y1="72" x2="72" y2="84" stroke="var(--muted-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".4" />
    </svg>
  );
}

function ForbiddenIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <rect x="34" y="54" width="52" height="38" rx="7" fill="var(--background)" stroke="var(--muted-foreground)" strokeWidth="2" strokeOpacity=".45" />
      <path d="M44 54 V42 C44 31 76 31 76 42 V54" stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" strokeOpacity=".45" fill="none" />
      <circle cx="60" cy="73" r="6" fill="var(--muted-foreground)" opacity=".35" />
      <line x1="60" y1="79" x2="60" y2="85" stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" strokeOpacity=".35" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  error: ErrorIllustration,
  network: NetworkIllustration,
  'not-found': NotFoundIllustration,
  forbidden: ForbiddenIllustration,
} as const;

export type ErrorStateVariant = keyof typeof ILLUSTRATIONS;

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string | undefined;
  description?: string | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

export function ErrorState({
  variant = 'error',
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  const Illustration = ILLUSTRATIONS[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <div className="w-32 h-32 opacity-90">
        <Illustration />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-base font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
