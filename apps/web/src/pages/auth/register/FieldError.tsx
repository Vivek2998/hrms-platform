export function FieldError({ msg }: { msg: string | undefined }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive">{msg}</p>;
}
