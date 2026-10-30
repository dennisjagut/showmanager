"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "saving" | "error";

const DELAY_MS = 600;

/**
 * Saves input shortly after the last keystroke. Per key (inquiry, single item) only the latest state counts;
 * when leaving the page, everything pending is sent immediately.
 */
export function useAutosave() {
  const pending = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; send: () => Promise<void> }>());
  const running = useRef(0);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const run = useCallback((send: () => Promise<void>) => {
    running.current++;
    setStatus("saving");
    send().then(
      () => {
        running.current--;
        if (running.current === 0 && pending.current.size === 0) setStatus("saved");
      },
      () => {
        running.current--;
        setStatus("error");
      },
    );
  }, []);

  const cancel = useCallback((key?: string) => {
    for (const [k, p] of pending.current) {
      if (key === undefined || k === key) {
        clearTimeout(p.timer);
        pending.current.delete(k);
      }
    }
  }, []);

  const schedule = useCallback(
    (key: string, send: () => Promise<void>) => {
      cancel(key);
      setStatus("saving");
      const timer = setTimeout(() => {
        pending.current.delete(key);
        run(send);
      }, DELAY_MS);
      pending.current.set(key, { timer, send });
    },
    [cancel, run],
  );

  useEffect(() => {
    const open = pending.current;
    const sendAll = () => {
      for (const [k, p] of open) {
        clearTimeout(p.timer);
        open.delete(k);
        void p.send();
      }
    };
    window.addEventListener("pagehide", sendAll);
    return () => {
      window.removeEventListener("pagehide", sendAll);
      sendAll();
    };
  }, []);

  return { schedule, cancel, run, status };
}
