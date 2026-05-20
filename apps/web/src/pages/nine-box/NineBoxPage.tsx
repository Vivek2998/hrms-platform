import { useState } from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useNineBoxAssessments, useUpsertNineBoxAssessment } from '@/hooks/useNineBox';
import { useAuthStore } from '@/stores/auth.store';

const BOX_LABELS: Record<string, string> = {
  '1-1': 'Underperformer', '2-1': 'Inconsistent Player', '3-1': 'High Professional',
  '1-2': 'Core Player',    '2-2': 'Core Player',          '3-2': 'High Performer',
  '1-3': 'Rising Star',    '2-3': 'High Potential',       '3-3': 'Star',
};

const BOX_COLORS: Record<string, string> = {
  '1-1': 'bg-red-50 border-red-200',     '2-1': 'bg-red-50 border-red-200',     '3-1': 'bg-yellow-50 border-yellow-200',
  '1-2': 'bg-yellow-50 border-yellow-200','2-2': 'bg-yellow-50 border-yellow-200','3-2': 'bg-green-50 border-green-200',
  '1-3': 'bg-yellow-50 border-yellow-200','2-3': 'bg-green-50 border-green-200', '3-3': 'bg-emerald-50 border-emerald-200',
};

export default function NineBoxPage() {
  const [cycleId, setCycleId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [activeCycle, setActiveCycle] = useState('');
  const { data, isLoading } = useNineBoxAssessments(activeCycle);
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const grid = data?.grid ?? {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Nine-Box Grid
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Performance vs Potential matrix</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Assessment
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by Cycle ID (optional)"
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => setActiveCycle(cycleId)}>Apply</Button>
        {activeCycle && <Button variant="ghost" onClick={() => { setActiveCycle(''); setCycleId(''); }}>Clear</Button>}
      </div>

      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : (
        <div className="space-y-6">
          {/* Labels */}
          <div className="relative">
            <p className="text-xs text-muted-foreground text-center mb-2">Performance →</p>
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center mr-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <span className="text-xs text-muted-foreground">Potential →</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                {[3, 2, 1].map((potential) =>
                  [1, 2, 3].map((performance) => {
                    const key = `${performance}-${potential}`;
                    const employees = grid[key] ?? [];
                    return (
                      <div key={key} className={`rounded-lg border-2 p-3 min-h-[100px] ${BOX_COLORS[key] ?? 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xs font-semibold text-center mb-2">{BOX_LABELS[key]}</p>
                        <div className="space-y-1">
                          {employees.map((a: any) => (
                            <div key={a.id} className="text-xs bg-white rounded px-1.5 py-0.5 shadow-sm truncate">
                              {a.employee?.firstName} {a.employee?.lastName}
                            </div>
                          ))}
                        </div>
                        {employees.length === 0 && (
                          <p className="text-center text-muted-foreground text-xs mt-4">—</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1 ml-8">
              <span>Low</span><span>Medium</span><span>High</span>
            </div>
          </div>

          {data?.assessments?.length ? (
            <div>
              <h2 className="text-sm font-semibold mb-2">All Assessments</h2>
              <div className="space-y-2">
                {data.assessments.map((a: any) => (
                  <Card key={a.id} className="border">
                    <CardContent className="py-2 px-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{a.employee?.firstName} {a.employee?.lastName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Perf: {a.performance}</Badge>
                        <Badge variant="outline" className="text-xs">Pot: {a.potential}</Badge>
                        <span className="text-xs text-muted-foreground">{BOX_LABELS[`${a.performance}-${a.potential}`]}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No assessments yet. Add one to populate the grid.
            </div>
          )}
        </div>
      )}

      <AddAssessmentDialog open={showAdd} onClose={() => setShowAdd(false)} currentCycle={activeCycle} />
    </div>
  );
}

function AddAssessmentDialog({ open, onClose, currentCycle }: { open: boolean; onClose: () => void; currentCycle: string }) {
  const [employeeId, setEmployeeId] = useState('');
  const [cycleId, setCycleId] = useState(currentCycle);
  const [performance, setPerformance] = useState('2');
  const [potential, setPotential] = useState('2');
  const [notes, setNotes] = useState('');
  const upsert = useUpsertNineBoxAssessment();

  async function handleSubmit() {
    if (!employeeId || !cycleId) return;
    await upsert.mutateAsync({ employeeId, cycleId, performance: Number(performance), potential: Number(potential), notes: notes || undefined });
    setEmployeeId(''); setNotes('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add / Update Assessment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Employee ID</Label><Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></div>
          <div><Label>Cycle ID</Label><Input value={cycleId} onChange={(e) => setCycleId(e.target.value)} placeholder="e.g. Q1-2026" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Performance (1-3)</Label>
              <select value={performance} onChange={(e) => setPerformance(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
                <option value="1">1 - Low</option><option value="2">2 - Medium</option><option value="3">3 - High</option>
              </select>
            </div>
            <div>
              <Label>Potential (1-3)</Label>
              <select value={potential} onChange={(e) => setPotential(e.target.value)} className="w-full border rounded-md p-2 text-sm mt-1">
                <option value="1">1 - Low</option><option value="2">2 - Medium</option><option value="3">3 - High</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Box: <strong>{BOX_LABELS[`${performance}-${potential}`]}</strong></Label>
          </div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!employeeId || !cycleId || upsert.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
