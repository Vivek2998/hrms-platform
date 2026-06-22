import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Briefcase, Plus, MapPin, Users, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useJobs, useCreateJob, useUpdateJob, useDeleteJob,
  useApplications, useApply, useUpdateApplicationStage,
  type ApplicationStage, type JobStatus,
} from '@/hooks/useRecruitment';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const STAGE_COLORS: Record<ApplicationStage, string> = {
  APPLIED: 'bg-gray-100 text-gray-600',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW: 'bg-blue-100 text-blue-700',
  OFFER: 'bg-purple-100 text-purple-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  OPEN: 'bg-green-100 text-green-700',
  FILLED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const STAGES: ApplicationStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

function CreateJobDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: '', location: '', employmentType: 'FULL_TIME', description: '', requirements: '', openings: 1, minSalary: '', maxSalary: '', closingDate: '' },
  });
  const { mutateAsync, isPending } = useCreateJob();

  async function onSubmit(data: any) {
    try {
      await mutateAsync({
        title: data.title,
        location: data.location || undefined,
        employmentType: data.employmentType,
        description: data.description,
        requirements: data.requirements || undefined,
        openings: Number(data.openings),
        minSalary: data.minSalary ? Number(data.minSalary) : null,
        maxSalary: data.maxSalary ? Number(data.maxSalary) : null,
        closingDate: data.closingDate || undefined,
      });
      toast.success('Job posted');
      reset();
      onClose();
    } catch {
      toast.error('Failed to post job');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Post a Job</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Job Title *</Label><Input {...register('title', { required: true })} placeholder="e.g. Senior Software Engineer" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={watch('employmentType')} onValueChange={(v) => { setValue('employmentType', v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERN">Internship</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Openings</Label><Input type="number" min={1} {...register('openings')} /></div>
          </div>
          <div className="space-y-1"><Label>Location</Label><Input {...register('location')} placeholder="e.g. Bangalore, Remote" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Min Salary (₹)</Label><Input type="number" {...register('minSalary')} /></div>
            <div className="space-y-1"><Label>Max Salary (₹)</Label><Input type="number" {...register('maxSalary')} /></div>
          </div>
          <div className="space-y-1"><Label>Description *</Label><Textarea {...register('description', { required: true })} rows={3} placeholder="Role overview..." /></div>
          <div className="space-y-1"><Label>Requirements</Label><Textarea {...register('requirements')} rows={2} placeholder="Must-have qualifications..." /></div>
          <div className="space-y-1"><Label>Closing Date</Label><Input type="date" {...register('closingDate')} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}Post Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApplyDialog({ jobId, jobTitle, open, onClose }: { jobId: string; jobTitle: string; open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { candidateName: '', candidateEmail: '', candidatePhone: '', coverLetter: '', source: '' } });
  const { mutateAsync, isPending } = useApply();

  async function onSubmit(data: any) {
    try {
      await mutateAsync({ jobId, ...data, candidatePhone: data.candidatePhone || undefined, coverLetter: data.coverLetter || undefined, source: data.source || undefined });
      toast.success('Application submitted');
      reset();
      onClose();
    } catch {
      toast.error('Failed to submit application');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Apply for: {jobTitle}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Candidate Name *</Label><Input {...register('candidateName', { required: true })} /></div>
          <div className="space-y-1"><Label>Email *</Label><Input type="email" {...register('candidateEmail', { required: true })} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input {...register('candidatePhone')} /></div>
          <div className="space-y-1"><Label>Source</Label>
            <Input {...register('source')} placeholder="e.g. LinkedIn, Referral, Job Portal" />
          </div>
          <div className="space-y-1"><Label>Cover Letter</Label><Textarea {...register('coverLetter')} rows={3} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobOpeningsTab() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [applyState, setApplyState] = useState<{ jobId: string; title: string } | null>(null);
  const { data: jobs, isLoading } = useJobs();
  const { mutateAsync: updateJob } = useUpdateJob();
  const { mutateAsync: deleteJob } = useDeleteJob();

  return (
    <div className="space-y-4">
      {isHR && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setCreateOpen(true); }}><Plus className="h-4 w-4" />Post Job</Button>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-muted h-28 animate-pulse rounded-lg" />)}</div>
      ) : !jobs?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Briefcase className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No job postings yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', JOB_STATUS_COLORS[job.status])}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground text-xs flex-wrap">
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      <span>{job.employmentType.replace('_', ' ')}</span>
                      <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                      {job._count && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job._count.applications} applicants</span>}
                    </div>
                    {(job.minSalary || job.maxSalary) && (
                      <p className="text-xs text-green-700 mt-1">
                        ₹{job.minSalary?.toLocaleString('en-IN') ?? '?'} – ₹{job.maxSalary?.toLocaleString('en-IN') ?? '?'} / year
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isHR ? (
                      <>
                        <Select value={job.status} onValueChange={(v) => { void updateJob({ id: job.id, status: v as JobStatus }); }}>
                          <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="FILLED">Filled</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs" onClick={() => { void deleteJob(job.id); }}>Remove</Button>
                      </>
                    ) : (
                      job.status === 'OPEN' && (
                        <Button size="sm" onClick={() => { setApplyState({ jobId: job.id, title: job.title }); }}>Apply</Button>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              {job.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      {isHR && createOpen && <CreateJobDialog open={createOpen} onClose={() => { setCreateOpen(false); }} />}
      {applyState && (
        <ApplyDialog
          jobId={applyState.jobId}
          jobTitle={applyState.title}
          open={!!applyState}
          onClose={() => { setApplyState(null); }}
        />
      )}
    </div>
  );
}

function ApplicationsTab() {
  const [stageFilter, setStageFilter] = useSessionStorageState<ApplicationStage | 'ALL'>('recruitment_stage', 'ALL');
  const { data: applications, isLoading } = useApplications(undefined, stageFilter === 'ALL' ? undefined : stageFilter);
  const { mutateAsync: updateStage } = useUpdateApplicationStage();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="shrink-0">Filter by stage:</Label>
        <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v as any); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />)}</div>
      ) : !applications?.length ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Users className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No applications yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base">{app.candidateName}</CardTitle>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap">
                      <span>{app.candidateEmail}</span>
                      {app.job && <span>· {app.job.title}</span>}
                      {app.source && <span>· via {app.source}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STAGE_COLORS[app.stage])}>
                      {app.stage}
                    </span>
                    <Select
                      value={app.stage}
                      onValueChange={(v) => { void updateStage({ id: app.id, stage: v as ApplicationStage }); }}
                    >
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Move to..." /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecruitmentPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = HR_ROLES.includes(role ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recruitment</h1>
        <p className="text-muted-foreground">Job postings and candidate pipeline</p>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Job Openings</TabsTrigger>
          {isHR && <TabsTrigger value="applications">Applications</TabsTrigger>}
        </TabsList>
        <TabsContent value="jobs" className="mt-4"><JobOpeningsTab /></TabsContent>
        {isHR && <TabsContent value="applications" className="mt-4"><ApplicationsTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
