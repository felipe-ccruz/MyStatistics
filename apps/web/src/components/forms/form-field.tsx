import { type ReactNode, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Props to spread on the field's control, wiring it to the label, hint and error. */
export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = {
  label: ReactNode;
  /** Help text under the control (format, defaults). */
  hint?: ReactNode;
  /** Error message, shown under the hint. */
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label + control + hint + error, with the ids and ARIA wired for screen readers.
 * The control comes from a render prop: `{(control) => <Input {...control} {...register("email")} />}`.
 * (The shadcn `form` component is not used: see the phase 4 report.)
 */
export function FormField({ label, hint, error, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5 text-left", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint ? (
        <p id={hintId} className="text-[11px] text-dim">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-hp">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Error shown above a form's fields (wrong credentials, server down...). */
export function FormAlert({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-hp/50 bg-inset px-3 py-2 text-left text-xs text-hp">
      {message}
    </p>
  );
}
