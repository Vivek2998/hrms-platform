import { useState, useEffect } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const triggerCls =
  'flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input ' +
  'bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ' +
  'data-[placeholder]:text-muted-foreground';

const contentCls =
  'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border ' +
  'bg-popover text-popover-foreground shadow-md ' +
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95';

const itemCls =
  'relative flex w-full cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm ' +
  'outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50';

interface ColSelectProps {
  value: string;
  placeholder: string;
  options: { label: string | number; value: string }[];
  onChange: (v: string) => void;
  className?: string;
}

function ColSelect({ value, placeholder, options, onChange, className }: ColSelectProps) {
  const rootProps = value ? { value } : {};
  return (
    <SelectPrimitive.Root {...rootProps} onValueChange={onChange}>
      <SelectPrimitive.Trigger className={cn(triggerCls, className)}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={contentCls}
          position="popper"
          sideOffset={4}
        >
          {/* Plain overflow-y-auto viewport — no Radix scroll buttons, no hover-scroll */}
          <SelectPrimitive.Viewport className="max-h-52 overflow-y-auto p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item key={opt.value} value={opt.value} className={itemCls}>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ─────────────────────────────────────────────

interface DateSelectPickerProps {
  value?: string | undefined;
  onChange: (value: string) => void;
  /** defaults to current year - 100 */
  minYear?: number | undefined;
  /** defaults to current year; pass currentYear + 2 for future-date fields */
  maxYear?: number | undefined;
}

function parseParts(v?: string) {
  const parts = v ? v.split('-') : ['', '', ''];
  return { year: parts[0] ?? '', month: parts[1] ?? '', day: parts[2] ?? '' };
}

export function DateSelectPicker({ value, onChange, minYear, maxYear }: DateSelectPickerProps) {
  const now = new Date().getFullYear();
  const lo = minYear ?? now - 100;
  const hi = maxYear ?? now;

  // Local state holds in-progress selections independently of the parent value.
  // This lets users pick day/month/year in any order without losing earlier choices.
  const [local, setLocal] = useState(parseParts(value));

  // Sync when the external value changes (form reset, dialog re-open).
  useEffect(() => {
    setLocal(parseParts(value));
  }, [value]);

  function handleChange(field: 'day' | 'month' | 'year', val: string) {
    const next = { ...local, [field]: val };
    setLocal(next);
    onChange(next.day && next.month && next.year ? `${next.year}-${next.month}-${next.day}` : '');
  }

  const numYear  = parseInt(local.year)  || now;
  const numMonth = parseInt(local.month) || 1;
  const maxDay   = local.year && local.month ? daysInMonth(numMonth, numYear) : 31;

  const dayOpts   = Array.from({ length: maxDay }, (_, i) => {
    const v = String(i + 1).padStart(2, '0');
    return { value: v, label: i + 1 };
  });
  const monthOpts = MONTHS.map((label, i) => ({ label, value: String(i + 1).padStart(2, '0') }));
  const yearOpts  = Array.from({ length: hi - lo + 1 }, (_, i) => {
    const y = String(hi - i);
    return { value: y, label: y };
  });

  return (
    <div className="flex gap-2">
      <ColSelect
        value={local.day}
        placeholder="Day"
        options={dayOpts}
        onChange={(d) => handleChange('day', d)}
        className="flex-1"
      />
      <ColSelect
        value={local.month}
        placeholder="Month"
        options={monthOpts}
        onChange={(m) => handleChange('month', m)}
        className="flex-1"
      />
      <ColSelect
        value={local.year}
        placeholder="Year"
        options={yearOpts}
        onChange={(y) => handleChange('year', y)}
        className="flex-[1.4]"
      />
    </div>
  );
}
