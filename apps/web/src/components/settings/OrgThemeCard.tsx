import { useState, useRef } from 'react';
import {
  Palette,
  Clock,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  ImageIcon,
  Paintbrush,
} from 'lucide-react';
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
import { useOrgTheme, useRequestOrgTheme, type OrgThemeRequestInput } from '@/hooks/useOrgTheme';
import { useUploadFile } from '@/hooks/useUpload';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

// ── Inline hex color picker ─────────────────────────────────────────────────

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-9 w-9 shrink-0 rounded-md border border-input shadow-sm cursor-pointer overflow-hidden"
          style={{ backgroundColor: isValid ? value : '#e5e7eb' }}
          title="Click to pick colour"
        />
        <input
          ref={inputRef}
          type="color"
          value={isValid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            onChange(v.startsWith('#') ? v : '#' + v);
          }}
          placeholder="#3B82F6"
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
      {value && !isValid && (
        <p className="text-xs text-destructive">Must be a 6-digit hex colour e.g. #3B82F6</p>
      )}
    </div>
  );
}

// ── Sidebar style selector ──────────────────────────────────────────────────

const SIDEBAR_STYLES = [
  { value: 'light', label: 'Light', desc: 'Default light sidebar' },
  { value: 'dark', label: 'Dark', desc: 'Dark slate sidebar' },
  { value: 'branded', label: 'Branded', desc: 'Sidebar uses your primary colour' },
] as const;

interface SidebarStylePickerProps {
  value: string;
  onChange: (v: string) => void;
}

