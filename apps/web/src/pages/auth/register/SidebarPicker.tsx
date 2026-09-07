const SIDEBAR_OPTIONS = [
  { value: 'light',   label: 'Light',   desc: 'Clean white sidebar' },
  { value: 'dark',    label: 'Dark',    desc: 'Dark slate sidebar' },
  { value: 'branded', label: 'Branded', desc: 'Uses your brand colour' },
] as const;

export function SidebarPicker({ value, onChange }: { value: string; onChange: (v: 'light' | 'dark' | 'branded') => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SIDEBAR_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-lg border p-2.5 text-left transition-colors ${
            value === o.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:border-muted-foreground/40'
          }`}
        >
          <p className="text-xs font-semibold">{o.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}
