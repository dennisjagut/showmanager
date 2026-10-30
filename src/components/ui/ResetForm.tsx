"use client";

import { useRef } from "react";

// Form for Server Actions that clears itself after submitting (for "add" rows)
export function ResetForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      action={async (formData) => {
        await action(formData);
        ref.current?.reset();
        ref.current?.querySelector<HTMLInputElement>("[autofocus], input:not([type=hidden])")?.focus();
      }}
    >
      {children}
    </form>
  );
}
