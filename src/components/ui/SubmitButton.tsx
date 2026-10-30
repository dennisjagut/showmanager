"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * Submit button with a loading indicator: while the Server Action runs, a spinner turns and the button is disabled
 * (prevents double clicks). With `confirm`, the user has to confirm first.
 */
export function SubmitButton({
  children,
  confirm,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirm?: string }) {
  const { pending, action } = useFormStatus();
  // With several buttons in one form (formAction), only mark the one that was clicked
  const active = pending && (!props.formAction || action === props.formAction);

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={active}
      className={cn("relative disabled:cursor-wait", className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
        props.onClick?.(e);
      }}
    >
      {active && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
      <span className={`inline-flex items-center gap-1.5 ${active ? "invisible" : ""}`}>{children}</span>
    </button>
  );
}
