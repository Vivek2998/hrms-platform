import { useState, useRef, useEffect } from 'react';
import { FileSignature, Send, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useMySignatureRequests,
  usePendingSignatures,
  useCreateSignatureRequest,
  useSignDocument,
  useDeclineSignature,
  useDeleteSignatureRequest,
} from '@/hooks/useESignature';
import { formatDistanceToNow, format } from 'date-fns';
import type { ESignatureRequest } from '@hrms/shared-types';

type Tab = 'pending' | 'sent';

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Awaiting Signature', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  SIGNED: { label: 'Signed', color: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200' },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function ESignaturePage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [showRequest, setShowRequest] = useState(false);
  const [signTarget, setSignTarget] = useState<ESignatureRequest | null>(null);

  const { data: pending, isLoading: loadingPending } = usePendingSignatures();
  const { data: sent, isLoading: loadingSent } = useMySignatureRequests();
  const decline = useDeclineSignature();
  const del = useDeleteSignatureRequest();

  const items = tab === 'pending' ? pending : sent;
  const isLoading = tab === 'pending' ? loadingPending : loadingSent;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-violet-600" />
            E-Signatures
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Sign and track document signature requests</p>
        </div>
        <Button onClick={() => setShowRequest(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Send className="w-4 h-4 mr-2" />
          Request Signature
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['pending', 'Needs My Signature'], ['sent', 'My Requests']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-background border-border text-muted-foreground hover:border-violet-400'
            }`}
          >
            {label}
            {t === 'pending' && pending && pending.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <FileSignature className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="font-semibold">
            {tab === 'pending' ? 'No documents waiting for your signature' : 'No signature requests sent yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => {
            const meta = STATUS_META[req.status] ?? STATUS_META.PENDING;
            return (
              <Card key={req.id} className="border shadow-sm">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate">{req.documentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tab === 'pending'
                          ? `Requested by ${req.requester.firstName} ${req.requester.lastName}`
                          : `To sign: ${req.signer.firstName} ${req.signer.lastName}`}
                      </p>
                      {req.message && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>
                      )}
                      {req.signedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Signed {format(new Date(req.signedAt), 'dd MMM yyyy HH:mm')}
                        </p>
                      )}
                      {req.declineReason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {req.declineReason}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      <a
                        href={req.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Doc
                      </a>
                      {tab === 'pending' && req.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => decline.mutate({ id: req.id })}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => setSignTarget(req)}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Sign
                          </Button>
                        </div>
                      )}
                      {tab === 'sent' && req.status === 'PENDING' && (
                        <button
                          onClick={() => del.mutate(req.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RequestSignatureDialog open={showRequest} onClose={() => setShowRequest(false)} />
      {signTarget && (
        <SignDocumentDialog
          request={signTarget}
          onClose={() => setSignTarget(null)}
        />
      )}
    </div>
  );
}

// ── Request Signature Dialog ──────────────────────────────────────────────────

function RequestSignatureDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [toId, setToId] = useState('');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [message, setMessage] = useState('');
  const create = useCreateSignatureRequest();

  async function handleSubmit() {
    if (!toId.trim() || !docName.trim() || !docUrl.trim()) return;
    await create.mutateAsync({
      requestedTo: toId.trim(),
      documentName: docName.trim(),
      documentUrl: docUrl.trim(),
      message: message.trim() || undefined,
    });
    setToId(''); setDocName(''); setDocUrl(''); setMessage('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request E-Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Signer Employee ID</Label>
            <Input placeholder="Employee UUID" value={toId} onChange={(e) => setToId(e.target.value)} />
          </div>
          <div>
            <Label>Document Name</Label>
            <Input placeholder="e.g. Offer Letter FY2025" value={docName} onChange={(e) => setDocName(e.target.value)} />
          </div>
          <div>
            <Label>Document URL</Label>
            <Input placeholder="https://..." value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
          </div>
          <div>
            <Label>Message (optional)</Label>
            <Textarea placeholder="Please review and sign this document" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!toId.trim() || !docName.trim() || !docUrl.trim() || create.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sign Document Dialog ──────────────────────────────────────────────────────

function SignDocumentDialog({ request, onClose }: { request: ESignatureRequest; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const sign = useSignDocument();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e1e2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  }

  function onEnd() { setDrawing(false); }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  async function handleSign() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSig) return;
    const dataUrl = canvas.toDataURL('image/png');
    await sign.mutateAsync({ id: request.id, signatureImageUrl: dataUrl });
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Signing: <span className="font-semibold text-foreground">{request.documentName}</span>
          </p>
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={onStart}
              onMouseMove={onMove}
              onMouseUp={onEnd}
              onTouchStart={onStart}
              onTouchMove={onMove}
              onTouchEnd={onEnd}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Draw your signature above</p>
          <Button variant="outline" size="sm" onClick={clear} className="w-full">Clear</Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSign}
            disabled={!hasSig || sign.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