function SidebarStylePicker({ value, onChange }: SidebarStylePickerProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">Sidebar Style</Label>
      <div className="grid grid-cols-3 gap-2">
        {SIDEBAR_STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              value === s.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <p className="text-sm font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Image upload button ────────────────────────────────────────────────────

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: 'logos' | 'documents';
  placeholder?: string;
}

function ImageUploadField({ label, value, onChange, folder, placeholder }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending } = useUploadFile(folder);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload(file, { onSuccess: (res) => onChange(res.url) });
    e.target.value = '';
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://...'}
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isPending ? 'Uploading…' : 'Upload'}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </div>
      {value && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
          <img src={value} alt="Preview" className="h-10 w-10 rounded object-contain bg-white border" />
          <span className="text-xs text-muted-foreground truncate flex-1">{value}</span>
          <button type="button" onClick={() => onChange('')} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Request Theme modal ─────────────────────────────────────────────────────

interface RequestModalProps {
  onClose: () => void;
}

function RequestThemeModal({ onClose }: RequestModalProps) {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryHex, setPrimaryHex] = useState('#2563eb');
  const [sidebarStyle, setSidebarStyle] = useState<'light' | 'dark' | 'branded'>('light');
  const [wantsBgImage, setWantsBgImage] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [cardColor, setCardColor] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  const { mutate, isPending } = useRequestOrgTheme();
  const { mutate: uploadAttachment, isPending: uploadingAttachment } = useUploadFile('documents');
  const attachInputRef = useRef<HTMLInputElement>(null);

  const isValidHex = (h: string) => !h || /^#[0-9A-Fa-f]{6}$/.test(h);

  function handleAddAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAttachment(file, {
      onSuccess: (res) => setAttachmentUrls((prev) => [...prev, res.url]),
    });
    e.target.value = '';
  }

  function handleSubmit() {
    if (!isValidHex(primaryHex) || !isValidHex(backgroundColor) || !isValidHex(cardColor)) return;

    const payload: OrgThemeRequestInput = {
      sidebarStyle,
      wantsBgImage,
      attachmentUrls,
    };
    if (primaryHex && primaryHex !== '#2563eb') payload.preferredPrimaryHex = primaryHex;
    if (logoUrl) payload.logoUrl = logoUrl;
    if (wantsBgImage && bgImageUrl) payload.bgImageUrl = bgImageUrl;
    if (!wantsBgImage && backgroundColor) payload.backgroundColor = backgroundColor;
    if (notes.trim()) payload.notes = notes.trim();

    mutate(payload, { onSuccess: () => onClose() });
  }

  const hasValidationError =
    !isValidHex(primaryHex) || !isValidHex(backgroundColor) || !isValidHex(cardColor);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Organisation Theme Change</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill in what you want changed. The platform administrator will apply it after review.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {/* Logo */}
          <ImageUploadField
            label="Organisation Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            folder="logos"
            placeholder="https://your-cdn.com/logo.png"
          />

          {/* Primary colour */}
          <ColorPicker
            label="Primary Colour (buttons, accents)"
            value={primaryHex}
            onChange={setPrimaryHex}
          />

          {/* Sidebar style */}
          <SidebarStylePicker value={sidebarStyle} onChange={(v) => setSidebarStyle(v as 'light' | 'dark' | 'branded')} />

          {/* Background */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Use Background Image</p>
                <p className="text-xs text-muted-foreground">Replace the default page background with an image</p>
              </div>
              <Switch checked={wantsBgImage} onCheckedChange={setWantsBgImage} />
            </div>

            {wantsBgImage ? (
              <ImageUploadField
                label="Background Image"
                value={bgImageUrl}
                onChange={setBgImageUrl}
                folder="documents"
                placeholder="https://your-cdn.com/background.jpg"
              />
            ) : (
              <ColorPicker
                label="Background Colour (leave blank for default)"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            )}
          </div>

          {/* Card colour */}
          <ColorPicker
            label="Card Background Colour (leave blank for default)"
            value={cardColor}
            onChange={setCardColor}
          />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Notes for Administrator <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. We rebranded — please use our new logo and Indigo as the accent colour"
              className="resize-none text-sm"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Branding attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Branding Files</Label>
                <p className="text-xs text-muted-foreground">Attach brand guidelines, logos, or reference images (max 10)</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={uploadingAttachment || attachmentUrls.length >= 10}
                onClick={() => attachInputRef.current?.click()}
              >
                {uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingAttachment ? 'Uploading…' : 'Add File'}
              </Button>
              <input ref={attachInputRef} type="file" accept="image/*,application/pdf" className="sr-only" onChange={handleAddAttachment} />
            </div>

            {attachmentUrls.length > 0 && (
              <ul className="space-y-1">
                {attachmentUrls.map((url, i) => (
                  <li key={url} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 text-muted-foreground">{url}</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || hasValidationError || uploadingAttachment}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Applied theme summary ───────────────────────────────────────────────────

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded border border-border shadow-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{color}</span>
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────

export function OrgThemeCard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useOrgTheme();
  const [showModal, setShowModal] = useState(false);

  const canRequest = user?.role && HR_ROLES.includes(user.role);
  const pending = data?.pendingRequest;
  const applied = data?.themeConfig;

  return (
    <>
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/40 px-6 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
              <Palette className="h-4 w-4 text-background" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Organisation Theme
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Customise your organisation's look — logo, colours, sidebar style, and background
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded-lg animate-pulse" />
              <div className="h-8 bg-muted rounded-lg animate-pulse w-1/2" />
            </div>
          ) : (
            <>
              {/* Applied theme summary */}
              {applied ? (
                <div className="rounded-xl border bg-muted/50 p-5 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Currently Applied
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {applied.primaryColor && (
                      <ColorSwatch color={applied.primaryColor} label="Primary" />
                    )}
                    {applied.backgroundColor && (
                      <ColorSwatch color={applied.backgroundColor} label="Background" />
                    )}
                    {applied.cardColor && (
                      <ColorSwatch color={applied.cardColor} label="Card" />
                    )}
                    <div className="flex items-center gap-2">
                      <Paintbrush className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">Sidebar:</span>
                      <span className="text-xs font-medium capitalize">{applied.sidebarStyle}</span>
                    </div>
                    {applied.bgImageUrl && (
                      <div className="flex items-center gap-2 col-span-full">
                        <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{applied.bgImageUrl}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(applied.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500 bg-white dark:bg-transparent dark:border-emerald-500 p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Using the default WorkAxis theme. Submit a request to customise it.
                  </p>
                </div>
              )}

              {/* Pending request notice */}
              {pending && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Theme Change Request Pending
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Requested by {pending.requestedBy.firstName} {pending.requestedBy.lastName}
                      {' · '}
                      Submitted {new Date(pending.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {pending.preferredPrimaryHex && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        Requested primary: <span className="font-mono font-bold">{pending.preferredPrimaryHex}</span>
                      </p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      Awaiting review from the platform administrator.
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs">
                    Pending
                  </Badge>
                </div>
              )}

              {/* Action */}
              {canRequest && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    Submit a request with your branding preferences. The platform admin will apply the changes.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!pending}
                    onClick={() => setShowModal(true)}
                    className="shrink-0 ml-4"
                  >
                    {pending ? 'Request Pending' : 'Request Theme Change'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <RequestThemeModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
