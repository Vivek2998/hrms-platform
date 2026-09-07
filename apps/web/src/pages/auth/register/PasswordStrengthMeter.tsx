function getPasswordStrength(pwd: string): { score: number; label: string } {
  if (!pwd) return { score: 0, label: '' };
  let score = 0;
  if (pwd.length >= 8)               score++;
  if (/[A-Z]/.test(pwd))             score++;
  if (/[0-9]/.test(pwd))             score++;
  if (/[@$!%*?&]/.test(pwd))         score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] ?? '' };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getPasswordStrength(password);
  if (!password) return null;

  const segmentClass = (i: number) => {
    if (i > score) return 'bg-muted';
    if (score === 1) return 'bg-destructive';
    if (score === 2) return 'bg-action-amber-fg';
    if (score === 3) return 'bg-action-blue-fg';
    return 'bg-action-green-fg';
  };

  const labelClass =
    score <= 1
      ? 'text-destructive'
      : score === 2
      ? 'text-action-amber-fg'
      : score === 3
      ? 'text-action-blue-fg'
      : 'text-action-green-fg';

  return (
    <div className="mt-2 space-y-1" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${segmentClass(i)}`} />
        ))}
      </div>
      {label && <p className={`text-[11px] font-medium ${labelClass}`}>{label}</p>}
    </div>
  );
}
