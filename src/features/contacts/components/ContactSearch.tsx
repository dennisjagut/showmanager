"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { TextField } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

// Search field of the contact list; the search goes into the URL (?q=) with a slight delay, the other filters stay
export function ContactSearch() {
  const t = useTranslations("contacts");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, params, pathname, router]);

  return (
    <TextField
      label={t("search")}
      type="search"
      placeholder={t("searchPlaceholder")}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className={cn("min-w-56 flex-1 transition-opacity", pending && "opacity-70")}
      inputClassName="py-1.5"
    />
  );
}
