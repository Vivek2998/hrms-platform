import { useState } from 'react';
import {
  FileText, Image, ExternalLink, Trash2, CheckCircle2, XCircle,
  Upload, AlertTriangle, Clock, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useDocuments,
  useDeleteDocument,
  useApproveDocument,
  useRejectDocument,
  DOC_TYPE_LABELS,
  type EmployeeDocument,
  type DocumentStatus,
} from '@/hooks/useDocuments';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  employeeId: string;
  /** When true shows Approve/Reject actions and can manage any document */
  isHRView?: boolean;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType?: string, url?: string) {
  if (mimeType?.startsWith('image/')) return true;
  if (url) {
    const lower = url.toLowerCase();
    return lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp');
  }
  return false;
}

function DocIcon({ mimeType, url }: { mimeType?: string | undefined; url: string }) {
  if (isImage(mimeType, url)) {
    return <Image className="h-5 w-5 shrink-0 text-blue-500" />;
  }
  return <FileText className="h-5 w-5 shrink-0 text-slate-400" />;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  if (status === 'APPROVED') {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-[10px] py-0 px-1.5 gap-1">
        <ShieldCheck className="h-2.5 w-2.5" />
        Approved
      </Badge>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-[10px] py-0 px-1.5 gap-1">
        <XCircle className="h-2.5 w-2.5" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] py-0 px-1.5 gap-1">
      <Clock className="h-2.5 w-2.5" />
      Pending
    </Badge>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt?: string | null | undefined }) {
  if (!expiresAt) return null;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-[10px] py-0 px-1.5 gap-1">
        <AlertTriangle className="h-2.5 w-2.5" />
        Expired
      </Badge>
    );
  }
  if (daysLeft <= 30) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] py-0 px-1.5 gap-1">
        <AlertTriangle className="h-2.5 w-2.5" />
        Expires in {daysLeft}d
      </Badge>
    );
  }
  return null;
}

// Hierarchy: Admin approves HR docs; HR approves Employee/Manager docs
function canApproveDoc(viewerRole: string | undefined, uploaderRole: string): boolean {
  if (viewerRole === 'SUPER_ADMIN' || viewerRole === 'ORG_ADMIN') return true;
  if (viewerRole === 'HR' && (uploaderRole === 'EMPLOYEE' || uploaderRole === 'MANAGER')) return true;
  return false;
}

export function EmployeeDocuments({ employeeId, isHRView = false }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const { data: documents = [], isLoading } = useDocuments(employeeId);
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument(employeeId);
  const { mutate: approveDoc, isPending: isApproving } = useApproveDocument(employeeId);
  const { mutate: rejectDoc, isPending: isRejecting } = useRejectDocument(employeeId);
  const viewerRole = currentUser?.role;

  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EmployeeDocument | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  const isOwnProfile = currentUser?.id === employeeId;
  const canUpload = isHRView || isOwnProfile;

  function handleDelete() {
    if (!deleteId) return;
    deleteDoc(deleteId, { onSuccess: () => setDeleteId(null) });
  }

  function handleRejectSubmit() {
    if (!rejectTarget || !rejectNotes.trim()) return;
    rejectDoc(
      { id: rejectTarget.id, notes: rejectNotes.trim() },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectNotes('');
        },
      },
    );
  }

  function canDelete(doc: EmployeeDocument) {
    if (viewerRole === 'SUPER_ADMIN' || viewerRole === 'ORG_ADMIN') return true;
    if (viewerRole === 'HR' && canApproveDoc(viewerRole, doc.uploaderRole ?? 'EMPLOYEE')) return true;
    // Employees/Managers can only delete their own pending docs
    return doc.employeeId === currentUser?.id && doc.status === 'PENDING_APPROVAL';
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Documents
          </CardTitle>
          {canUpload && (
            <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              {canUpload && (
                <Button size="sm" variant="outline" className="mt-1" onClick={() => setShowUpload(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload first document
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5">
                    <DocIcon mimeType={doc.mimeType} url={doc.url} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <StatusBadge status={doc.status} />
                      <ExpiryBadge expiresAt={doc.expiresAt} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                      {doc.size ? ` · ${formatBytes(doc.size)}` : ''}
                      {' · '}
                      {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                    {doc.status === 'PENDING_APPROVAL' && !isHRView && (
                      <p className="mt-0.5 text-[11px] text-amber-600">
                        {doc.uploaderRole === 'HR'
                          ? 'Awaiting Admin approval'
                          : 'Awaiting HR / Admin approval'}
                      </p>
                    )}
                    {doc.status === 'REJECTED' && doc.notes && (
                      <p className="mt-1 text-xs text-red-600 italic">Reason: {doc.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {/* Approve / Reject — hierarchy-aware */}
                    {isHRView && doc.status === 'PENDING_APPROVAL' && (() => {
                      const hasAuthority = canApproveDoc(viewerRole, doc.uploaderRole ?? 'EMPLOYEE');
                      if (hasAuthority) {
                        return (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve"
                              disabled={isApproving}
                              onClick={() => approveDoc(doc.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Reject"
                              disabled={isRejecting}
                              onClick={() => { setRejectTarget(doc); setRejectNotes(''); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        );
                      }
                      // HR viewing an HR-uploaded doc — only Admin can approve
                      return (
                        <span className="text-[10px] text-amber-600 font-medium px-1">
                          Admin only
                        </span>
                      );
                    })()}

                    {/* Preview (images) */}
                    {isImage(doc.mimeType, doc.url) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Preview"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Open link */}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Open document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    {/* Delete */}
                    {canDelete(doc) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                        title="Delete"
                        disabled={isDeleting}
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <DocumentUploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        employeeId={employeeId}
      />

      {/* Delete confirm dialog */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject reason dialog */}
      <Dialog open={Boolean(rejectTarget)} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectNotes(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label>Reason for rejection <span className="text-destructive">*</span></Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Explain why this document is being rejected…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectNotes.trim() || isRejecting}
            >
              {isRejecting ? 'Rejecting…' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(o) => { if (!o) setPreviewDoc(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
