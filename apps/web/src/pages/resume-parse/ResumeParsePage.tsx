import { useState } from 'react';
import { FileSearch, Plus, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  useParsedResumes,
  useParsedResume,
  useUploadResume,
  useReparseResume,
} from '@/hooks/useResumeParse';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  PARSED: { label: 'Parsed', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

function ResumeDetail({ id }: { id: string }) {
  const { data, isLoading } = useParsedResume(id);
  const reparse = useReparseResume();

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3 border-t pt-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!data?.parsedData) {
    return (
      <div className="mt-3 border-t pt-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">No parsed data available.</p>
        {data?.status === 'FAILED' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => reparse.mutate(id)}
            disabled={reparse.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-parse
          </Button>
        )}
      </div>
    );
  }

  const pd = data.parsedData;

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {pd.name && (
          <>
            <span className="text-muted-foreground font-medium">Name</span>
            <span>{pd.name}</span>
          </>
        )}
        {pd.email && (
          <>
            <span className="text-muted-foreground font-medium">Email</span>
            <span>{pd.email}</span>
          </>
        )}
        {pd.phone && (
          <>
            <span className="text-muted-foreground font-medium">Phone</span>
            <span>{pd.phone}</span>
          </>
        )}
        {pd.experienceYears != null && (
          <>
            <span className="text-muted-foreground font-medium">Experience</span>
            <span>{pd.experienceYears} years</span>
          </>
        )}
      </div>
      {pd.skills?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {pd.skills.map((skill: string) => (
              <span
                key={skill}
                className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {pd.education?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Education</p>
          <ul className="space-y-0.5">
            {pd.education.map((edu: any, i: number) => (
              <li key={i} className="text-sm text-muted-foreground">
                {edu.degree}
                {edu.institution ? ` — ${edu.institution}` : ''}
                {edu.year ? `, ${edu.year}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResumeParsePage() {
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: resumes = [], isLoading } = useParsedResumes();
  const uploadResume = useUploadResume();

  const [showUpload, setShowUpload] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ fileName: '', fileUrl: '', text: '' });

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

  async function handleUpload() {
    if (!form.fileName || !form.fileUrl) return;
    await uploadResume.mutateAsync({
      fileName: form.fileName,
      fileUrl: form.fileUrl,
      text: form.text,
    });
    setForm({ fileName: '', fileUrl: '', text: '' });
    setShowUpload(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <FileSearch className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Resume Parsing</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered candidate resume data extraction
            </p>
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Upload Resume
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileSearch className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No resumes uploaded</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a resume to extract candidate information automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume: any) => {
            const meta = STATUS_META[resume.status] ?? STATUS_META['PENDING'];
            const isOpen = expanded === resume.id;
            return (
              <Card key={resume.id} className="border shadow-sm">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{resume.fileName}</p>
                        <Badge variant="outline" className={`text-xs ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(resume.createdAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                    {resume.status !== 'PENDING' && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : resume.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {isOpen && <ResumeDetail id={resume.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File Name *</Label>
              <Input
                placeholder="e.g. priya_sharma_resume.pdf"
                value={form.fileName}
                onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))}
              />
            </div>
            <div>
              <Label>File URL *</Label>
              <Input
                placeholder="https://res.cloudinary.com/..."
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label>Resume Text Content</Label>
              <Textarea
                placeholder="Paste the full text content of the resume here for parsing…"
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                rows={8}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!form.fileName || !form.fileUrl || uploadResume.isPending}
            >
              {uploadResume.isPending ? 'Uploading…' : 'Upload & Parse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
