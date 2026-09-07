interface FieldLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
}

export function FieldLabel({ children, htmlFor, optional }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
    >
      {children}
      {optional && (
        <span className="ml-1 normal-case tracking-normal font-normal text-muted-foreground/70">
          (optional)
        </span>
      )}
    </label>
  );
}
