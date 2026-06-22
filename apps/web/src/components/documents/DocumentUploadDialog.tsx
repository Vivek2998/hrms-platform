import { useState, useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadFile } from '@/hooks/useUpload';
import {
  useCreateDocument,
  DOC_CATEGORIES,
  PERSONAL_DOC_CATEGORIES,
  DOC_TYPE_LABELS,
  type DocumentType,
} from '@/hooks/useDocuments';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  /** When true, restricts doc types to personal documents only (PAN, Aadhaar, etc.) */
  personalOnly?: boolean;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadDialog({ open, onOpenChange, employeeId, personalOnly = false }: Props) {
  const [docType, setDocType] = useState<DocumentType>('ID_PROOF');
  const [docName, setDocName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadFile, isPending: isUploading } = useUploadFile('documents');
  const { mutate: createDocument, isPending: isSaving } = useCreateDocument();

  const isPending = isUploading || isSaving;

  // Reset to first allowed type when personalOnly changes
  const defaultType: DocumentType = personalOnly ? 'ID_PROOF' : 'OFFER_LETTER';

  function handleClose() {
    if (isPending) return;
    setDocType(defaultType);
    setDocName('');
    setExpiresAt('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    // Auto-fill document name from filename (strip extension)
    if (picked && !docName) {
      const nameWithoutExt = picked.name.replace(/\.[^/.]+$/, '');
      setDocName(nameWithoutExt);
    }
  }

  function handleSubmit() {
    if (!file || !docName.trim()) return;
    uploadFile(file, {
      onSuccess: ({ url }) => {
        createDocument(
          {
            employeeId,
            type: docType,
            name: docName.trim(),
            url,
            size: file.size,
            ...(file.type ? { mimeType: file.type } : {}),
            ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
          },
          {
            onSuccess: () => handleClose(),
          },
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{personalOnly ? 'Upload Personal Document' : 'Upload Document'}</DialogTitle>
          {personalOnly && (
            <p className="text-xs text-muted-foreground mt-1">
              Upload your personal identity and supporting documents. These will be reviewed by HR.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Document Type */}
          <div className="space-y-1.5">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(personalOnly ? PERSONAL_DOC_CATEGORIES : DOC_CATEGORIES).map((cat) => (
                  <SelectGroup key={cat.label}>
                    <SelectLabel className="text-xs text-muted-foreground">{cat.label}</SelectLabel>
                    {cat.types.map((t) => (
                      <SelectItem key={t} value={t}>{DOC_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {personalOnly && (
              <p className="text-[11px] text-muted-foreground">
                e.g. name your document "PAN Card" or "Aadhaar Card" in the name field below
              </p>
            )}
          </div>

          {/* File picker */}
          <div className="space-y-1.5">
            <Label>File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted cursor-pointer"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>

          {/* Document Name */}
          <div className="space-y-1.5">
            <Label>Document Name</Label>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Aadhaar Card"
              className="h-9"
            />
          </div>

          {/* Expiry Date (optional) */}
          <div className="space-y-1.5">
            <Label>
              Expiry Date <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-9"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || !docName.trim() || isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
            ) : (
              <><Upload className="h-4 w-4" />Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
