export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusVariant(status: string): 'default' | 'secondary' | 'warning' | 'destructive' | 'success' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'PENDING') return 'warning';
  return 'secondary';
}

export const TYPE_META: Record<string, { label: string; color: string }> = {
  LEAVE:          { label: 'Leave',          color: 'bg-action-blue-bg   text-action-blue-fg' },
  EXPENSE:        { label: 'Expense',        color: 'bg-action-green-bg  text-action-green-fg' },
  REGULARISATION: { label: 'Regularisation', color: 'bg-action-amber-bg  text-action-amber-fg' },
  COMP_OFF:       { label: 'Comp Off',       color: 'bg-action-violet-bg text-action-violet-fg' },
  HELPDESK:       { label: 'Helpdesk',       color: 'bg-action-rose-bg   text-action-rose-fg' },
};
