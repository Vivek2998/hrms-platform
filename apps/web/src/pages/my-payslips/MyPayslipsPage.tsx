import { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { DialogContentSkeleton } from '@/components/ui/skeleton-patterns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMyPayslips, useMyPayslipDetail, monthLabel } from '@/hooks/useMyPayslips';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PAID: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

function printPayslip(payslip: ReturnType<typeof useMyPayslipDetail>['data']) {
  if (!payslip) return;
  const period = monthLabel(payslip.month, payslip.year);
  const rows = (items: { name: string; amount: number }[], color = '#111827') =>
    items
      .map(
        (i) =>
          `<tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6">${i.name}</td>` +
          `<td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:${color}">₹${fmt(i.amount)}</td></tr>`,
      )
      .join('');

  const html = `<!DOCTYPE html><html><head><title>Payslip — ${period}</title>
  <style>
    body{font-family:sans-serif;color:#111827;padding:40px;max-width:600px;margin:0 auto}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#6b7280;font-size:13px;margin:0 0 24px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    th{text-align:left;padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
    .summary{display:flex;gap:16px;margin:0 0 24px}
    .box{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
    .box .label{font-size:11px;color:#6b7280;margin-bottom:4px}
    .box .value{font-size:16px;font-weight:600}
    .net .value{color:#16a34a}
    @media print{body{padding:20px}}
  </style></head><body>
  <h1>Payslip — ${period}</h1>
  <p class="sub">Status: ${payslip.status}</p>
  <div class="summary">
    <div class="box"><div class="label">Gross Earnings</div><div class="value">₹${fmt(payslip.grossEarnings)}</div></div>
    <div class="box"><div class="label">Total Deductions</div><div class="value" style="color:#dc2626">₹${fmt(payslip.totalDeductions)}</div></div>
    <div class="box net"><div class="label">Net Pay</div><div class="value">₹${fmt(payslip.netPay)}</div></div>
  </div>
  ${(payslip.earnings ?? []).length ? `<table><thead><tr><th>Earning</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows(payslip.earnings ?? [])}</tbody></table><br>` : ''}
  ${(payslip.deductions ?? []).length ? `<table><thead><tr><th>Deduction</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows(payslip.deductions ?? [], '#dc2626')}</tbody></table>` : ''}
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const win = window.open('', '_blank', 'width=700,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function PayslipDetailDialog({
  payslipId,
  onClose,
}: {
  payslipId: string | null;
  onClose: () => void;
}) {
  const { data: payslip, isLoading } = useMyPayslipDetail(payslipId);

  return (
    <Dialog open={!!payslipId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payslip ? monthLabel(payslip.month, payslip.year) : '…'} Payslip
          </DialogTitle>
        </DialogHeader>

        {isLoading && <DialogContentSkeleton />}

        {payslip && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-muted-foreground text-xs">Gross</p>
                <p className="font-semibold">₹{fmt(payslip.grossEarnings)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-muted-foreground text-xs">Deductions</p>
                <p className="font-semibold text-red-600">₹{fmt(payslip.totalDeductions)}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-muted-foreground text-xs">Net Pay</p>
                <p className="font-bold text-green-700">₹{fmt(payslip.netPay)}</p>
              </div>
            </div>

            {(payslip.earnings ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Earnings</p>
                <div className="rounded-lg border divide-y">
                  {(payslip.earnings ?? []).map((e) => (
                    <div key={e.code} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{e.name}</span>
                      <span className="text-sm font-medium">₹{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(payslip.deductions ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Deductions</p>
                <div className="rounded-lg border divide-y">
                  {(payslip.deductions ?? []).map((d) => (
                    <div key={d.code} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{d.name}</span>
                      <span className="text-sm font-medium text-red-600">−₹{fmt(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => printPayslip(payslip)}>
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </Button>
              {payslip.pdfUrl && (
                <Button asChild className="flex-1" variant="outline">
                  <a href={payslip.pdfUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MyPayslipsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: payslips, isLoading } = useMyPayslips();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground">View and download your monthly payslips</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !payslips?.length ? (
        <EmptyState
          illustration="payslips"
          title="No payslips yet"
          description="Your payslips will appear here once payroll is processed."
        />
      ) : (
        <div className="space-y-3">
          {payslips.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-shadow hover:shadow-sm"
              onClick={() => { setSelectedId(p.id); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg shrink-0">
                      <FileText className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{monthLabel(p.month, p.year)}</CardTitle>
                      <p className="text-muted-foreground text-xs">Net Pay: ₹{fmt(p.netPay)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-muted-foreground">Gross</p>
                      <p className="text-sm font-medium">₹{fmt(p.grossEarnings)}</p>
                    </div>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-muted text-muted-foreground')}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <PayslipDetailDialog payslipId={selectedId} onClose={() => { setSelectedId(null); }} />
    </div>
  );
}
