import { useRef } from 'react';
import { Input } from '@/components/ui/input';

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-9 w-9 shrink-0 rounded-md border border-input shadow-sm cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: isValid ? value : 'var(--border)' }}
        title="Click to pick colour"
        aria-label="Open colour picker"
      />
      <input
        ref={inputRef}
        type="color"
        value={isValid ? value : '#2563eb'}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />
      <Input
        id="register-primary-color"
        value={value}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          onChange(v.startsWith('#') ? v : '#' + v);
        }}
        placeholder="#2563EB"
        className="font-mono uppercase text-sm"
        maxLength={7}
      />
    </div>
  );
}
