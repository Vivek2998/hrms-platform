// ─────────────────────────────────────────────────────────────
// Currency
// ─────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN',
  showDecimals = false,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatInr(amount: number): string {
  return formatCurrency(amount, 'INR', 'en-IN');
}

export function formatNumber(value: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(value);
}

// ─────────────────────────────────────────────────────────────
// Employee & Organization
// ─────────────────────────────────────────────────────────────

export function formatEmployeeCode(prefix: string, sequence: number, padLength = 4): string {
  return `${prefix.toUpperCase()}${String(sequence).padStart(padLength, '0')}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

// ─────────────────────────────────────────────────────────────
// Text
// ─────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - suffix.length)}${suffix}`;
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────
// PII Masking (display in UI without exposing full data)
// ─────────────────────────────────────────────────────────────

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.max(0, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return '****';
  return `${clean.slice(0, 2)}${'*'.repeat(clean.length - 4)}${clean.slice(-2)}`;
}

export function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\s/g, '');
  return `XXXX XXXX ${clean.slice(-4)}`;
}

export function maskBankAccount(accountNo: string): string {
  if (accountNo.length < 4) return '****';
  return `${'*'.repeat(accountNo.length - 4)}${accountNo.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────
// File
// ─────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const index = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(1))} ${sizes[index]}`;
}

// ─────────────────────────────────────────────────────────────
// Duration
// ─────────────────────────────────────────────────────────────

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatWorkingHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
