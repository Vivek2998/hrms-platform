import { useState } from 'react';
import { FileText, Download, Loader2, IndianRupee } from 'lucide-react';
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

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        )}

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

            {payslip.pdfUrl && (
              <Button asChild className="w-full" variant="outline">
                <a href={payslip.pdfUrl} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
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
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <IndianRupee className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">No payslips available yet.</p>
          </CardContent>
        </Card>
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
