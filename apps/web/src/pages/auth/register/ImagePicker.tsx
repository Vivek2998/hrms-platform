import { useState, useRef, useEffect } from 'react';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ImageMode = 'file' | 'url';

export function ImagePicker({
  file,
  url,
  onFileChange,
  onUrlChange,
  accept,
  maxLabel,
  urlPlaceholder,
  uploadNote,
  previewShape = 'contain',
}: {
  file: File | null;
  url: string;
  onFileChange: (f: File | null) => void;
  onUrlChange: (u: string) => void;
  accept: string;
  maxLabel: string;
  urlPlaceholder: string;
  uploadNote: string;
  previewShape?: 'contain' | 'cover';
}) {
  const [mode, setMode] = useState<ImageMode>('file');
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }
    const next = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next;
    return () => {
      URL.revokeObjectURL(next);
      objectUrlRef.current = null;
    };
  }, [file]);

  return (
    <div className="space-y-2.5">
      <div className="flex rounded-md border border-input overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors ${
            mode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors ${
            mode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          <LinkIcon className="h-3 w-3" />
          Paste URL
        </button>
      </div>

      {mode === 'file' ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <img
                src={objectUrlRef.current ?? undefined}
                alt="Preview"
                className={`h-10 w-16 rounded-md border bg-white ${previewShape === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => { onFileChange(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-5 transition-colors hover:bg-muted/40 hover:border-primary/50"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">Click to upload</p>
                <p className="text-[11px] text-muted-foreground">{maxLabel}</p>
              </div>
            </button>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">{uploadNote}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={urlPlaceholder}
              className="h-9 text-sm"
            />
            {url && (
              <button
                type="button"
                onClick={() => onUrlChange('')}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Clear URL"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {url && (
            <div className="mt-2">
              <img
                src={url}
                alt="Preview"
                className={`h-16 w-full rounded-lg border bg-muted ${previewShape === 'cover' ? 'object-cover' : 'object-contain'}`}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
