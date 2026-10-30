import Link from "next/link";
import { cn } from "@/lib/cn";

const WIDTH = { narrow: "max-w-2xl", medium: "max-w-3xl", full: "" };

// Frame of every page: width and spacing between the blocks
export function Page({
  width = "full",
  className,
  children,
}: {
  width?: keyof typeof WIDTH;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto space-y-6", WIDTH[width], className)}>{children}</div>;
}

// Title of a page with an optional back link, description and buttons on the right
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {back && <BackLink href={back.href}>{back.label}</BackLink>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="text-sm text-zinc-500">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm link">
      {children}
    </Link>
  );
}
