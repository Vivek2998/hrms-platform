import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { Clock, Plus, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useProjects, useCreateProject, useTimesheetEntries,
  useUpsertTimesheetEntry, useSubmitTimesheetWeek, useAllTimesheets, useApproveTimesheet,
} from '@/hooks/useTimesheet';
import { useAuthStore } from '@/stores/auth.store';
import { format, addDays } from 'date-fns';

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function TimesheetPage() {
  const [tab, setTab] = useSessionStorageState<'my' | 'all'>('timesheet_tab', 'my');
  const [weekDate, setWeekDate] = useState(new Date());
  const [showNewProject, setShowNewProject] = useState(false);
  const weekStart = getWeekStart(weekDate);
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const { data: projects } = useProjects();
  const { data: entries, isLoading } = useTimesheetEntries(weekStartStr);
  const { data: allTimesheets } = useAllTimesheets();
  const submitWeek = useSubmitTimesheetWeek();
  const approveTs = useApproveTimesheet();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Timesheets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track project hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewProject(true)}>
            <Plus className="w-4 h-4 mr-1" /> Project
          </Button>
          {isHR && (
            <Button variant="outline" onClick={() => setTab(tab === 'my' ? 'all' : 'my')}>
              {tab === 'my' ? 'View All' : 'My Timesheet'}
            </Button>
          )}
        </div>
      </div>

      {tab === 'my' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setWeekDate(addDays(weekDate, -7))} className="text-muted-foreground hover:text-foreground px-2">‹</button>
            <span className="font-medium text-sm">
              Week of {format(weekStart, 'dd MMM')} – {format(addDays(weekStart, 6), 'dd MMM yyyy')}
            </span>
            <button onClick={() => setWeekDate(addDays(weekDate, 7))} className="text-muted-foreground hover:text-foreground px-2">›</button>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground w-40">Project</th>
                      {weekDays.map((d) => (
                        <th key={d.toISOString()} className="text-center p-3 font-medium text-muted-foreground w-16">
                          {format(d, 'EEE')}<br />
                          <span className="text-xs">{format(d, 'dd')}</span>
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium text-muted-foreground w-16">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects?.map((proj: any) => {
                      const projEntries = (entries ?? []).filter((e: any) => e.projectId === proj.id);
                      const rowTotal = projEntries.reduce((s: number, e: any) => s + e.hours, 0);
                      return (
                        <tr key={proj.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium truncate max-w-[160px]">{proj.name}</td>
                          {weekDays.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const entry = projEntries.find((e: any) => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
                            return (
                              <td key={dateStr} className="p-1 text-center">
                                <TimesheetCell
                                  projectId={proj.id}
                                  date={dateStr}
                                  value={entry?.hours ?? 0}
                                  weekStart={weekStartStr}
                                />
                              </td>
                            );
                          })}
                          <td className="p-3 text-center font-semibold">{rowTotal || ''}</td>
                        </tr>
                      );
                    })}
                    {!projects?.length && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                          No projects yet. Create one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => submitWeek.mutate(weekStartStr)} disabled={submitWeek.isPending}>
              <Send className="w-4 h-4 mr-2" /> Submit Week
            </Button>
          </div>
        </div>
      )}

      {tab === 'all' && isHR && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">All Submitted Timesheets</h2>
          {!allTimesheets?.length ? (
            <p className="text-muted-foreground text-sm">No submitted timesheets yet.</p>
          ) : (
            allTimesheets.map((ts: any) => (
              <Card key={`${ts.employeeId}-${ts.weekStart}`}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ts.employee?.firstName} {ts.employee?.lastName}</p>
                    <p className="text-xs text-muted-foreground">Week of {format(new Date(ts.weekStart), 'dd MMM yyyy')} · {ts.totalHours}h</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={ts.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {ts.status}
                    </Badge>
                    {ts.status === 'SUBMITTED' && (
                      <Button size="sm" variant="outline" disabled={approveTs.isPending}
                        onClick={() => approveTs.mutate({ employeeId: ts.employeeId, weekStart: ts.weekStart })}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
    </div>
  );
}

function TimesheetCell({ projectId, date, value, weekStart }: { projectId: string; date: string; value: number; weekStart: string }) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(String(value || ''));
  const upsert = useUpsertTimesheetEntry();

  function handleBlur() {
    setEditing(false);
    const h = parseFloat(hours);
    if (!isNaN(h) && h !== value) {
      upsert.mutate({ projectId, date, hours: h, weekStart });
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        max="24"
        step="0.5"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        onBlur={handleBlur}
        className="w-12 h-7 text-center text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-12 h-7 text-center text-sm rounded hover:bg-blue-50 hover:border hover:border-blue-300 transition-colors ${value ? 'font-medium' : 'text-muted-foreground'}`}
    >
      {value || '–'}
    </button>
  );
}

function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const create = useCreateProject();

  async function handleSubmit() {
    if (!name) return;
    await create.mutateAsync({ name, clientName: clientName || undefined });
    setName(''); setClientName('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Project Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Client (optional)</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
