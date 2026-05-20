import { useState } from 'react';
import { Users, Plus, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useHiringDrives,
  useDriveCandidates,
  useCreateDrive,
  useAddCandidate,
  useBulkImportCandidates,
  useUpdateCandidateStatus,
} from '@/hooks/useHiringDrives';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DRIVE_TYPE_META: Record<string, { label: string; className: string }> = {
  CAMPUS: { label: 'Campus', className: 'bg-blue-100 text-blue-700' },
  WALKIN: { label: 'Walk-in', className: 'bg-purple-100 text-purple-700' },
  LATERAL: { label: 'Lateral', className: 'bg-orange-100 text-orange-700' },
  REFERRAL_DRIVE: { label: 'Referral', className: 'bg-green-100 text-green-700' },
};

const CANDIDATE_STATUSES = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'OFFERED'];

export default function HiringDrivesPage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: drives = [], isLoading: drivesLoading } = useHiringDrives();
  const createDrive = useCreateDrive();
  const addCandidate = useAddCandidate();
  const bulkImport = useBulkImportCandidates();
  const updateCandidateStatus = useUpdateCandidateStatus();

  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [showCreateDrive, setShowCreateDrive] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  const { data: candidates = [], isLoading: candidatesLoading } = useDriveCandidates(selectedDriveId);

  const [driveForm, setDriveForm] = useState({
    name: '',
    type: 'CAMPUS',
    date: '',
    targetCount: '',
    description: '',
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    resume: '',
  });

  if (!isHR) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-32">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This page is available to HR and administrators only.
        </p>
      </div>
    );
  }

  async function handleCreateDrive() {
    if (!driveForm.name || !driveForm.date) return;
    await createDrive.mutateAsync({
      name: driveForm.name,
      type: driveForm.type,
      date: driveForm.date,
      targetCount: driveForm.targetCount ? Number(driveForm.targetCount) : undefined,
      description: driveForm.description || undefined,
    });
    setDriveForm({ name: '', type: 'CAMPUS', date: '', targetCount: '', description: '' });
    setShowCreateDrive(false);
  }

  async function handleAddCandidate() {
    if (!selectedDriveId || !candidateForm.name) return;
    await addCandidate.mutateAsync({
      driveId: selectedDriveId,
      name: candidateForm.name,
      email: candidateForm.email || undefined,
      phone: candidateForm.phone || undefined,
      resumeUrl: candidateForm.resume || undefined,
    });
    setCandidateForm({ name: '', email: '', phone: '', resume: '' });
    setShowAddCandidate(false);
  }

  async function handleBulkImport() {
    if (!selectedDriveId) return;
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array');
      await bulkImport.mutateAsync({ driveId: selectedDriveId, candidates: parsed });
      setBulkJson('');
      setShowBulkImport(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Invalid JSON format');
    }
  }

  const selectedDrive = drives.find((d: any) => d.id === selectedDriveId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Hiring Drives</h1>
            <p className="text-sm text-muted-foreground">
              Bulk and campus recruitment management
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDrive(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Drive
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Drives list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            All Drives
          </h2>
          {drivesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : drives.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No hiring drives yet</p>
            </div>
          ) : (
            drives.map((drive: any) => {
              const typeMeta = DRIVE_TYPE_META[drive.type] ?? DRIVE_TYPE_META['CAMPUS'];
              return (
                <Card
                  key={drive.id}
                  className={`cursor-pointer transition-colors ${
                    selectedDriveId === drive.id
                      ? 'border-primary ring-1 ring-primary'
                      : 'hover:border-muted-foreground/40'
                  }`}
                  onClick={() =>
                    setSelectedDriveId(drive.id === selectedDriveId ? null : drive.id)
                  }
                >
                  <CardContent className="pt-3 pb-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{drive.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {drive.date ? format(new Date(drive.date), 'dd MMM yyyy') : '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${typeMeta.className}`}>
                            {typeMeta.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {drive.candidateCount ?? 0} / {drive.targetCount ?? '∞'} candidates
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Candidates panel */}
        <div className="lg:col-span-3">
          {!selectedDriveId ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed bg-muted/20 text-center">
              <Users className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select a drive to view candidates
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedDrive?.name} — Candidates</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setShowBulkImport(true)}
                    >
                      <Upload className="h-3.5 w-3.5" /> Bulk Import
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => setShowAddCandidate(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">
                    No candidates yet. Add individually or bulk import.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Name</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Contact</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {candidates.map((c: any) => (
                          <tr key={c.id} className="hover:bg-muted/20">
                            <td className="py-2 font-medium">{c.name}</td>
                            <td className="py-2 text-muted-foreground text-xs">
                              {c.email && <div>{c.email}</div>}
                              {c.phone && <div>{c.phone}</div>}
                            </td>
                            <td className="py-2">
                              <Select
                                value={c.status}
                                onValueChange={(val) =>
                                  updateCandidateStatus.mutate({
                                    driveId: selectedDriveId!,
                                    candidateId: c.id,
                                    status: val,
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 text-xs w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CANDIDATE_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Drive Dialog */}
      <Dialog open={showCreateDrive} onOpenChange={setShowCreateDrive}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Hiring Drive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Drive Name *</Label>
              <Input
                placeholder="e.g. Campus Hiring 2025 — IIT Bombay"
                value={driveForm.name}
                onChange={(e) => setDriveForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select
                  value={driveForm.type}
                  onValueChange={(v) => setDriveForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DRIVE_TYPE_META).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={driveForm.date}
                  onChange={(e) => setDriveForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Target Headcount</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={driveForm.targetCount}
                onChange={(e) => setDriveForm((f) => ({ ...f, targetCount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Drive details, roles targeted, etc."
                value={driveForm.description}
                onChange={(e) => setDriveForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDrive(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDrive}
              disabled={!driveForm.name || !driveForm.date || createDrive.isPending}
            >
              {createDrive.isPending ? 'Creating…' : 'Create Drive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={showAddCandidate} onOpenChange={setShowAddCandidate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={candidateForm.name}
                onChange={(e) => setCandidateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={candidateForm.phone}
                  onChange={(e) => setCandidateForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Resume URL</Label>
              <Input
                placeholder="https://..."
                value={candidateForm.resume}
                onChange={(e) => setCandidateForm((f) => ({ ...f, resume: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCandidate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCandidate}
              disabled={!candidateForm.name || addCandidate.isPending}
            >
              {addCandidate.isPending ? 'Adding…' : 'Add Candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Import Candidates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a JSON array of candidates. Each object should have{' '}
              <code className="bg-muted px-1 rounded text-xs">name</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">email</code>, and optionally{' '}
              <code className="bg-muted px-1 rounded text-xs">phone</code>.
            </p>
            <Textarea
              placeholder={`[\n  { "name": "Ravi Kumar", "email": "ravi@example.com", "phone": "9876543210" }\n]`}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImport(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={!bulkJson.trim() || bulkImport.isPending}>
              {bulkImport.isPending ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
