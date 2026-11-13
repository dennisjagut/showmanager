"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";

export type DraftStatus = "clean" | "dirty" | "saving" | "saved" | "invalid" | "error";

// How long "Gespeichert ✓" stays before the save bar disappears
const SAVED_MS = 2000;

/**
 * The draft of one object (a packing list, the templates …): everything is changed here first and saved together with
 * one button, see SaveBar. Leaving the page with changes asks first, Ctrl/Cmd + S saves.
 *
 * `compare` says what differs from the saved state: a number of changes, or just whether something changed.
 * `validate` returns error messages by field key; they are shown after the first attempt to save and from then on
 * updated with every change. Put `form` on the <form> of the editor: Ctrl/Cmd + S submits it like the save button.
 */
export function useDraft<T>({
  initial,
  save,
  compare,
  validate,
}: {
  initial: T;
  save: (draft: T) => Promise<T>;
  compare: (draft: T, saved: T) => number | boolean;
  validate?: (draft: T) => Record<string, string>;
}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [result, setResult] = useState<"saved" | "error" | null>(null);
  const [checking, setChecking] = useState(false);
  // Counts failed attempts, so the first wrong field gets the focus after each one
  const [attempts, setAttempts] = useState(0);
  const [saving, startSaving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const difference = compare(draft, saved);
  const changed = difference !== false && difference !== 0;
  const changes = typeof difference === "number" ? difference : undefined;
  const errors = checking && validate ? validate(draft) : {};
  const errorCount = Object.keys(errors).length;

  let status: DraftStatus = "clean";
  if (saving) status = "saving";
  else if (errorCount > 0) status = "invalid";
  else if (result === "error") status = "error";
  else if (changed) status = "dirty";
  else if (result === "saved") status = "saved";

  function update(next: T | ((current: T) => T)) {
    setDraft(next);
    setResult(null);
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!changed || saving) return;
    if (validate && Object.keys(validate(draft)).length > 0) {
      setChecking(true);
      setAttempts((n) => n + 1);
      return;
    }
    startSaving(async () => {
      try {
        const next = await save(draft);
        setSaved(next);
        setDraft(next);
        setChecking(false);
        setResult("saved");
      } catch {
        setResult("error");
      }
    });
  }

  function discard() {
    setDraft(saved);
    setChecking(false);
    setResult(null);
  }

  useEffect(() => {
    if (attempts > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempts]);

  useEffect(() => {
    if (result !== "saved") return;
    const timer = setTimeout(() => setResult((r) => (r === "saved" ? null : r)), SAVED_MS);
    return () => clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    if (!changed) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);

  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      // Like the save button: the browser checks required fields first
      formRef.current?.requestSubmit();
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return {
    draft,
    saved,
    update,
    changed,
    changes,
    status,
    errors,
    errorCount,
    saving,
    discard,
    form: { ref: formRef, onSubmit: submit },
  };
}
