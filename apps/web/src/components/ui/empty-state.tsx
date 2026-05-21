import { Button } from './button';
import { cn } from '@/lib/utils';

// ── Illustrations ────────────────────────────────────────────────────────────
// All SVGs use CSS custom properties so they adapt to dark/light mode.

function PeopleIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <circle cx="70" cy="46" r="11" fill="var(--primary)" opacity=".2" />
      <path d="M46 86 Q70 68 94 86" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity=".25" />
      <circle cx="46" cy="48" r="14" fill="var(--primary)" opacity=".45" />
      <path d="M16 90 Q46 70 76 90" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity=".45" />
      <circle cx="83" cy="35" r="13" fill="var(--background)" />
      <line x1="83" y1="29" x2="83" y2="41" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="77" y1="35" x2="89" y2="35" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <rect x="24" y="37" width="72" height="57" rx="9" fill="var(--background)" stroke="var(--primary)" strokeWidth="2" opacity=".5" />
      <rect x="24" y="37" width="72" height="21" rx="9" fill="var(--primary)" opacity=".35" />
      <line x1="43" y1="29" x2="43" y2="47" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <line x1="77" y1="29" x2="77" y2="47" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="70" r="3" fill="var(--primary)" opacity=".4" />
      <circle cx="55" cy="70" r="3" fill="var(--primary)" opacity=".4" />
      <circle cx="70" cy="70" r="3" fill="var(--primary)" opacity=".4" />
      <circle cx="85" cy="70" r="3" fill="var(--primary)" opacity=".4" />
      <circle cx="40" cy="84" r="3" fill="var(--primary)" opacity=".4" />
      <circle cx="55" cy="84" r="4.5" fill="var(--primary)" opacity=".7" />
    </svg>
  );
}

function MegaphoneIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <path d="M68 42 L86 32 L86 78 L68 68 Z" fill="var(--primary)" opacity=".45" />
      <rect x="30" y="48" width="38" height="22" rx="6" fill="var(--primary)" opacity=".35" />
      <path d="M38 70 L42 86" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <circle cx="90" cy="55" r="8" fill="var(--primary)" opacity=".2" />
      <circle cx="90" cy="55" r="4" fill="var(--primary)" opacity=".4" />
    </svg>
  );
}

function HeadsetIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <path d="M30 60 C30 38 46 22 60 22 C74 22 90 38 90 60" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      <rect x="24" y="56" width="14" height="22" rx="7" fill="var(--primary)" opacity=".45" />
      <rect x="82" y="56" width="14" height="22" rx="7" fill="var(--primary)" opacity=".45" />
      <path d="M60 88 C60 88 66 92 74 90" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity=".4" />
      <circle cx="74" cy="90" r="4" fill="var(--primary)" opacity=".4" />
    </svg>
  );
}

function StarIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <path d="M60 28 L67 50 L91 50 L72 64 L79 86 L60 72 L41 86 L48 64 L29 50 L53 50 Z"
        fill="var(--primary)" opacity=".4" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="84" cy="36" r="7" fill="var(--primary)" opacity=".25" />
      <circle cx="36" cy="78" r="5" fill="var(--primary)" opacity=".2" />
      <circle cx="90" cy="72" r="4" fill="var(--primary)" opacity=".2" />
    </svg>
  );
}

function BoxIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <path d="M28 50 L60 36 L92 50 L92 84 L60 98 L28 84 Z" fill="var(--background)" stroke="var(--primary)" strokeWidth="2" opacity=".5" />
      <path d="M28 50 L60 64 L92 50" stroke="var(--primary)" strokeWidth="2" opacity=".45" />
      <path d="M60 64 L60 98" stroke="var(--primary)" strokeWidth="2" opacity=".45" />
      <path d="M44 43 L44 57" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

function CheckCircleIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <circle cx="60" cy="60" r="32" fill="var(--primary)" fillOpacity=".15" stroke="var(--primary)" strokeWidth="2" strokeOpacity=".3" />
      <path d="M44 61 L55 72 L76 50" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
      <circle cx="84" cy="36" r="6" fill="var(--primary)" opacity=".2" />
      <circle cx="34" cy="80" r="5" fill="var(--primary)" opacity=".2" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <circle cx="52" cy="52" r="22" fill="var(--background)" stroke="var(--primary)" strokeWidth="3" opacity=".5" />
      <line x1="68" y1="68" x2="88" y2="88" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      <line x1="44" y1="52" x2="60" y2="52" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity=".4" />
      <line x1="44" y1="59" x2="56" y2="59" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity=".3" />
    </svg>
  );
}

function PayslipIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--muted)" />
      <rect x="32" y="26" width="56" height="72" rx="8" fill="var(--background)" stroke="var(--primary)" strokeWidth="2" opacity=".5" />
      <line x1="44" y1="44" x2="76" y2="44" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity=".4" />
      <line x1="44" y1="54" x2="68" y2="54" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity=".3" />
      <text x="60" y="75" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--primary)" opacity=".6" fontFamily="system-ui">₹</text>
      <line x1="44" y1="86" x2="76" y2="86" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity=".25" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  employees: PeopleIllustration,
  leaves: CalendarIllustration,
  'my-leaves': CalendarIllustration,
  announcements: MegaphoneIllustration,
  helpdesk: HeadsetIllustration,
  kudos: StarIllustration,
  assets: BoxIllustration,
  'caught-up': CheckCircleIllustration,
  search: SearchIllustration,
  payslips: PayslipIllustration,
  generic: BoxIllustration,
} as const;

export type EmptyStateVariant = keyof typeof ILLUSTRATIONS;

interface EmptyStateProps {
  illustration?: EmptyStateVariant;
  title: string;
  description?: string | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}

export function EmptyState({
  illustration = 'generic',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[illustration];

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
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}
