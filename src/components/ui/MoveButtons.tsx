"use client";

const MOVE =
  "flex h-4 w-7 items-center justify-center text-xs leading-none text-zinc-500 hover:text-zinc-900 disabled:opacity-20 pointer-coarse:h-5 dark:hover:text-zinc-100";

// ▲ and ▼ to move an entry of a list one place up or down; disabled at the start and the end
export function MoveButtons({
  index,
  count,
  labels,
  onMove,
}: {
  index: number;
  count: number;
  labels: { up: string; down: string };
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label={labels.up} className={MOVE}>
        ▲
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={labels.down}
        className={MOVE}
      >
        ▼
      </button>
    </div>
  );
}
