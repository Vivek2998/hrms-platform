import { useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadCsv } from '@/lib/downloadCsv';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface ReportCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onDownload: () => Promise<void>;
  loading: boolean;
}

function ReportCard({ title, description, children, onDownload, loading }: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <FileSpreadsheet className="text-primary h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Button
          className="w-full"
          onClick={() => { void onDownload(); }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Generating…' : 'Download CSV'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(CURRENT_YEAR);
  const [attLoading, setAttLoading] = useState(false);

  const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
  const [payYear, setPayYear] = useState(CURRENT_YEAR);
  const [payLoading, setPayLoading] = useState(false);

  const [leaveYear, setLeaveYear] = useState(CURRENT_YEAR);
  const [leaveLoading, setLeaveLoading] = useState(false);

  async function downloadAttendance() {
    setAttLoading(true);
    try {
      await downloadCsv(
        '/reports/attendance',
        { month: attMonth, year: attYear },
        `attendance_${attYear}_${pad(attMonth)}.csv`,
      );
    } catch {
      toast.error('Failed to generate attendance report');
    } finally {
      setAttLoading(false);
    }
  }

  async function downloadPayroll() {
    setPayLoading(true);
    try {
      await downloadCsv(
        '/reports/payroll',
        { month: payMonth, year: payYear },
        `payroll_${payYear}_${pad(payMonth)}.csv`,
      );
    } catch {
      toast.error('Failed to generate payroll report');
    } finally {
      setPayLoading(false);
    }
  }

  async function downloadLeaves() {
    setLeaveLoading(true);
    try {
      await downloadCsv(
        '/reports/leaves',
        { year: leaveYear },
        `leaves_${leaveYear}.csv`,
      );
    } catch {
      toast.error('Failed to generate leave report');
    } finally {
      setLeaveLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Download CSV exports for attendance, payroll, and leave data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Report */}
        <ReportCard
          title="Attendance Report"
          description="Daily punch-in/out times, status, and working hours for all employees."
          onDownload={downloadAttendance}
          loading={attLoading}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select value={String(attMonth)} onValueChange={(v) => setAttMonth(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select value={String(attYear)} onValueChange={(v) => setAttYear(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ReportCard>

        {/* Payroll Report */}
        <ReportCard
          title="Payroll Report"
          description="Working days, present days, LOP, earnings, deductions, and net pay per employee."
          onDownload={downloadPayroll}
          loading={payLoading}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select value={String(payMonth)} onValueChange={(v) => setPayMonth(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select value={String(payYear)} onValueChange={(v) => setPayYear(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ReportCard>

        {/* Leave Report */}
        <ReportCard
          title="Leave Report"
          description="All leave requests by employee for the year — type, dates, days taken, and status."
          onDownload={downloadLeaves}
          loading={leaveLoading}
        >
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select value={String(leaveYear)} onValueChange={(v) => setLeaveYear(Number(v))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
