import { Building2, UserCircle, Palette, Check } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Company',  Icon: Building2 },
  { n: 2, label: 'Account',  Icon: UserCircle },
  { n: 3, label: 'Branding', Icon: Palette },
] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {STEPS.map(({ n, label, Icon }, i) => {
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                    ? 'border-primary text-primary bg-background'
                    : 'border-muted text-muted-foreground bg-background'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 -mt-3.5 h-px flex-1 transition-colors ${current > n ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
