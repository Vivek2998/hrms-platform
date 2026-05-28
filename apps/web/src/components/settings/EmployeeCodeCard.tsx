import { useState } from 'react';
import { Hash, Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth.store';
import { useEmpCodeSettings, useRequestEmpCodeChange } from '@/hooks/useEmpCodeSettings';

// ── Request Change modal ───────────────────────────────────────────────────────

interface RequestModalProps {
  currentPrefix: string;
  onClose: () => void;
}

function RequestChangeModal({ currentPrefix, onClose }: RequestModalProps) {
  const [prefix, setPrefix] = useState('');
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');
  const { mutate, isPending } = useRequestEmpCodeChange();

  function handlePrefixChange(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    setPrefix(upper);
    if (upper.length > 0 && upper.length < 2) {
      setValidationError('Prefix must be at least 2 letters');
    } else {
      setValidationError('');
    }
  }

  function handleSubmit() {
    if (prefix.length < 2) {
      setValidationError('Prefix must be at least 2 letters');
      return;
    }
    if (prefix === currentPrefix) {
      setValidationError('This is the same as your current prefix — no change needed');
      return;
    }
    const trimmedReason = reason.trim();
    mutate(
      {
        requestedPrefix: prefix,
        applyToExisting,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Employee Code Prefix Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="font-mono font-bold text-base text-foreground">
                {currentPrefix}-<span className="text-muted-foreground">473</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">New</p>
              <p className="font-mono font-bold text-base text-indigo-600">
                {prefix || '???'}-<span className="text-indigo-400">473</span>
              </p>
            </div>
          </div>

          {/* New prefix input */}
          <div className="space-y-1.5">
            <Label className="text-sm">New Prefix <span className="text-red-500">*</span></Label>
            <Input
              value={prefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="e.g. SSIPL, TCS, INFY"
              className="font-mono uppercase"
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">
              2–5 uppercase letters only (e.g. SSI, SSIPL, TCS, INFY)
            </p>
            {validationError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {validationError}
              </p>
            )}
          </div>

          {/* Apply to existing toggle */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Rename existing employee codes</p>
                <p className="text-xs text-muted-foreground">
                  Updates all current employees to the new prefix
                </p>
              </div>
              <Switch
                checked={applyToExisting}
                onCheckedChange={setApplyToExisting}
              />
            </div>

            {applyToExisting ? (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ All existing employee codes will be renamed. E.g. <span className="font-mono">{currentPrefix}-5</span> → <span className="font-mono">{prefix || '???'}-5</span>. Sequence numbers stay the same.
              </div>
            ) : (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                ℹ️ Only new employees added after approval will get the new prefix. Existing codes are untouched.
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Reason <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Company rebranded from SSI to SSIPL"
              className="resize-none text-sm"
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || prefix.length < 2}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function EmployeeCodeCard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useEmpCodeSettings();
  const [showModal, setShowModal] = useState(false);

  const isAdmin = user?.role === 'ORG_ADMIN';
  const pending = data?.pendingRequest;

  return (
    <>
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/40 px-6 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
              <Hash className="h-4 w-4 text-background" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Employee Code Format
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The prefix used in all employee IDs for your organisation
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-14 bg-muted rounded-lg animate-pulse" />
              <div className="h-8 bg-muted rounded-lg animate-pulse w-1/2" />
            </div>
          ) : data ? (
            <>
              {/* Current format display */}
              <div className="flex items-center gap-6 rounded-xl border bg-muted/50 p-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Prefix</p>
                  <p className="font-mono text-3xl font-bold text-foreground">
                    {data.currentPrefix}
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Example Employee Code</p>
                  <p className="font-mono text-xl font-semibold text-indigo-600">
                    {data.formatExample}
                  </p>
                </div>
              </div>

              {/* Pending request notice */}
              {pending ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Change Request Pending</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Requested prefix: <span className="font-mono font-bold">{pending.requestedPrefix}</span>
                      {pending.applyToExisting && ' (retroactive)'}
                      {' · '} Submitted {new Date(pending.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Awaiting review from the platform administrator.
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs">
                    Pending
                  </Badge>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    No pending changes. Your employee code format is active.
                  </p>
                </div>
              )}

              {/* Action */}
              {isAdmin && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    Only Org Admins can request a prefix change. The request goes to the platform super admin for approval.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!pending}
                    onClick={() => setShowModal(true)}
                    className="shrink-0 ml-4"
                  >
                    {pending ? 'Request Pending' : 'Request Change'}
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {showModal && data && (
        <RequestChangeModal
          currentPrefix={data.currentPrefix}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
