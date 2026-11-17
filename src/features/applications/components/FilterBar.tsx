"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Checkbox, SelectField, TextField, type Option } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { useFestivalOptions, type State } from "@/features/applications/options";
import { APPLICATION_STATUSES } from "@/features/applications/status";

const FILTERS = ["q", "status", "state", "month", "deadline", "inactive"];

export function FilterBar({
  season,
  seasons,
  states,
  soonDays,
}: {
  season: number;
  seasons: number[];
  // Federal states that festivals are in
  states: State[];
  // days ahead in which a deadline counts as "soon"
  soonDays: number;
}) {
  const t = useTranslations("filters");
  const ts = useTranslations("applicationStatus");
  const tStates = useTranslations("states");
  const options = useFestivalOptions();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  function update(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Apply the search with a slight delay
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: search || null }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const select = (name: string, label: string, options: Option[], empty: string | null = t("all")) => (
    <SelectField
      label={label}
      inputClassName="py-1.5"
      value={params.get(name) ?? ""}
      onChange={(e) => update({ [name]: e.target.value || null })}
      options={[...(empty ? [{ value: "", label: empty }] : []), ...options]}
    />
  );

  const hasFilter = FILTERS.some((k) => params.has(k));

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 card p-3 transition-opacity sm:grid-cols-3 lg:grid-cols-[2fr_repeat(6,minmax(0,1fr))]",
        pending && "opacity-70",
      )}
    >
      <TextField
        label={t("search")}
        className="col-span-2 sm:col-span-3 lg:col-span-1"
        inputClassName="py-1.5"
        type="search"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <SelectField
        label={t("season")}
        inputClassName="py-1.5 font-semibold"
        value={season}
        onChange={(e) => update({ season: e.target.value })}
        options={seasons.map((s) => ({ value: s, label: String(s) }))}
      />
      {select(
        "status",
        t("status"),
        APPLICATION_STATUSES.map((s) => ({ value: s, label: ts(s) })),
      )}
      {select(
        "state",
        t("state"),
        states.map((s) => ({ value: s, label: tStates(s) })),
      )}
      {select("month", t("festivalMonth"), options.months)}
      {select("deadline", t("deadline"), [
        { value: "soon", label: t("deadlineSoon", { days: soonDays }) },
        { value: "passed", label: t("deadlinePassed") },
        { value: "known", label: t("deadlineKnown") },
      ])}
      {select(
        "sort",
        t("sort"),
        [
          { value: "deadline", label: t("sortDeadline") },
          { value: "month", label: t("sortMonth") },
          { value: "status", label: t("sortStatus") },
          { value: "applied", label: t("sortApplied") },
        ],
        t("sortName"),
      )}
      <div className="col-span-2 flex flex-wrap items-center gap-4 text-sm sm:col-span-3 lg:col-span-7">
        <Checkbox
          label={t("showInactive")}
          checked={params.get("inactive") === "1"}
          onChange={(e) => update({ inactive: e.target.checked ? "1" : null })}
        />
        {hasFilter && (
          <button
            type="button"
            className="text-sm link"
            onClick={() => {
              setSearch("");
              update(Object.fromEntries(FILTERS.map((k) => [k, null])));
            }}
          >
            {t("reset")}
          </button>
        )}
      </div>
    </div>
  );
}
