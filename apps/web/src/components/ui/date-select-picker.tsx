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
  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onChange}>
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
  value?: string;
  onChange: (value: string) => void;
  /** defaults to current year - 100 */
  minYear?: number;
  /** defaults to current year; pass currentYear + 2 for future-date fields */
  maxYear?: number;
}

export function DateSelectPicker({ value, onChange, minYear, maxYear }: DateSelectPickerProps) {
  const now = new Date().getFullYear();
  const lo = minYear ?? now - 100;
  const hi = maxYear ?? now;

  const parts  = value ? value.split('-') : ['', '', ''];
  const year   = parts[0] ?? '';
  const month  = parts[1] ?? '';
  const day    = parts[2] ?? '';

  const numYear  = parseInt(year)  || now;
  const numMonth = parseInt(month) || 1;
  const maxDay   = year && month ? daysInMonth(numMonth, numYear) : 31;

  const dayOpts   = Array.from({ length: maxDay }, (_, i) => {
    const v = String(i + 1).padStart(2, '0');
    return { value: v, label: i + 1 };
  });
  const monthOpts = MONTHS.map((label, i) => ({ label, value: String(i + 1).padStart(2, '0') }));
  const yearOpts  = Array.from({ length: hi - lo + 1 }, (_, i) => {
    const y = String(hi - i);
    return { value: y, label: y };
  });

  function emit(d: string, m: string, y: string) {
    onChange(d && m && y ? `${y}-${m}-${d}` : '');
  }

  return (
    <div className="flex gap-2">
      <ColSelect
        value={day}
        placeholder="Day"
        options={dayOpts}
        onChange={(d) => emit(d, month, year)}
        className="flex-1"
      />
      <ColSelect
        value={month}
        placeholder="Month"
        options={monthOpts}
        onChange={(m) => emit(day, m, year)}
        className="flex-1"
      />
      <ColSelect
        value={year}
        placeholder="Year"
        options={yearOpts}
        onChange={(y) => emit(day, month, y)}
        className="flex-[1.4]"
      />
    </div>
  );
}
