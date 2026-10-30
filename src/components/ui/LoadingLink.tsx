"use client";

import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

function Indicator() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-3.5 w-3.5 shrink-0" /> : null;
}

// Link that shows a small spinner while the page changes
export function LoadingLink({ children, className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn("inline-flex items-center gap-1.5", className)}>
      {children}
      <Indicator />
    </Link>
  );
}
