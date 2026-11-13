import Link from "next/link";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { setPackingMark } from "@/features/shows/actions";
import type { ShowPacking } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type Group = ShowPacking["groups"][number];
type Entry = Group["items"][number];

// Two checkboxes per item: packed for the trip there, and packed again after the show
const STAGES = [
  { id: "packed", label: "stagePacked", hint: "stagePackedHint", on: "markPacked", off: "markUnpacked" },
  { id: "repacked", label: "stageRepacked", hint: "stageRepackedHint", on: "markRepacked", off: "markUnrepacked" },
] as const;

const CHECKED = {
  packed: "border-brand-600 bg-brand-600 text-white",
  repacked: "border-emerald-600 bg-emerald-600 text-white",
};

const COLUMN = "flex w-8 shrink-0 justify-center";

function progress(items: Entry[]) {
  return {
    packed: items.filter((i) => i.packed).length,
    repacked: items.filter((i) => i.repacked).length,
    total: items.length,
  };
}

function PackingItems({ showId, items }: { showId: number; items: Entry[] }) {
  const t = useTranslations("show");
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {items.map((entry) => {
        const { item } = entry;
        return (
          <li key={item.id} className="flex items-center gap-1 py-0.5 text-sm">
            {STAGES.map((stage) => {
              const done = entry[stage.id];
              return (
                <ActionButton
                  key={stage.id}
                  action={setPackingMark}
                  values={{ showId, itemId: item.id, stage: stage.id, done: String(!done) }}
                  aria-pressed={done}
                  aria-label={t(done ? stage.off : stage.on, { name: item.name })}
                  title={t(stage.hint)}
                  formClassName={COLUMN}
                  className="flex items-center justify-center p-1.5"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      done ? CHECKED[stage.id] : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900",
                    )}
                  >
                    {done && <Icon name="check" className="h-3.5 w-3.5" />}
                  </span>
                </ActionButton>
              );
            })}
            <span className={cn("flex-1 pl-1", entry.packed && entry.repacked && "text-zinc-400")}>
              {item.quantity > 1 && <span className="font-medium tabular-nums">{item.quantity}× </span>}
              {item.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// The show's packing list from the master data, by category. Each item is checked off twice: when packing for the
// trip to the show, and when packing again after it.
export function PackingListCard({ showId, packing }: { showId: number; packing: ShowPacking | null }) {
  const t = useTranslations("show");
  const tp = useTranslations("packingLists");

  if (!packing) {
    return (
      <Card title={t("packingList")}>
        <p className="text-sm text-zinc-500">
          {t("noPackingList")}{" "}
          <Link href={`/shows/${showId}/edit`} className="link">
            {t("choosePackingList")}
          </Link>
        </p>
      </Card>
    );
  }

  const { packingList: list, groups } = packing;
  const total = progress(groups.flatMap((g) => g.items));
  // Only with categories the items without one get a heading
  const headings = groups.some((g) => g.category);

  return (
    <Card
      title={`${t("packingList")}: ${list.name}`}
      actions={
        total.total > 0 && (
          <span
            className={cn(
              "text-sm whitespace-nowrap tabular-nums",
              total.repacked === total.total ? "font-medium text-emerald-600" : "text-zinc-500",
            )}
          >
            {t("packingProgress", total)}
          </span>
        )
      }
    >
      {total.total === 0 && <p className="text-sm text-zinc-500">{t("packingListEmpty", { name: list.name })}</p>}
      {total.total > 0 && (
        <div className="flex gap-1 text-[11px] font-medium text-zinc-500">
          {STAGES.map((stage) => (
            <span key={stage.id} title={t(stage.hint)} className={COLUMN}>
              {t(stage.label)}
            </span>
          ))}
        </div>
      )}
      {groups.map((group) => {
        const { packed, repacked, total: count } = progress(group.items);
        return (
          <section key={group.category?.id ?? "uncategorized"}>
            {headings && (
              <h3
                className={cn(
                  "flex items-baseline justify-between gap-2 border-b border-zinc-200 pt-1 pb-1 text-xs font-semibold tracking-wide uppercase dark:border-zinc-700",
                  repacked === count ? "text-emerald-600" : "text-zinc-500",
                )}
              >
                <span>{group.category?.name ?? tp("uncategorized")}</span>
                <span className="tabular-nums">{t("packedCategory", { packed, repacked, total: count })}</span>
              </h3>
            )}
            <PackingItems showId={showId} items={group.items} />
          </section>
        );
      })}
      <Link href={`/masterdata/packing-lists/${list.id}`} className="block text-sm link">
        {t("editPackingList")}
      </Link>
    </Card>
  );
}
